import { getClasses, getGlobalSettings } from "../actions";
import { saveGlobalSettings, saveClass, deleteClass } from "../actions";

export default async function SettingsPage() {
  const classes = await getClasses();
  const globals = await getGlobalSettings();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500">Manage your school's fees, classes, and schedule.</p>
      </div>

      {/* 1. GLOBAL FEE SETTINGS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Global Fee Rules</h2>
        <form action={saveGlobalSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Absence Fee ($)</label>
            <input name="absenceFee" type="number" step="0.01" defaultValue={globals.absenceFee} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee ($)</label>
            <input name="lateTier1Fee" type="number" step="0.01" defaultValue={globals.lateTier1Fee} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Failed Test Fee ($)</label>
            <input name="testFailFee" type="number" step="0.01" defaultValue={globals.testFailFee} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="md:col-span-3 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">
            Save Fee Rules
          </button>
        </form>
      </div>

      {/* 2. CLASS & SCHEDULE MANAGER */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Class Schedule Manager</h2>
        
        {/* Add New Class Form */}
        <form action={saveClass} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg mb-6 border">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order / Period #</label>
            <input name="period" type="number" required placeholder="e.g. 1" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div dir="rtl" className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">Class Name (Hebrew)</label>
            <input name="name" type="text" required placeholder="e.g. שחרית" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Mins)</label>
            <input name="mins" type="number" required placeholder="e.g. 45" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" className="md:col-span-4 bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700">
            + Add / Update Class
          </button>
        </form>

        {/* List of Existing Classes */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Current Schedule ({classes.length} Classes)</h3>
          {classes.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No classes added yet.</p>
          ) : (
            classes.map((c) => (
              <div key={c.id} className="flex justify-between items-center p-3 border rounded-lg bg-white hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <span className="bg-gray-200 text-gray-800 font-bold px-3 py-1 rounded-md text-sm">Period {c.periodNum}</span>
                  <span className="text-gray-500 text-sm">{c.durationMin} minutes</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-bold text-lg" dir="rtl">{c.hebrewName}</span>
                  <form action={async () => { "use server"; await deleteClass(c.id); }}>
                    <button type="submit" className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-md text-sm font-medium transition">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}