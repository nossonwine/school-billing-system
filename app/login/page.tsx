import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function ParentDashboard() {
  // In a real session, we'd use the logged-in ID. For now, we fetch all incidents.
  const incidents = await prisma.incident.findMany({
    include: { student: true },
    orderBy: { date: 'desc' }
  });

  const totalBalance = incidents.reduce((sum, item) => sum + ((item.feeCalculated || 0) - item.amountPaid), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-blue-600 rounded-xl p-8 text-white shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Student Summary</h1>
            <p className="mt-2 opacity-90">Real-time billing from parsed reports.</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90 uppercase tracking-wide">Outstanding Balance</p>
            <p className="text-5xl font-extrabold">${totalBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-red-600 mb-4 border-b pb-2">Tests (&lt; 70%)</h3>
            {incidents.filter(i => i.type === "TEST").map(i => (
               <div key={i.id} className="flex justify-between text-sm py-1"><span>{i.className}</span> <strong>${i.feeCalculated}</strong></div>
            ))}
          </section>

          <section className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-orange-500 mb-4 border-b pb-2">Lateness</h3>
            {incidents.filter(i => i.type === "LATE").map(i => (
               <div key={i.id} className="flex justify-between text-sm py-1"><span>{i.className}</span> <strong>${i.feeCalculated}</strong></div>
            ))}
          </section>

          <section className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-blue-600 mb-4 border-b pb-2">Absences</h3>
            {incidents.filter(i => i.type === "ABSENCE").map(i => (
               <div key={i.id} className="flex justify-between text-sm py-1"><span>{i.className}</span> <strong>${i.feeCalculated}</strong></div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}