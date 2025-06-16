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
      {/* Sticky Header */}
      <header className="sticky top-0 left-0 right-0 p-4 bg-white/60 backdrop-blur-sm border-b border-white/20 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img 
              src="/cctlogo.png" 
              alt="Compassionate Care Transportation" 
              style={{ width: '117px', height: 'auto' }}
            />
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/login" className="bg-[#5fbfc0] text-white px-4 py-2 rounded hover:bg-[#4aa5a6] transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="bg-[#5fbfc0] text-white px-4 py-2 rounded hover:bg-[#4aa5a6] transition-colors">
                  Sign up
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section with Parallax */}
      <section className="hero-parallax">
        <div className="hero-background"></div>
        <div className="hero-overlay"></div>

        {/* Hero Content */}
        <div className="hero-content">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Caring Transportation for Everyone
          </h1>
          <p className="text-xl md:text-2xl mb-10 opacity-90 leading-relaxed">
            Book rides with compassionate drivers who understand your unique needs and challenges.  
            We specialize in transportation for medical appointments, accessibility needs, and more.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" className="bg-[#5fbfc0] text-white px-8 py-4 rounded-lg hover:bg-[#4aa5a6] font-medium text-lg transition-colors">
              Book Your First Ride
            </Link>
            <Link href="#how-it-works" className="border border-white/50 text-white px-8 py-4 rounded-lg hover:bg-white/10 font-medium text-lg transition-colors backdrop-blur-sm">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main>
        <section id="how-it-works" className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-black">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-10">
              {/* Step 1 */}
              <div className="text-center">
                <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-black">Create an Account</h3>
                <p className="text-black">Sign up and tell us about your transportation needs and preferences.</p>
              </div>
              
              {/* Step 2 */}
              <div className="text-center">
                <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-black">Book Your Ride</h3>
                <p className="text-black">Schedule a ride in advance or request one immediately based on your schedule.</p>
              </div>
              
              {/* Step 3 */}
              <div className="text-center">
                <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-black">Enjoy Your Journey</h3>
                <p className="text-black">Meet your compassionate driver and enjoy a safe, comfortable ride to your destination.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#5fbfc0] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white mb-4 md:mb-0">&copy; 2025 Compassionate Care Transportation. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link href="#" className="text-white hover:text-white/80">
                Terms
              </Link>
              <Link href="#" className="text-white hover:text-white/80">
                Privacy
              </Link>
              <Link href="#" className="text-white hover:text-white/80">
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
