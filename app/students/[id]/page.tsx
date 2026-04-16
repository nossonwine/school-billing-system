import { getStudentProfile, getClasses, saveStudentExemptions, addManualCharge, updateChargePayment, deleteCharge } from "../../actions";
import Link from "next/link";

// FIX: Next.js 16 requires 'params' to be a Promise!
export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // FIX: We tell the page to wait for the ID to load
  const resolvedParams = await params;
  const student = await getStudentProfile(resolvedParams.id);
  const classes = await getClasses();

  if (!student) return <div className="p-8 text-center text-red-500">Student not found.</div>;

  // Calculate math for the summary
  const totalCharges = student.incidents.reduce((sum: number, inc: any) => sum + inc.feeCalculated, 0);
  const totalPaid = student.incidents.reduce((sum: number, inc: any) => sum + inc.amountPaid, 0);
  const totalDue = totalCharges - totalPaid;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* HEADER & SUMMARY */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <Link href="/students" className="text-blue-600 hover:underline text-sm mb-2 block">← Back to Directory</Link>
          <h1 className="text-4xl font-extrabold text-gray-900" dir="rtl">{student.name}</h1>
          <p className="text-gray-500 mt-1">Student Billing Profile</p>
        </div>
        <div className="text-right bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800 font-bold uppercase">Total Balance Due</p>
          <p className={`text-4xl font-extrabold ${totalDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${totalDue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: SETTINGS & ADD CHARGES */}
        <div className="space-y-6">
          
          {/* Exemptions Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-3 border-b pb-2">Student Exemptions & Deals</h2>
            <form action={saveStudentExemptions} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={student.id} />
              <textarea 
                name="exemptions" 
                rows={4} 
                defaultValue={student.exemptions || ""} 
                placeholder="e.g. Exempt from Period 1 Lateness, or $2 off Test Fails"
                className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm text-gray-900"
              />
              <button type="submit" className="bg-gray-800 text-white font-bold py-2 rounded hover:bg-black">Save Rules</button>
            </form>
          </div>

          {/* Add Manual Charge Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-3 border-b pb-2">Add Manual Charge</h2>
            <form action={addManualCharge} className="flex flex-col gap-3">
              <input type="hidden" name="studentId" value={student.id} />
              
              <div><label className="text-xs font-bold text-gray-600">Date</label>
              <input name="date" type="date" required className="w-full border p-2 rounded text-sm text-gray-900" /></div>
              
              <div><label className="text-xs font-bold text-gray-600">Class</label>
              <select name="className" className="w-full border p-2 rounded text-sm bg-white text-gray-900" dir="rtl">
                {classes.map(c => <option key={c.id} value={c.hebrewName}>{c.hebrewName} (Period {c.periodNum})</option>)}
              </select></div>

              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-bold text-gray-600">Type</label>
                <select name="type" className="w-full border p-2 rounded text-sm bg-white text-gray-900">
                  <option value="LATE">Lateness</option>
                  <option value="ABSENCE">Absence</option>
                  <option value="TEST">Failed Test</option>
                  <option value="OTHER">Other</option>
                </select></div>
                
                <div><label className="text-xs font-bold text-gray-600">Fee ($)</label>
                <input name="fee" type="number" step="0.01" required className="w-full border p-2 rounded text-sm text-gray-900" /></div>
              </div>

              <div><label className="text-xs font-bold text-gray-600">Notes (Optional)</label>
              <input name="notes" type="text" placeholder="e.g. Spoke to parents" className="w-full border p-2 rounded text-sm text-gray-900" /></div>

              <button type="submit" className="bg-red-600 text-white font-bold py-2 rounded hover:bg-red-700 mt-2">+ Add Charge</button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: THE LEDGER (BILLS & PAYMENTS) */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-900">Billing Ledger</h2>
            <button className="bg-green-600 text-white text-sm font-bold py-1.5 px-4 rounded hover:bg-green-700">
              🖨️ Export to PDF
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {student.incidents.length === 0 ? (
              <p className="text-gray-500 italic text-center py-8">No charges on record.</p>
            ) : (
              student.incidents.map((inc: any) => (
                <div key={inc.id} className={`p-4 border rounded-lg flex flex-col md:flex-row justify-between gap-4 ${inc.isExcused ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
                  
                  {/* Charge Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${inc.type === 'TEST' ? 'bg-red-100 text-red-800' : inc.type === 'LATE' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                        {inc.type}
                      </span>
                      <span className="font-bold text-gray-800">{new Date(inc.date).toLocaleDateString()}</span>
                    </div>
                    <p className="font-bold text-lg text-gray-900" dir="rtl">{inc.className}</p>
                    {inc.notes && <p className="text-sm text-gray-500 mt-1">📝 {inc.notes}</p>}
                  </div>

                  {/* Payment & Excused Editors */}
                  <div className="flex flex-col gap-2 min-w-[200px] bg-gray-50 p-3 rounded border">
                    <form action={updateChargePayment} className="flex flex-col gap-2 text-sm">
                      <input type="hidden" name="id" value={inc.id} />
                      <input type="hidden" name="studentId" value={student.id} />
                      
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-700">Fee: ${inc.feeCalculated}</span>
                        <label className="flex items-center gap-1 text-xs font-bold text-red-600 cursor-pointer">
                          <input type="checkbox" name="isExcused" defaultChecked={inc.isExcused} className="w-4 h-4 cursor-pointer" />
                          Excused
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-600">Paid: $</label>
                        <input name="amountPaid" type="number" step="0.01" defaultValue={inc.amountPaid} className="w-full border p-1 rounded text-center outline-none focus:ring-2 focus:ring-green-500 text-gray-900" />
                        <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-blue-700">Save</button>
                      </div>
                    </form>

                    <form action={deleteCharge} className="mt-1 text-right">
                      <input type="hidden" name="id" value={inc.id} />
                      <input type="hidden" name="studentId" value={student.id} />
                      <button type="submit" className="text-xs text-red-500 hover:underline">🗑️ Delete Record</button>
                    </form>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}