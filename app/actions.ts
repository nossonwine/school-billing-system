"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

const prisma = new PrismaClient();

export async function getStudentProfile(id: string) {
  return await prisma.student.findUnique({
    where: { id },
    include: { incidents: { orderBy: { date: 'asc' } } }
  });
}

export async function getClasses() {
  return await prisma.classSetting.findMany({ orderBy: { periodNum: 'asc' } });
}

export async function saveStudentExemptions(formData: FormData) {
  const id = formData.get("id") as string;
  const exemptions = formData.get("exemptions") as string;
  await prisma.student.update({ where: { id }, data: { exemptions } });
  revalidatePath(`/students/${id}`);
}

export async function addManualCharge(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const date = new Date(formData.get("date") as string);
  const className = formData.get("className") as string;
  const type = formData.get("type") as any;
  const fee = parseFloat(formData.get("fee") as string);
  const notes = formData.get("notes") as string;

  await prisma.incident.create({
    data: { studentId, date, className, type, feeCalculated: fee, notes }
  });
  revalidatePath(`/students/${studentId}`);
}

export async function updateChargePayment(formData: FormData) {
  const id = formData.get("id") as string;
  const studentId = formData.get("studentId") as string;
  const amountPaid = parseFloat(formData.get("amountPaid") as string);
  const isExcused = formData.get("isExcused") === "on";

  await prisma.incident.update({
    where: { id },
    data: { amountPaid, isExcused: !!isExcused }
  });
  revalidatePath(`/students/${studentId}`);
}

export async function deleteCharge(formData: FormData) {
  const id = formData.get("id") as string;
  const studentId = formData.get("studentId") as string;
  await prisma.incident.delete({ where: { id } });
  revalidatePath(`/students/${studentId}`);
}

export async function processPdfForStudent(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const weekLabel = formData.get("weekLabel") as string;
  const file = formData.get("file") as File;
  
  if (!file || !studentId) return { error: "Missing data" };

  try {
    const arrayBuffer = await file.arrayBuffer();
    if (typeof global.DOMMatrix === "undefined") { global.DOMMatrix = class DOMMatrix {} as any; }
    // @ts-ignore
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDocument = await loadingTask.promise;
    
    let text = "";
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      text += textContent.items.map((item: any) => item.str).join(" ") + "\n";
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a billing engine. RULES: 
          1. TEST < 70% = $10 fee. 
          2. ABSENCE (Π): Standard = $5, Period 22 (Lights Out) = $10. 
          3. LATE: Standard > 5m = $1. Period 22: $1 per 10m.
          4. EXCUSED (e, De, 타) = $0 fee.
          Return JSON: {"incidents": [{"date": "YYYY-MM-DD", "className": "string", "type": "TEST"|"ABSENCE"|"LATE", "fee": number, "notes": "string"}]}`
        },
        { role: "user", content: `Process: ${text}` }
      ]
    });

    const parsed = JSON.parse(aiResponse.choices[0].message.content || '{"incidents":[]}');

    for (const item of parsed.incidents) {
      if (item.fee > 0) {
        await prisma.incident.create({
          data: {
            studentId,
            date: new Date(item.date),
            className: item.className,
            type: item.type,
            feeCalculated: item.fee,
            notes: weekLabel ? `[${weekLabel}] ${item.notes}` : item.notes
          }
        });
      }
    }

    revalidatePath(`/students/${studentId}`);
    return { success: true, studentId };
  } catch (e) {
    return { error: "Failed" };
  }
}