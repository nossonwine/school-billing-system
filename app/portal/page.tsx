import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function ParentPortal() {
  const session = await getServerSession(authOptions);

  // 1. KICK OUT ANYONE NOT LOGGED IN
  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  const studentId = (session.user as any).studentId;

  // 2. KICK ADMINS TO THE DASHBOARD
  if (role === "ADMIN") {
    redirect("/students");
  }

  if (!studentId) return <div className="p-8 text-red-500">Error: No student linked to this account.</div>;

  // 3. FETCH ONLY THIS STUDENT AND ONLY SHARED CHARGES
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      incidents: {
        where: { isShared: true }, // THE LOCK
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!student) return <div className="p-8">Student not found.</div>;

  const totalOwed = student.incidents.reduce((sum, inc) => sum + ((inc.feeCalculated || 0) - inc.amountPaid), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Parent Portal</h1>
        <h2 className="text-xl mb-6 text-gray-600">Student: {student.name}</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-medium text-gray-500">Current Balance Due</h3>
          <p className="text-4xl font-bold text-red-600">${totalOwed.toFixed(2)}</p>
        </div>

        <h3 className="text-xl font-bold mb-4">Charge History</h3>
        {student.incidents.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-gray-500">
            No visible charges at this time.
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-600">Date</th>
                  <th className="p-4 text-left font-semibold text-gray-600">Class</th>
                  <th className="p-4 text-left font-semibold text-gray-600">Type</th>
                  <th className="p-4 text-left font-semibold text-gray-600">Notes</th>
                  <th className="p-4 text-left font-semibold text-gray-600">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {student.incidents.map(inc => (
                  <tr key={inc.id} className="hover:bg-gray-50">
                    <td className="p-4">{inc.date.toLocaleDateString()}</td>
                    <td className="p-4">{inc.className}</td>
                    <td className="p-4">{inc.type}</td>
                    <td className="p-4 text-sm text-gray-600">{inc.notes}</td>
                    <td className="p-4 font-bold text-red-600">${(inc.feeCalculated || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}