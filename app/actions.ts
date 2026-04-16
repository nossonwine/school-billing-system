"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- MAGIC FIX FOR PDF SERVER PARSING ---
if (typeof global.DOMMatrix === "undefined") {
  global.DOMMatrix = class DOMMatrix {} as any;
}
// ----------------------------------------

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

  let settings = await prisma.globalSetting.findFirst();
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

// --- 5. THE REAL PDF PARSER ---
export async function processPdfForStudent(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const file = formData.get("file") as File;
  
  if (!file || !studentId) return { error: "Missing file or student" };

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // IMPENETRABLE UNWRAPPER: Safely extract the function from Turbopack's grip
  const rawPdfModule = require('pdf-parse');
  let pdf;
  
  if (typeof rawPdfModule === 'function') {
    pdf = rawPdfModule;
  } else if (rawPdfModule && typeof rawPdfModule.default === 'function') {
    pdf = rawPdfModule.default;
  } else if (rawPdfModule && typeof rawPdfModule.pdfParse === 'function') {
    pdf = rawPdfModule.pdfParse;
  } else {
    throw new Error("Turbopack completely mangled pdf-parse. Cannot find function.");
  }

  const data = await pdf(buffer);
  const text = data.text as string;

  const lines = text.split('\n');
  let lateCount = 0;
  let absentCount = 0;

  lines.forEach(line => {
    if (line.includes('#')) lateCount++;
    if (line.includes('Π')) absentCount++;
  });

  if (lateCount > 0) {
    await prisma.incident.create({
      data: { studentId, date: new Date(), className: "Parsed PDF Lateness", type: "LATE", feeCalculated: lateCount * 1.00, notes: `Found ${lateCount} late marks (#) in report.` }
    });
  }
  
  if (absentCount > 0) {
    await prisma.incident.create({
      data: { studentId, date: new Date(), className: "Parsed PDF Absence", type: "ABSENCE", feeCalculated: absentCount * 5.00, notes: `Found ${absentCount} absence marks (Π) in report.` }
    });
  }

  revalidatePath(`/students/${studentId}`);
  
  return { success: true, studentId };
}