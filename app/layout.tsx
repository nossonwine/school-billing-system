import {  } from "./provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mayan Torah Management",
  description: "Automated school management and billing system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900`}
      >
        {/* THE MAIN NAVIGATION BAR */}
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex-shrink-0 flex items-center font-bold text-xl text-blue-600 dark:text-blue-400">
                  🏫 Mayan Torah
                </Link>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                  <Link href="/" className="text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/students" className="text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Students
                  </Link>
                  <Link href="/settings" className="text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Settings
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <Link href="/login" className="bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-gray-600 px-4 py-2 border border-blue-200 dark:border-gray-600 rounded-md text-sm font-medium transition-colors">
                  Parent Portal
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* THE PAGE CONTENT */}
        <main className="flex-1">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around p-3 pb-safe z-50">
           <Link href="/" className="text-gray-600 dark:text-gray-400 text-xs font-medium flex flex-col items-center">
              <span>🏠</span>
              <span>Home</span>
           </Link>
           <Link href="/students" className="text-gray-600 dark:text-gray-400 text-xs font-medium flex flex-col items-center">
              <span>👥</span>
              <span>Students</span>
           </Link>
           <Link href="/settings" className="text-gray-600 dark:text-gray-400 text-xs font-medium flex flex-col items-center">
              <span>⚙️</span>
              <span>Settings</span>
           </Link>
        </div>

      </body>
    </html>
  );
}