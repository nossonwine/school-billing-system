import pdf from "pdf-parse";

export async function processSchoolPDF(fileBuffer: Buffer) {
  const data = await pdf(fileBuffer);
  const text = data.text;

  // This logic scans for specific Hebrew patterns in the Clever Bees PDF
  const lines = text.split('\n');
  const results: any[] = [];

  // 1. Identify Student Name
  const nameMatch = text.match(/שם התלמיד:\s*(.*)/);
  const studentName = nameMatch ? nameMatch[1].trim() : "Unknown";

  // 2. Scan for Symbols in the Grid
  // Π = Absent (Hebrew letter Pi/Chet variant)
  // # = Late
  lines.forEach((line, index) => {
    if (line.includes("Π")) {
      results.push({
        type: "ABSENCE",
        class: "Detected from Grid Row " + index,
        fee: 5.00
      });
    }
    if (line.includes("#")) {
      results.push({
        type: "LATE",
        class: "Detected from Grid Row " + index,
        fee: 1.00 // This will be calculated against ClassSetting duration
      });
    }
  });

  return {
    student: studentName,
    incidents: results
  };
}