"use client";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="print:hidden bg-green-600 text-white text-sm font-bold py-2 px-6 rounded hover:bg-green-700 shadow-sm transition"
    >
      🖨️ Export to PDF
    </button>
  );
}