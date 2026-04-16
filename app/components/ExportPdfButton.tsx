"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportPdfButton({ studentName, incidents }: { studentName: string, incidents: any[] }) {
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Billing Statement: ${studentName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

    // Grouping logic for Weeks
    const grouped: { [key: string]: any[] } = {};
    incidents.forEach(inc => {
      const match = inc.notes?.match(/\[(.*?)\]/);
      const week = match ? match[1] : "Other Charges";
      if (!grouped[week]) grouped[week] = [];
      grouped[week].push(inc);
    });

    let lastY = 35;

    Object.keys(grouped).forEach(week => {
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text(week, 14, lastY + 10);

      autoTable(doc, {
        startY: lastY + 15,
        head: [['Date', 'Class', 'Type', 'Fee']],
        body: grouped[week].map(inc => [
          new Date(inc.date).toLocaleDateString(),
          inc.className,
          inc.type,
          inc.isExcused ? "EXCUSED" : `$${inc.feeCalculated.toFixed(2)}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] },
      });
      lastY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`${studentName}_Statement.pdf`);
  };

  return (
    <button onClick={generatePDF} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">
      ⬇️ Export Professional PDF
    </button>
  );
}