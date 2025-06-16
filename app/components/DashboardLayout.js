'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ user, activeTab = 'dashboard', children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Use window.location.href to force a full page reload and clear session
      window.location.href = '/?logout=true'; 
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { id: 'trips', label: 'My Trips', href: '/dashboard/trips', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { id: 'book', label: 'Book a Ride', href: '/dashboard/book', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'settings', label: 'Settings', href: '/dashboard/settings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-[#1C2C2F] shadow-sm border-b border-[#DDE5E7] dark:border-[#3F5E63]">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center">
                  <img 
                    src="/cctlogo.png" 
                    alt="Compassionate Care Transportation" 
                    className="h-10 w-auto"
                  />
                </Link>
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              {/* Desktop navigation */}
              <div className="flex space-x-4">
                {navItems.map(item => (
                  <Link 
                    key={item.id}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                      activeTab === item.id 
                        ? 'bg-[#7CCFD0]/20 text-[#2E4F54] dark:bg-[#7CCFD0]/30 dark:text-[#E0F4F5]' 
                        : 'text-[#2E4F54] hover:text-[#2E4F54] hover:bg-[#F8F9FA] dark:text-[#E0F4F5]/70 dark:hover:text-[#E0F4F5] dark:hover:bg-[#24393C]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
              
              {/* User menu */}
              <div className="ml-3 relative flex items-center space-x-4">
                <Link 
                  href="/dashboard/settings"
                  className="text-sm text-[#2E4F54] dark:text-[#E0F4F5] hover:text-[#7CCFD0] dark:hover:text-[#7CCFD0]"
                >
                  {user?.user_metadata?.full_name || user?.email}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-[#7CCFD0] hover:text-[#60BFC0]"
                >
                  Sign out
                </button>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-[#2E4F54] hover:text-[#7CCFD0] hover:bg-[#F8F9FA] dark:text-[#E0F4F5] dark:hover:text-[#7CCFD0] dark:hover:bg-[#24393C]"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {isMobileMenuOpen && (
          <div className="sm:hidden" id="mobile-menu">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map(item => (
                <Link 
                  key={item.id}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                    activeTab === item.id 
                      ? 'bg-[#7CCFD0]/20 text-[#2E4F54] dark:bg-[#7CCFD0]/30 dark:text-[#E0F4F5]' 
                      : 'text-[#2E4F54] hover:text-[#2E4F54] hover:bg-[#F8F9FA] dark:text-[#E0F4F5]/70 dark:hover:text-[#E0F4F5] dark:hover:bg-[#24393C]'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#7CCFD0] hover:bg-[#F8F9FA] dark:hover:bg-[#24393C]"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#F8F9FA] dark:bg-[#24393C] py-6 border-t border-[#DDE5E7] dark:border-[#3F5E63]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#2E4F54] dark:text-[#E0F4F5] opacity-80 text-sm">
              &copy; 2025 Compassionate Care Transportation. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link 
                href="#" 
                className="text-[#2E4F54] dark:text-[#E0F4F5] opacity-80 text-sm hover:text-[#7CCFD0] dark:hover:text-[#7CCFD0]"
              >
                Help
              </Link>
              <Link 
                href="#" 
                className="text-[#2E4F54] dark:text-[#E0F4F5] opacity-80 text-sm hover:text-[#7CCFD0] dark:hover:text-[#7CCFD0]"
              >
                Privacy
              </Link>
              <Link 
                href="#" 
                className="text-[#2E4F54] dark:text-[#E0F4F5] opacity-80 text-sm hover:text-[#7CCFD0] dark:hover:text-[#7CCFD0]"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}