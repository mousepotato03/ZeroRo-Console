"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Bell,
  Search,
  Building2
} from 'lucide-react';
import { Button } from './UiKit';
import { createClient } from '@/app/lib/supabase/client';

interface PartnerInfo {
  organization_name: string;
  email: string;
}

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchPartnerInfo = async () => {
      const supabase = createClient();

      // 로그인된 사용자 정보 조회
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // partners 테이블에서 조직 정보 조회
        const { data: partner } = await supabase
          .from('partners')
          .select('organization_name, email')
          .eq('user_id', user.id)
          .single();

        if (partner) {
          setPartnerInfo(partner);
        }
      }
    };

    fetchPartnerInfo();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'campaigns', label: 'Campaigns', icon: Leaf, href: '/dashboard/campaigns' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left Side: Logo & Nav */}
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                   <Image src="/favicon.png" alt="Zeroro" width={32} height={32} />
                   <span className="text-xl font-bold tracking-tight text-slate-900">Zeroro</span>
                </Link>
              </div>
              
              {/* Nav Links (Desktop) */}
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'border-emerald-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side: Actions & Profile */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
               {/* Search */}
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input
                    type="text"
                    placeholder="Search..."
                    className="pl-9 pr-4 h-9 w-64 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                 />
               </div>

               {/* Notifications */}
               <button className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors">
                 <span className="sr-only">View notifications</span>
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
               </button>

               {/* User Profile */}
               <div className="h-8 w-px bg-slate-200 mx-2" />
               
               <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-slate-900">
                      {partnerInfo?.organization_name || 'Loading...'}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-[150px]">
                      {partnerInfo?.email || ''}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onLogout}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
               </div>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex items-center sm:hidden">
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="block h-6 w-6" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-slate-50">
            <div className="pt-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-4 border-t border-slate-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-slate-800">{partnerInfo?.organization_name || 'Loading...'}</div>
                  <div className="text-sm font-medium text-slate-500">{partnerInfo?.email || ''}</div>
                </div>
                <button
                  onClick={onLogout} 
                  className="ml-auto flex-shrink-0 p-1 text-slate-400 hover:text-red-500"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {children}
      </main>
    </div>
  );
};
