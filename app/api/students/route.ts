import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const students = await prisma.student.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });
  return NextResponse.json(students);
}