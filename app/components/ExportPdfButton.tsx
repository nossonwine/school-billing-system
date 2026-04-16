"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportPdfButton({ studentName, incidents }: { studentName: string, incidents: any[] }) {
  
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text("Student Billing Report", 14, 20);
    doc.setFontSize(14);
    doc.text(`Student: ${studentName}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);

    // Sort by Date (So weeks are in order)
    const sortedIncidents = [...incidents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Format Data for the Table
    const tableData = sortedIncidents.map(inc => [
      new Date(inc.date).toLocaleDateString(),
      inc.className,
      inc.type,
      inc.isExcused ? "EXCUSED" : `$${(inc.feeCalculated || 0).toFixed(2)}`,
      inc.notes || ""
    ]);

    // Calculate Total
    const totalDue = sortedIncidents.reduce((sum, inc) => sum + (inc.isExcused ? 0 : inc.feeCalculated - (inc.amountPaid || 0)), 0);

    // Draw the Table
    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Class / Period', 'Type', 'Fee', 'Notes']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Draw Total at the bottom
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(16);
    doc.setTextColor(200, 0, 0); // Red text
    doc.text(`Total Balance Due: $${totalDue.toFixed(2)}`, 14, finalY + 15);

    // Download the PDF file directly!
    doc.save(`${studentName.replace(/\s+/g, '_')}_Billing_Report.pdf`);
  };

  return (
    <button 
      onClick={generatePDF} 
      className="bg-green-600 text-white text-sm font-bold py-2 px-6 rounded hover:bg-green-700 shadow-sm transition"
    >
      ⬇️ Download Official PDF
    </button>
  );
}