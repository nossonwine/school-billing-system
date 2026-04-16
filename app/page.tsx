import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
          🏫 Mayan Torah Management
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Your automated billing, grading, and PDF parsing system is online.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/upload" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg shadow-sm transition-colors">
            Upload PDF Report
          </Link>
          <Link href="/login" className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-semibold px-8 py-3 rounded-lg shadow-sm transition-colors dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700">
            Parent Login
          </Link>
        </div>
      </div>
    </div>
  );
}