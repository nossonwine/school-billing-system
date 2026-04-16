import { 
  getStudentProfile, getClasses, saveStudentExemptions, 
  addManualCharge, updateChargePayment, deleteCharge, processPdfForStudent 
} from "../../actions";
import Link from "next/link";
import PrintButton from "@/app/components/PrintButton";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const student = await getStudentProfile(resolvedParams.id);
  const classes = await getClasses();

  if (!student) return <div className="p-8 text-center text-red-500">Student not found.</div>;

  // Split Incidents into Categories for the Columns
  const tests = student.incidents.filter((i: any) => i.type === 'TEST' || i.type === 'FAILED_TEST');
  const absences = student.incidents.filter((i: any) => i.type === 'ABSENCE');
  const lates = student.incidents.filter((i: any) => i.type === 'LATE');

  // Math Totals
  const totalTests = tests.reduce((sum: number, inc: any) => sum + (inc.feeCalculated || 0), 0);
  const totalAbsences = absences.reduce((sum: number, inc: any) => sum + (inc.feeCalculated || 0), 0);
  const totalLates = lates.reduce((sum: number, inc: any) => sum + (inc.feeCalculated || 0), 0);
  const totalCharges = student.incidents.reduce((sum: number, inc: any) => sum + (inc.feeCalculated || 0), 0);
  const totalPaid = student.incidents.reduce((sum: number, inc: any) => sum + (inc.amountPaid || 0), 0);
  const totalDue = totalCharges - totalPaid;

  // Reusable Column Component
  const IncidentColumn = ({ title, items, total, color }: { title: string, items: any[], total: number, color: string }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      <div className={`border-b-2 ${color} pb-2 mb-4 flex justify-between items-end`}>
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <span className="font-extrabold text-gray-900">${total.toFixed(2)}</span>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] print:max-h-none">
        {items.length === 0 ? <p className="text-sm text-gray-400 italic">No charges.</p> : items.map(inc => (
          <div key={inc.id} className={`p-3 border rounded bg-gray-50 text-sm ${inc.isExcused ? 'opacity-50' : ''}`}>
            <div className="flex justify-between font-bold text-gray-800 mb-1">
              <span>{new Date(inc.date).toLocaleDateString()}</span>
              <span className="text-red-600">${inc.feeCalculated}</span>
            </div>
            <p className="text-gray-900 font-semibold" dir="rtl">{inc.className}</p>
            {inc.notes && <p className="text-gray-500 text-xs mt-1">{inc.notes}</p>}
            
            {/* The Print:Hidden Editor tools */}
            <div className="print:hidden mt-3 pt-3 border-t flex flex-col gap-2">
              <form action={updateChargePayment} className="flex justify-between items-center gap-2">
                <input type="hidden" name="id" value={inc.id} />
                <input type="hidden" name="studentId" value={student.id} />
                <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                  Paid $ <input name="amountPaid" type="number" step="0.01" defaultValue={inc.amountPaid} className="w-12 border rounded text-center p-0.5" />
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-red-600 font-bold"><input type="checkbox" name="isExcused" defaultChecked={inc.isExcused} className="mr-1" />Excused</label>
                  <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Save</button>
                </div>
              </form>
              <form action={deleteCharge} className="text-right">
                <input type="hidden" name="id" value={inc.id} />
                <input type="hidden" name="studentId" value={student.id} />
                <button type="submit" className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen print:bg-white print:p-0">
      
      {/* HEADER & SUMMARY */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center print:border-none print:shadow-none">
        <div>
          <Link href="/students" className="print:hidden text-blue-600 hover:underline text-sm mb-2 block">← Back to Directory</Link>
          <h1 className="text-4xl font-extrabold text-gray-900" dir="rtl">{student.name}</h1>
          <p className="text-gray-500 mt-1">Student Billing Profile</p>
        </div>
        <div className="flex items-center gap-6">
          <PrintButton />
          <div className="text-right bg-blue-50 p-4 rounded-lg border border-blue-100 print:bg-white print:border-gray-300">
            <p className="text-sm text-blue-800 font-bold uppercase print:text-gray-600">Total Balance Due</p>
            <p className={`text-4xl font-extrabold ${totalDue > 0 ? 'text-red-600' : 'text-green-600'} print:text-black`}>
              ${totalDue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT SIDEBAR: TOOLS (Hides when printing) */}
        <div className="lg:w-1/4 space-y-6 print:hidden">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
            <h2 className="text-md font-bold mb-3 text-blue-900">Upload PDF Report</h2>
            <form action={async (formData) => {
    "use server";
    await processPdfForStudent(formData);
  }} 
  className="flex flex-col gap-2"
>
              <input type="hidden" name="studentId" value={student.id} />
              <input type="file" name="file" accept="application/pdf" required className="w-full border bg-white p-2 rounded text-xs" />
              <button type="submit" className="bg-blue-600 text-white font-bold py-2 rounded text-sm hover:bg-blue-700">✨ Process with AI</button>
            </form>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h2 className="text-md font-bold mb-3">Add Manual Charge</h2>
            <form action={addManualCharge} className="flex flex-col gap-2 text-sm">
              <input type="hidden" name="studentId" value={student.id} />
              <input name="date" type="date" required className="border p-2 rounded" />
              <select name="className" className="border p-2 rounded" dir="rtl">
                {classes.map(c => <option key={c.id} value={c.hebrewName}>{c.hebrewName}</option>)}
              </select>
              <div className="flex gap-2">
                <select name="type" className="border p-2 rounded w-1/2">
                  <option value="LATE">Late</option><option value="ABSENCE">Absence</option><option value="TEST">Test</option>
                </select>
                <input name="fee" type="number" step="0.01" placeholder="Fee $" required className="border p-2 rounded w-1/2" />
              </div>
              <button type="submit" className="bg-red-600 text-white font-bold py-2 rounded mt-1">+ Add</button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE: COLUMNS (Expands to full width when printing) */}
        <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-3 gap-4 print:w-full print:grid-cols-3 print:gap-4">
          <IncidentColumn title="Absences" items={absences} total={totalAbsences} color="border-red-500" />
          <IncidentColumn title="Late Fees" items={lates} total={totalLates} color="border-orange-500" />
          <IncidentColumn title="Test Penalties" items={tests} total={totalTests} color="border-purple-500" />
        </div>

      </div>
    </div>
  );
}