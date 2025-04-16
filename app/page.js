'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from "next/image";
import Link from "next/link";

function HomeContent() {
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    // Check if the user just logged out
    const wasLoggedOut = searchParams.get('logout') === 'true';
    
    if (wasLoggedOut) {
      // Ensure we clear the session
      supabase.auth.signOut().catch(err => 
        console.error('Error clearing session after logout:', err)
      );
    }
  }, [searchParams, supabase.auth]);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-[#F8F9FA] dark:bg-[#1C2C2F] shadow border-b border-[#DDE5E7] dark:border-[#3F5E63]">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-[#2E4F54] dark:text-[#E0F4F5]">Compassionate Rides</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/login" className="text-[#7CCFD0] hover:text-[#60BFC0]">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="bg-[#7CCFD0] text-white px-4 py-2 rounded hover:bg-[#60BFC0]">
                  Sign up
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-16 px-4 bg-gradient-to-b from-[#7CCFD0]/10 to-white dark:from-[#24393C] dark:to-[#1C2C2F]">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-[#2E4F54] dark:text-[#E0F4F5]">Caring Transportation for Everyone</h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto text-[#2E4F54]/80 dark:text-[#E0F4F5]/80">
              Book rides with compassionate drivers who understand your unique needs and challenges.  
              We specialize in transportation for medical appointments, accessibility needs, and more.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/signup" className="bg-[#7CCFD0] text-white px-6 py-3 rounded-lg hover:bg-[#60BFC0] font-medium">
                Book Your First Ride
              </Link>
              <Link href="#how-it-works" className="border border-[#DDE5E7] dark:border-[#3F5E63] px-6 py-3 rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#24393C] font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-[#2E4F54] dark:text-[#E0F4F5]">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-10">
              {/* Step 1 */}
              <div className="text-center">
                <div className="bg-[#7CCFD0]/20 dark:bg-[#7CCFD0]/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#2E4F54] dark:text-[#E0F4F5] text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#2E4F54] dark:text-[#E0F4F5]">Create an Account</h3>
                <p className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Sign up and tell us about your transportation needs and preferences.</p>
              </div>
              
              {/* Step 2 */}
              <div className="text-center">
                <div className="bg-[#7CCFD0]/20 dark:bg-[#7CCFD0]/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#2E4F54] dark:text-[#E0F4F5] text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#2E4F54] dark:text-[#E0F4F5]">Book Your Ride</h3>
                <p className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Schedule a ride in advance or request one immediately based on your schedule.</p>
              </div>
              
              {/* Step 3 */}
              <div className="text-center">
                <div className="bg-[#7CCFD0]/20 dark:bg-[#7CCFD0]/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#2E4F54] dark:text-[#E0F4F5] text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#2E4F54] dark:text-[#E0F4F5]">Enjoy Your Journey</h3>
                <p className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Meet your compassionate driver and enjoy a safe, comfortable ride to your destination.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#F8F9FA] dark:bg-[#1C2C2F] py-8 border-t border-[#DDE5E7] dark:border-[#3F5E63]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 mb-4 md:mb-0">&copy; 2025 Compassionate Rides. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link href="#" className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 hover:text-[#7CCFD0] dark:hover:text-[#7CCFD0]">
                Terms
              </Link>
              <Link href="#" className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 hover:text-[#7CCFD0] dark:hover:text-[#7CCFD0]">
                Privacy
              </Link>
              <Link href="#" className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 hover:text-[#7CCFD0] dark:hover:text-[#7CCFD0]">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
