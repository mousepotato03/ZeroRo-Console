"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Leaf,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  CreditCard,
  Bell,
  Search,
  User
} from 'lucide-react';
import { Button } from './UiKit';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'campaigns', label: 'Campaigns', icon: Leaf, href: '/dashboard/campaigns' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
    { id: 'billing', label: 'Billing & API', icon: CreditCard, href: '/dashboard/billing' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  const getActivePage = () => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname.includes('/campaigns')) return 'campaigns';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/billing')) return 'billing';
    if (pathname.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  const activePage = getActivePage();

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Dark Theme */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block shadow-xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Image src="/favicon.png" alt="Zeroro Logo" width={32} height={32} className="object-contain" />
              <span className="text-lg font-bold tracking-tight">Zeroro</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</div>
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group ${
                  activePage === item.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-colors ${activePage === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Profile / Bottom */}
          <div className="p-4 border-t border-slate-800">
             <div className="flex items-center gap-3 px-2 py-3 mb-2 rounded-lg bg-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                  <User className="w-4 h-4 text-slate-300"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">Admin User</p>
                  <p className="text-xs text-slate-500 truncate">admin@zeroro.io</p>
                </div>
             </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="sm" className="lg:hidden p-0" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden md:flex items-center text-sm text-slate-500">
              <span className="font-medium text-slate-900 capitalize">{activePage}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 h-9 w-64 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
               />
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
