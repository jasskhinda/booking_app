'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from "next/image";
import Link from "next/link";

function HeroSection() {
  return (
    <section
      className="relative w-full min-h-[70vh] flex items-center justify-center bg-center bg-cover"
      style={{
        backgroundImage: "url('/Transportation-near-me-scaled.jpg')",
        backgroundPosition: "center center",
        backgroundSize: "cover",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: "#00000091" }} />
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-24 w-full">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
          Caring Transportation for Everyone
        </h1>
        <hr className="w-24 border-t-4 border-white mx-auto mb-6" />
        <p className="text-white text-lg md:text-2xl font-medium mb-8 max-w-2xl mx-auto drop-shadow">
          Book rides with compassionate drivers who understand your unique needs and challenges. We specialize in transportation for medical appointments, accessibility needs, and more.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 rounded-full font-bold bg-[#69c8cd] text-white hover:bg-[#3ea7b2] transition-all text-lg shadow text-center"
          >
            BOOK A RIDE &rarr;
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-3 rounded-full font-bold bg-[#69c8cd] text-white hover:bg-[#3ea7b2] transition-all text-lg shadow text-center"
          >
            LEARN MORE
          </Link>
        </div>
      </div>
    </section>
  );
}

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
      <main className="flex-grow">
        <HeroSection />
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
