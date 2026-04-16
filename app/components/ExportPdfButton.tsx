"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportPdfButton({ studentName, incidents }: { studentName: string, incidents: any[] }) {
  const generatePDF = () => {
    const doc = new jsPDF();

    // 1. Setup Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("OFFICIAL BILLING STATEMENT", 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Student: ${studentName}`, 14, 32);
    doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 14, 38);

    // 2. Group incidents by Week (extracted from AI notes [Week Label])
    const grouped: { [key: string]: any[] } = {};
    incidents.forEach(inc => {
      const match = inc.notes?.match(/\[(.*?)\]/);
      const week = match ? match[1] : "Individual Charges";
      if (!grouped[week]) grouped[week] = [];
      grouped[week].push(inc);
    });

    // 3. Math for the Final Total
    const grandTotal = incidents.reduce((sum, inc) => 
      sum + (inc.isExcused ? 0 : (inc.feeCalculated || 0) - (inc.amountPaid || 0)), 0
    );

    let currentY = 45;

    // 4. Generate a Table for each Week
    Object.keys(grouped).sort().forEach((week) => {
      // Add Week Header
      doc.setFontSize(14);
      doc.setTextColor(52, 152, 219); // Blue Week Headers
      doc.text(week.toUpperCase(), 14, currentY + 10);

      const tableRows = grouped[week].map(inc => [
        new Date(inc.date).toLocaleDateString(),
        inc.className, // Note: Hebrew names may appear as boxes unless you install a font, but the layout will be perfect
        inc.type,
        inc.isExcused ? "EXCUSED" : `$${(inc.feeCalculated || 0).toFixed(2)}`,
        inc.notes?.replace(/\[.*?\]/, "").trim() || "" // Remove the [Week] tag from notes
      ]);

      autoTable(doc, {
        startY: currentY + 15,
        head: [['Date', 'Class', 'Type', 'Fee', 'Details']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    // 5. Final Balance Due
    doc.setFontSize(16);
    doc.setTextColor(200, 0, 0); // Red for balance
    doc.text(`TOTAL BALANCE DUE: $${grandTotal.toFixed(2)}`, 14, currentY + 10);

    // 6. DOWNLOAD THE FILE
    doc.save(`${studentName.replace(/\s/g, "_")}_Invoice.pdf`);
  };

  return (
    <button 
      onClick={generatePDF} 
      className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-all shadow-md flex items-center gap-2"
    >
      <span>⬇️</span> Download Official PDF
    </button>
  );
}