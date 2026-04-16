import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. CREATE ADMIN ACCOUNT
    await prisma.user.upsert({
      where: { username: "ymtpomona@gmail.com" },
      update: { password: "Moshiach49", role: "ADMIN" },
      create: { username: "ymtpomona@gmail.com", password: "Moshiach49", role: "ADMIN" }
    });

    // 2. THE MASTER LIST
    const parentAccounts = [
      { name: "Shmuel Elmaleh", password: "mt1" },
      { name: "Yoel Osdoba", password: "mt2" },
      { name: "Moshe Yitzchok Epelbaum", password: "mt3" },
      { name: "Levi Baras", password: "mt4" },
      { name: "Zev Baskin", password: "mt5" },
      { name: "Eli Best", password: "mt6" },
      { name: "Mendy Goldstein", password: "mt7" },
      { name: "Mendel Goldstein", password: "mt8" },
      { name: "Sholom Goldstein", password: "mt9" },
      { name: "Ari Goodman", password: "mt10" },
      { name: "Chaim Gutnick", password: "mt11" },
      { name: "Zalmen Gurevitch", password: "mt12" },
      { name: "Bentzi Greenberg", password: "mt13" },
      { name: "Sruli Drew", password: "mt14" },
      { name: "Shmuel Hecht", password: "mt15" },
      { name: "Gabi Herman", password: "mt16" },
      { name: "Yossi Hershkop", password: "mt17" },
      { name: "Benny Volovik", password: "mt18" },
      { name: "Ruvi Wineberg", password: "mt19" },
      { name: "Nosson Weinfeld", password: "mt20" },
      { name: "Effy Weiss", password: "mt21" },
      { name: "Schneur Vigler", password: "mt22" },
      { name: "Leyzer Wilhelm", password: "mt23" },
      { name: "Mendel Weinfeld", password: "mt24" },
      { name: "Tzvi Werde", password: "mt25" },
      { name: "Zalmen Zurkovsky", password: "mt26" },
      { name: "Nochum Dovid Zelenko", password: "mt27" },
      { name: "Levi Chadad", password: "mt28" },
      { name: "Dovid Leib Chein", password: "mt29" },
      { name: "Levi Hassine", password: "mt30" },
      { name: "Menachem Chetzroni", password: "mt31" },
      { name: "Levi Taichman", password: "mt32" },
      { name: "Choni Israel", password: "mt33" },
      { name: "Michoel Cohen", password: "mt34" },
      { name: "Ari Leiblich", password: "mt35" },
      { name: "Chaim Leeds", password: "mt36" },
      { name: "Gavriel Levin", password: "mt37" },
      { name: "Eli Mizrachi", password: "mt38" },
      { name: "Mendel Menkes", password: "mt39" },
      { name: "Hershy Neuman", password: "mt40" },
      { name: "Zalmen Sorritchov", password: "mt41" },
      { name: "Mordy Sorritchov", password: "mt42" },
      { name: "Sruli Sorritchov", password: "mt43" },
      { name: "Avremel Sirota", password: "mt44" },
      { name: "Berel Emlen", password: "mt45" },
      { name: "Menachem Plotkin", password: "mt46" },
      { name: "Mendel Feldman", password: "mt47" },
      { name: "Natan Perez", password: "mt48" },
      { name: "Mordechai Zucker", password: "mt49" },
      { name: "Sholom Kasowitz", password: "mt50" },
      { name: "Chaim Yitzchok Klein", password: "mt51" },
      { name: "Menachem Klein", password: "mt52" },
      { name: "Yisroel Dovid Keller", password: "mt53" },
      { name: "Yisroel Kaplan", password: "mt54" },
      { name: "Yoel Raskin", password: "mt55" },
      { name: "Moshe Rosenshain", password: "mt56" },
      { name: "Pinchas Romani", password: "mt57" },
      { name: "Chaim Rimler", password: "mt58" },
      { name: "Yehuda Leib Rapapport", password: "mt59" },
      { name: "Shloimy Shvartzbord", password: "mt60" },
      { name: "Eli Stock", password: "mt61" },
      { name: "Yisroel Stein", password: "mt62" },
      { name: "Dovid Steinmetz", password: "mt63" },
      { name: "Hudi Steinmetz", password: "mt64" },
      { name: "Moishie Shein", password: "mt65" },
      { name: "Yosef Shkedi", password: "mt66" }
    ];

    // 3. INJECT ACCOUNTS
    for (const parent of parentAccounts) {
      // Ensure the student exists in the database
      const student = await prisma.student.upsert({
        where: { name: parent.name },
        update: {},
        create: { name: parent.name }
      });

      // Tie a login account directly to that student
      await prisma.user.upsert({
        where: { username: parent.name },
        update: { password: parent.password, studentId: student.id, role: "PARENT" },
        create: { username: parent.name, password: parent.password, studentId: student.id, role: "PARENT" }
      });
    }

    return NextResponse.json({ success: true, message: "All 66 students and Admin successfully seeded!" });

  } catch (error) {
    console.error("Seeding Error:", error);
    return NextResponse.json({ success: false, error: "Failed to seed database." }, { status: 500 });
  }
}