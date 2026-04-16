"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { processPdfForStudent } from "../actions";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch the students from our API
  useEffect(() => {
    fetch('/api/students')
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
      router.push(`/students/${formData.get("studentId")}`);
    } else {
      alert("Error: " + (result.error || "Check your OpenAI key or PDF format."));
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Central Upload Hub</h1>
        <Link href="/students" className="text-blue-600 hover:underline">← Back</Link>
      </div>
      
      <p className="text-gray-500 mb-8">Process a PDF and assign it to a specific week for the student's record.</p>

      <form action={handleUpload} className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
        
        {/* 1. STUDENT SELECTOR */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">1. Select Student:</label>
          <select 
            name="studentId" 
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {students.length === 0 ? <option value="">Loading student list...</option> : null}
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* 2. WEEK HEADER (This is the "Week of..." you requested) */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">2. Report Week / Header:</label>
          <input 
            type="text"
            name="weekLabel"
            placeholder="e.g. Week of Nov 12"
            required
            className="w-full border border-gray-300 p-3 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1 italic">This label will appear on the student's ledger and the PDF export.</p>
        </div>

        {/* 3. FILE UPLOADER */}
        <div className="mb-8">
           <label className="block text-sm font-bold text-gray-700 mb-2">3. Select Progress Report (PDF):</label>
           <input 
             type="file" 
             name="file"
             accept=".pdf" 
             required
             className="w-full border border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 text-gray-900 text-center" 
           />
        </div>

        <button 
          type="submit" 
          disabled={isUploading}
          className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg ${isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isUploading ? "AI is Analyzing PDF & Applying Rules..." : "✨ Process & Save to Student File"}
        </button>
      </form>
    </div>
  );
}