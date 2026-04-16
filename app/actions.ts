"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

const prisma = new PrismaClient();

// --- 1. STUDENT MANAGEMENT ---
export async function getStudents() {
  return await prisma.student.findMany({
    include: { incidents: true },
    orderBy: { name: 'asc' }
  });
}

export async function getStudentProfile(id: string) {
  return await prisma.student.findUnique({
    where: { id },
    include: { incidents: { orderBy: { date: 'asc' } } }
  });
}

export async function addStudent(formData: FormData) {
  const name = formData.get("name") as string;
  await prisma.student.create({ data: { name } });
  revalidatePath("/students");
}

export async function deleteStudent(idOrFormData: string | FormData) {
  const id = typeof idOrFormData === "string" ? idOrFormData : idOrFormData.get("id") as string;
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
}

// FIX: Updated to accept FormData so the bulk textarea works!
export async function addMultipleStudents(formData: FormData) {
  const namesRaw = formData.get("names") as string;
  if (!namesRaw) return;

  // Split names by line, clean up whitespace, and ignore empty lines
  const namesArray = namesRaw
    .split("\n")
    .map(name => name.trim())
    .filter(name => name !== "");

  const data = namesArray.map(name => ({ name }));
  await prisma.student.createMany({ data });
  revalidatePath("/students");
}

export async function saveStudentExemptions(formData: FormData) {
  const id = formData.get("id") as string;
  const exemptions = formData.get("exemptions") as string;
  await prisma.student.update({ where: { id }, data: { exemptions } });
  revalidatePath(`/students/${id}`);
}

// --- 2. SETTINGS & CLASS MANAGEMENT ---
export async function getClasses() {
  return await prisma.classSetting.findMany({ orderBy: { periodNum: 'asc' } });
}

export async function saveClass(formData: FormData) {
  const id = formData.get("id") as string;
  const periodNum = parseInt(formData.get("periodNum") as string);
  const hebrewName = formData.get("hebrewName") as string;
  const durationMin = parseInt(formData.get("durationMin") as string);

  if (id) {
    await prisma.classSetting.update({ where: { id }, data: { periodNum, hebrewName, durationMin } });
  } else {
    await prisma.classSetting.create({ data: { periodNum, hebrewName, durationMin } });
  }
  revalidatePath("/settings");
}

export async function deleteClass(idOrFormData: string | FormData) {
  const id = typeof idOrFormData === "string" ? idOrFormData : idOrFormData.get("id") as string;
  await prisma.classSetting.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function getGlobalSettings() {
  let settings = await prisma.globalSetting.findFirst();
  if (!settings) {
    settings = await prisma.globalSetting.create({ data: { absenceFee: 5, testFailFee: 10 } });
  }
  return settings;
}

export async function saveGlobalSettings(formData: FormData) {
  const id = formData.get("id") as string;
  const absenceFee = parseFloat(formData.get("absenceFee") as string);
  const testFailFee = parseFloat(formData.get("testFailFee") as string);

  await prisma.globalSetting.update({
    where: { id },
    data: { absenceFee, testFailFee }
  });
  revalidatePath("/settings");
}

// --- 3. CHARGE & LEDGER ACTIONS ---
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

export async function deleteCharge(idOrFormData: string | FormData) {
  const id = typeof idOrFormData === "string" ? idOrFormData : idOrFormData.get("id") as string;
  const record = await prisma.incident.findUnique({ where: { id }, select: { studentId: true } });
  await prisma.incident.delete({ where: { id } });
  if (record) revalidatePath(`/students/${record.studentId}`);
}

// --- 4. THE AI-POWERED PDF PARSER ---
export async function processPdfForStudent(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const weekLabel = formData.get("weekLabel") as string;
  const file = formData.get("file") as File;
  
  if (!file || !studentId) return { error: "Missing data" };

  try {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDocument = await loadingTask.promise;
    
    let text = "";
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      text += textContent.items.map((item: any) => (item as any).str).join(" ") + "\n";
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a strict school billing engine.
          RULES:
          1. TESTS (%): If score < 70%, charge exactly $10.00.
          2. EXCUSED: 'e', 'De', or '타' = $0.
          3. ABSENCES (Π): Std = $5.00, Period 22 = $10.00.
          4. LATES: Std > 5m = $1.00. Period 22: $1 per 10m.
          Return JSON: {"incidents": [{"date": "YYYY-MM-DD", "className": "string", "type": "TEST"|"ABSENCE"|"LATE", "fee": number, "notes": "string"}]}`
        },
        { role: "user", content: `Text: ${text}` }
      ]
    });

    const parsed = JSON.parse(aiResponse.choices[0].message.content || '{"incidents": []}');
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