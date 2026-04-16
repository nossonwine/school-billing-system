import { getStudents, addStudent, deleteStudent, addMultipleStudents } from "../actions";
import Link from "next/link";

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Directory</h1>
          <p className="text-gray-500 mt-1">Manage your students and click their names for billing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SINGLE ADD FORM */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Single Student</h2>
            <form action={addStudent} className="flex flex-col gap-4">
              <input 
                type="text" name="name" required placeholder="e.g., וויינפעלד, נתן הלוי" 
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" dir="rtl"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full">
                Save Single Student
              </button>
            </form>
          </div>

          {/* BULK PASTE FORM */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
            <h2 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">Bulk Paste Students</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Paste a list. Separate by new lines or commas.</p>
            <form action={addMultipleStudents} className="flex flex-col gap-4">
              <textarea 
                name="names" required rows={4} placeholder="כהן, יצחק&#10;לוי, אברהם" 
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 resize-none" dir="rtl"
              ></textarea>
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full">
                Add Multiple Students
              </button>
            </form>
          </div>
        </div>

        {/* THE LIST OF STUDENTS WITH THE NEW BUTTONS */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-8">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-800 dark:text-white">Total Enrolled: {students.length}</h2>
          </div>
          
          {students.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No students found. Add some above!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50">
              {students.map((student) => (
                <div key={student.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <h3 className="font-bold text-xl mb-4 text-right text-gray-900" dir="rtl">{student.name}</h3>
                  <div className="flex flex-col gap-2">
                    
                    {/* THIS IS THE MAGIC BUTTON THAT LINKS TO THE LEDGER */}
                    <Link href={`/students/${student.id}`} className="bg-blue-50 text-blue-700 border border-blue-200 text-center py-2 rounded-lg font-bold hover:bg-blue-100 transition-colors">
                      View Weekly Reports & Billing
                    </Link>
                    
                    <form action={async () => { "use server"; await deleteStudent(student.id); }}>
                      <button type="submit" className="text-red-500 text-sm w-full text-center hover:underline py-1 mt-1">
                        Remove Student
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}