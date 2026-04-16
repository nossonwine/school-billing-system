import React from 'react';

export default function ParentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-blue-600 rounded-xl p-8 text-white shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome, Parent!</h1>
            <p className="mt-2 opacity-90">Here is the latest billing summary for your student.</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90 uppercase tracking-wide">Total Balance Due</p>
            <p className="text-5xl font-extrabold">$45.00</p>
            <button className="mt-4 bg-white text-blue-600 font-bold py-2 px-6 rounded-lg shadow hover:bg-gray-100 transition-colors">
              Pay Now
            </button>
          </div>
        </div>

        {/* 3-Column Report View (Preview) */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Recent Charges</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-red-600 mb-4 border-b pb-2">Tests (Failed)</h3>
            <div className="flex justify-between text-sm mb-2" dir="rtl"><span className="text-gray-800 dark:text-gray-200">09/17: חסידות בוקר</span> <span className="font-bold">$10</span></div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-orange-500 mb-4 border-b pb-2">Lateness</h3>
            <div className="flex justify-between text-sm mb-2" dir="rtl"><span className="text-gray-800 dark:text-gray-200">09/22: שחרית</span> <span className="font-bold">$3</span></div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-blue-600 mb-4 border-b pb-2">Absences</h3>
            <div className="flex justify-between text-sm mb-2" dir="rtl"><span className="text-gray-800 dark:text-gray-200">08/30: עיון א</span> <span className="font-bold">$5</span></div>
          </div>

        </div>
      </div>
    </div>
  );
}