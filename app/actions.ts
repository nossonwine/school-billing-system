"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

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

// --- 5. THE REAL PDF PARSER (ADVANCED ENGINE) ---
export async function processPdfForStudent(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const file = formData.get("file") as File;
  
  if (!file || !studentId) return { error: "Missing file or student" };

  const arrayBuffer = await file.arrayBuffer();

  try {
    // --- LAZY LOAD PDF ENGINE ---
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

    // 1. PULL DATABASE SETTINGS FOR ACCURATE MATH
    const classes = await prisma.classSetting.findMany();
    // Create a map to quickly look up a class name and duration by its period number
    const classMap = new Map(classes.map(c => [c.periodNum.toString(), { name: c.hebrewName, duration: c.durationMin }]));

    const lines = text.split('\n');
    let currentDate = new Date(); // Fallback date
    
    // 2. PARSE TESTS (< 70% = $10)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Try to catch the date right above the score in the raw text
      const dateMatch = line.match(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s(\d{1,2}\/\d{1,2}\/\d{2})/);
      if (dateMatch) {
        currentDate = new Date(dateMatch[2]);
      }

      if (line.includes("out of 100") || line.includes("%")) {
        const gradeMatch = line.match(/(\d{1,3})%/);
        if (gradeMatch) {
          const grade = parseInt(gradeMatch[1]);
          if (grade < 70) {
            await prisma.incident.create({
              data: { 
                studentId, date: currentDate, className: "בחינות (Test)", 
                type: "FAILED_TEST", feeCalculated: 10.00, 
                notes: `Test score of ${grade}% (Below 70%)` 
              }
            });
          }
        }
      }
    }

    // 3. PARSE THE GRID (PAGE 3)
    const gridDateRegex = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(\d{1,2}\/\d{1,2}\/\d{2})/;
    
    // Hardcoding the column mapping based on your PDF header logic (0, 1, 6, 2, 7, 8, 9, 10, 12, 14, 13, 15, 16, 20, 21, 22, 23)
    // This connects the cell index to the Period Number
    const columnToPeriodMap = ["0", "1", "6", "2", "7", "8", "9", "10", "12", "14", "13", "15", "16", "20", "21", "22", "23"];

    for (const line of lines) {
      const dateMatch = line.match(gridDateRegex);
      if (!dateMatch) continue;

      const incidentDate = new Date(dateMatch[2]);
      
      // Clean up the line and split by commas
      const cells = line.split('","').map(c => c.replace(/"/g, '').trim());
      
      // Skip the first cell (the date itself)
      for (let colIndex = 1; colIndex < cells.length; colIndex++) {
        const cellValue = cells[colIndex];
        if (!cellValue) continue;

        // RULE: Ignore any mark with an 'e' (Excused)
        if (cellValue.toLowerCase().includes('e') || cellValue.includes('De') || cellValue.includes('타')) {
          continue; // $0 charge, completely skipped
        }

        const periodNum = columnToPeriodMap[colIndex - 1] || "Unknown";
        const classData = classMap.get(periodNum) || { name: `Period ${periodNum}`, duration: 60 };
        const isLightsOut = periodNum === "22";

        // RULE: ABSENCES (Π)
        if (cellValue.includes('Π')) {
          const fee = isLightsOut ? 10.00 : 5.00;
          await prisma.incident.create({
            data: { 
              studentId, date: incidentDate, className: classData.name, 
              type: "ABSENCE", feeCalculated: fee, notes: isLightsOut ? "Unexcused Absence (Lights Out)" : "Unexcused Absence" 
            }
          });
        } 
        // RULE: LATES / LEFT EARLY (Numbers representing minutes)
        else {
          const minutesMatch = cellValue.match(/\d+/);
          if (minutesMatch) {
            const minutes = parseInt(minutesMatch[0]);
            if (minutes > 0) {
              let fee = 0;
              let note = "";

              if (isLightsOut) {
                // Lights out: $1 per 10 minutes
                fee = Math.floor(minutes / 10) * 1.00;
                note = `${minutes} mins late ($1 per 10m)`;
              } else {
                // Standard Class Lateness
                if (minutes >= classData.duration / 2) {
                  fee = 3.00;
                  note = `${minutes} mins late (Half class missed)`;
                } else if (minutes >= 5) {
                  fee = 1.00;
                  note = `${minutes} mins late (Passed 5m threshold)`;
                } else {
                   // Under 5 minutes late or left early without penalty trigger
                   fee = 0.00;
                   note = `${minutes} mins missed (No fee applied)`;
                }
              }

              if (fee > 0 || note.includes("No fee applied")) {
                await prisma.incident.create({
                  data: { 
                    studentId, date: incidentDate, className: classData.name, 
                    type: "LATE/MISSED", feeCalculated: fee, notes: note 
                  }
                });
              }
            }
          }
        }
      }
    }

    revalidatePath(`/students/${studentId}`);
    return { success: true, studentId };

  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw new Error("Failed to process the PDF.");
  }
}