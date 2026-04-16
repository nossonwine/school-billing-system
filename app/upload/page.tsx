"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { processPdfForStudent } from "../actions";

export default function UploadPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch the students when the page loads so you can select them
  useEffect(() => {
    fetch('/api/students') // We will create this quick route next!
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        if (data.length > 0) setSelectedStudent(data[0].id);
      })
      .catch(error => console.log("Failed to fetch students"));
  }, []);

  const handleUpload = async (formData: FormData) => {
    setIsUploading(true);
    const result = await processPdfForStudent(formData);
    setIsUploading(false);
    
    if (result.success) {
      // Send you directly to that student's ledger to see the new charges!
      router.push(`/students/${result.studentId}`);
    } else {
      alert("Something went wrong parsing the PDF.");
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Report</h1>
      <p className="text-gray-500 mb-8">Select a student and upload their Clever Bees PDF to calculate charges.</p>

      <form action={handleUpload} className="bg-white p-8 rounded-xl border-2 border-dashed border-gray-300 text-center shadow-sm">
        
        {/* STUDENT SELECTOR */}
        <div className="mb-6 text-left">
          <label className="block text-sm font-bold text-gray-700 mb-2">1. Assign to Student:</label>
          <select 
            name="studentId" 
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full border p-3 rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
            required
          >
            {students.length === 0 ? <option value="">Loading students...</option> : null}
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* FILE UPLOADER */}
        <div className="text-left mb-6">
           <label className="block text-sm font-bold text-gray-700 mb-2">2. Upload PDF:</label>
           <input 
             type="file" 
             name="file"
             accept=".pdf" 
             required
             className="w-full border p-3 rounded-lg bg-gray-50 text-gray-900" 
           />
        </div>

        <button 
          type="submit" 
          disabled={isUploading}
          className={`mt-4 w-full text-white font-bold py-4 rounded-lg transition-colors ${isUploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isUploading ? "Scanning PDF for Symbols..." : "Process & Parse Report"}
        </button>
      </form>
    </div>
  );
}