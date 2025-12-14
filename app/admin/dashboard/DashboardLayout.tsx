"use client";

import React from 'react';
import Link from 'next/link';
// Assuming you have an existing Logo component or will create one
import Logo from '@/app/components/Logo'; 
// Assuming you have a general UiKit component for buttons, inputs, etc.
import { Button } from '@/app/components/UiKit'; 
import { Search, ChevronDown, Bell, Settings, LogOut, LayoutDashboard, BarChart2, Users, ShoppingBag } from 'lucide-react'; // Example icons
import Footer from '@/app/components/Footer'; // Import the new Footer component

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans text-gray-900"> {/* Changed to flex-col */}
      <div className="flex flex-1"> {/* This div now wraps sidebar and main content */}
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md flex flex-col justify-between p-4">
          <div className="flex items-center justify-center h-16 border-b pb-4">
            <Logo /> {/* Your existing Logo component */}
          </div>
          <nav className="flex-1 mt-4">
            <ul>
              <li className="mb-2">
                <Link href="/admin/dashboard" className="flex items-center p-2 text-blue-600 rounded-md bg-blue-50">
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  Dashboard
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  <BarChart2 className="w-5 h-5 mr-3" />
                  Analytics
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  <Users className="w-5 h-5 mr-3" />
                  Users
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  <ShoppingBag className="w-5 h-5 mr-3" />
                  Products
                </Link>
              </li>
              {/* Add more navigation items as needed */}
            </ul>
          </nav>
          <div className="border-t pt-4">
            <Link href="#" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Link>
            <Link href="/" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md mt-2">
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Link>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Week Dropdown */}
              <Button variant="ghost" className="flex items-center gap-1 text-gray-700 hover:bg-gray-100">
                Week <ChevronDown className="w-4 h-4" />
              </Button>
              {/* Date Picker - Placeholder */}
              <span className="text-gray-600 text-sm">14 Jan, 2020 - 20 Jan, 2020</span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" className="p-2 text-gray-700 hover:bg-gray-100 rounded-full">
                <Bell className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <img
                  src="/agent.jpg" // Placeholder for user avatar
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full border-2 border-blue-400"
                />
                <span className="font-medium text-gray-800">Jennifer Temer</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            {children}
          </main>
        </div>
      </div>
      <Footer /> {/* Add the Footer component here */}
    </div>
  );
}

