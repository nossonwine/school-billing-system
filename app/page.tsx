import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if ((session.user as any)?.role === "PARENT") redirect("/portal");

  // Fetch a quick summary for the Dashboard
  const studentCount = await prisma.student.count();
  const recentIncidents = await prisma.incident.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    include: { student: true }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/students" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <h2 className="text-xl font-bold text-blue-600 mb-2">Manage Students</h2>
            <p className="text-gray-600">View all {studentCount} students, upload PDFs, and manage charges.</p>
          </Link>
          
          <Link href="/settings" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <h2 className="text-xl font-bold text-green-600 mb-2">System Settings</h2>
            <p className="text-gray-600">Update class lengths, change base fees, and configure the billing rules.</p>
          </Link>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Charges</h2>
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-600">Student</th>
                <th className="p-4 text-left font-semibold text-gray-600">Date</th>
                <th className="p-4 text-left font-semibold text-gray-600">Type</th>
                <th className="p-4 text-left font-semibold text-gray-600">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentIncidents.map(inc => (
                <tr key={inc.id}>
                  <td className="p-4 font-medium">{inc.student?.name}</td>
                  <td className="p-4">{inc.date.toLocaleDateString()}</td>
                  <td className="p-4">{inc.type}</td>
                  <td className="p-4 font-bold text-red-600">${(inc.feeCalculated || 0).toFixed(2)}</td>
                </tr>
              ))}
              {recentIncidents.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No recent charges.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}