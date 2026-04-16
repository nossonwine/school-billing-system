"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

const prisma = new PrismaClient();

// --- 1. CLASS SETTINGS ---
export async function getClasses() {
  return await prisma.classSetting.findMany({ orderBy: { periodNum: 'asc' } });
}

export async function saveClass(formData: FormData) {
  const period = parseInt(formData.get("period") as string);
  const name = formData.get("name") as string;
  const mins = parseInt(formData.get("mins") as string);

  await prisma.classSetting.upsert({
    where: { periodNum: period },
    update: { hebrewName: name, durationMin: mins, orderIndex: period },
    create: { periodNum: period, hebrewName: name, durationMin: mins, orderIndex: period }
  });
  revalidatePath("/settings");
}

export async function deleteClass(id: string) {
  await prisma.classSetting.delete({ where: { id } });
  revalidatePath("/settings");
}

// --- 2. GLOBAL FEES ENGINE ---
export async function getGlobalSettings() {
  let settings = await prisma.globalSetting.findFirst();
  if (!settings) {
    settings = await prisma.globalSetting.create({ data: {} });
  }
  return settings;
}

export async function saveGlobalSettings(formData: FormData) {
  const absenceFee = parseFloat(formData.get("absenceFee") as string);
  const lateTier1Fee = parseFloat(formData.get("lateTier1Fee") as string);
  const testFailFee = parseFloat(formData.get("testFailFee") as string);

 const settings = await prisma.globalSetting.findFirst();
  if (settings) {
    await prisma.globalSetting.update({
      where: { id: settings.id },
      data: { absenceFee, lateTier1Fee, testFailFee }
    });
  } else {
    await prisma.globalSetting.create({
      data: { absenceFee, lateTier1Fee, testFailFee }
    });
  }
  revalidatePath("/settings");
}

// --- 3. STUDENT DIRECTORY ---
export async function getStudents() {
  return await prisma.student.findMany({ orderBy: { name: "asc" } });
}

export async function addStudent(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return;
  await prisma.student.create({ data: { name } });
  revalidatePath("/students");
}

export async function addMultipleStudents(formData: FormData) {
  const namesBlock = formData.get("names") as string;
  if (!namesBlock) return;
  const nameList = namesBlock.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);
  await prisma.student.createMany({ data: nameList.map(name => ({ name })) });
  revalidatePath("/students");
}

export async function deleteStudent(id: string) {
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
}

// --- 4. INDIVIDUAL STUDENT PROFILE ---
export async function getStudentProfile(id: string) {
  return await prisma.student.findUnique({
    where: { id },
    include: { incidents: { orderBy: { date: 'desc' } } }
  });
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
  const type = formData.get("type") as string;
  const feeCalculated = parseFloat(formData.get("fee") as string);
  const notes = formData.get("notes") as string;

  await prisma.incident.create({
    data: { studentId, date, className, type, feeCalculated, notes }
  });
  revalidatePath(`/students/${studentId}`);
}

export async function updateChargePayment(formData: FormData) {
  const id = formData.get("id") as string;
  const studentId = formData.get("studentId") as string;
  const amountPaid = parseFloat(formData.get("amountPaid") as string) || 0;
  const isExcused = formData.get("isExcused") === "on"; 

  await prisma.incident.update({
    where: { id },
    data: { amountPaid, isExcused, feeCalculated: isExcused ? 0 : undefined }
  });
  revalidatePath(`/students/${studentId}`);
}

export async function deleteCharge(formData: FormData) {
  const id = formData.get("id") as string;
  const studentId = formData.get("studentId") as string;
  await prisma.incident.delete({ where: { id } });
  revalidatePath(`/students/${studentId}`);
}

// --- 5. THE AI-POWERED PDF PARSER ---
export async function processPdfForStudent(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const file = formData.get("file") as File;
  
  if (!file || !studentId) return { error: "Missing file or student" };

  const arrayBuffer = await file.arrayBuffer();

  try {
    // 1. EXTRACT RAW TEXT FROM PDF
    if (typeof global.DOMMatrix === "undefined") {
      global.DOMMatrix = class DOMMatrix {} as any;
    }
    // @ts-ignore
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDocument = await loadingTask.promise;
    
    let text = "";
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      text += pageText + "\n";
    }

    // 2. GET DB SETTINGS TO FEED TO THE AI
    const classes = await prisma.classSetting.findMany();
    const classRules = classes.map(c => `Period ${c.periodNum} (${c.hebrewName}): ${c.durationMin} minutes`).join(", ");

    // 3. SEND TO OPENAI FOR INTELLIGENT PROCESSING
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a flawless school billing data extraction engine. You read raw PDF text exports and calculate fees strictly based on these rules. 
          
          THE DATA FORMAT:
          1. Test Scores (בחינות): Formatted like 'date, score, out of 100, percentage'.
          2. Attendance Grid: Formatted with dates (e.g., 'Wed, 9/17/25') followed by symbols (Π, numbers, e). The columns represent class periods. Period 22 is 'Lights Out'.
          
          THE RULES:
          - FAILED TESTS: If a percentage is strictly LESS THAN 70% (e.g., 49%, 14%), charge exactly $10.00. (Type: "TEST").
          - EXCUSED: Any mark with 'e', 'De', or '타' is EXCUSED. Skip it completely. $0.
          - ABSENCES: 'Π' means absent. Standard class = $5.00. Period 22 (Lights Out) = $10.00. (Type: "ABSENCE").
          - LATES: Numbers mean minutes late. 
             * Period 22 (Lights Out): Charge $1.00 per full 10 minutes late (e.g., 20m = $2).
             * Standard Class: If late >= half class duration, charge $3.00. If late >= 5 minutes (but less than half), charge $1.00. Less than 5 mins = $0. (Type: "LATE").
          
          CLASS DURATIONS: ${classRules}. Period 22 is 100 minutes.

          RETURN STRICT JSON:
          {
            "incidents": [
              { "date": "YYYY-MM-DD", "className": "Class Name", "type": "TEST" | "ABSENCE" | "LATE", "fee": number, "notes": "Reasoning" }
            ]
          }`
        },
        {
          role: "user",
          content: `Extract the billable incidents from this text:\n\n${text}`
        }
      ]
    });
    
    const parsedData = JSON.parse(aiResponse.choices[0].message.content || '{"incidents": []}');
    const incidents = parsedData.incidents;

    // 4. SAVE EXTRACTED DATA TO DATABASE
    for (const incident of incidents) {
      if (incident.fee > 0) {
        await prisma.incident.create({
          data: {
            studentId,
            date: new Date(incident.date),
            className: incident.className,
            type: incident.type,
            feeCalculated: incident.fee,
            notes: incident.notes
          }
        });
      }
    }

    revalidatePath(`/students/${studentId}`);
    return { success: true, studentId };

  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw new Error("Failed to process the PDF via AI.");
  }
}