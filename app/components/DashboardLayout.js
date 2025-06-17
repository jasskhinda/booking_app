'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ user, activeTab = 'dashboard', children, isBookingForm = false }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      console.log('Logout successful');
      // Use window.location.href to force a full page reload and clear session
      window.location.href = '/?logout=true'; 
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if logout fails, redirect to login page
      window.location.href = '/login?error=Logout failed';
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', href: '/dashboard', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { id: 'trips', label: 'MY TRIPS', href: '/dashboard/trips', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { id: 'book', label: 'BOOK A RIDE', href: '/dashboard/book', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'settings', label: 'SETTINGS', href: '/dashboard/settings', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  return (
    <div className={`${isBookingForm ? 'booking-form-container' : 'dashboard-container'} min-h-screen flex flex-col`}>
      {/* Parallax Background - contained within the layout */}
      <div className="hero-background"></div>
      <div className="hero-overlay"></div>
      
      {/* Top Navigation Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-white/30 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center py-4">
                <Link href="/" className="flex items-center">
                  <img 
                    src="/cctlogo.png" 
                    alt="Compassionate Care Transportation" 
                    style={{ height: '80px', width: 'auto' }}
                    className="py-2 object-contain"
                  />
                </Link>
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-6">
              {/* Desktop navigation */}
              <div className="flex space-x-2">
                {navItems.map(item => (
                  <Link 
                    key={item.id}
                    href={item.href}
                    className={`px-5 py-3 rounded-lg text-base font-bold flex items-center space-x-3 transition-all duration-200 ${
                      activeTab === item.id 
                        ? 'bg-[#5fbfc0] text-white shadow-md' 
                        : 'text-gray-800 hover:text-[#5fbfc0] hover:bg-[#5fbfc0]/10'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
              
              {/* User menu */}
              <div className="ml-4 relative flex items-center space-x-4 pl-4 border-l border-gray-300">
                <Link 
                  href="/dashboard/settings"
                  className="text-base font-bold text-gray-800 hover:text-[#5fbfc0] transition-colors"
                >
                  {user?.user_metadata?.full_name || user?.email}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-base font-bold text-[#5fbfc0] hover:text-[#4aa5a6] transition-colors uppercase"
                >
                  SIGN OUT
                </button>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-800 hover:text-[#5fbfc0] hover:bg-[#5fbfc0]/10 transition-all"
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
          <div className="sm:hidden bg-white/95 backdrop-blur-md border-t border-white/30 shadow-lg" id="mobile-menu">
            <div className="pt-3 pb-4 space-y-2 px-4">
              {navItems.map(item => (
                <Link 
                  key={item.id}
                  href={item.href}
                  className={`block px-5 py-4 rounded-lg text-lg font-bold flex items-center space-x-3 transition-all duration-200 ${
                    activeTab === item.id 
                      ? 'bg-[#5fbfc0] text-white shadow-md' 
                      : 'text-gray-800 hover:text-[#5fbfc0] hover:bg-[#5fbfc0]/10'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
                <div className="px-5 py-3 text-base font-bold text-gray-800">
                  {user?.user_metadata?.full_name || user?.email}
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="block w-full text-left px-5 py-4 rounded-lg text-lg font-bold text-[#5fbfc0] hover:bg-[#5fbfc0]/10 transition-all uppercase"
                >
                  SIGN OUT
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#5fbfc0] py-6 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white text-sm">
              &copy; 2025 Compassionate Care Transportation. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link 
                href="#" 
                className="text-white hover:text-white/80 text-sm"
              >
                Help
              </Link>
              <Link 
                href="#" 
                className="text-white hover:text-white/80 text-sm"
              >
                Privacy
              </Link>
              <Link 
                href="#" 
                className="text-white hover:text-white/80 text-sm"
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