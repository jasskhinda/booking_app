'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from './DashboardLayout';

export default function DashboardView({ user }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showEmailVerified, setShowEmailVerified] = useState(false);

  useEffect(() => {
    // Check if user just confirmed email
    const emailJustConfirmed = sessionStorage.getItem('email_just_confirmed');
    if (emailJustConfirmed === 'true') {
      setShowEmailVerified(true);
      sessionStorage.removeItem('email_just_confirmed');
      // Hide message after 5 seconds
      setTimeout(() => setShowEmailVerified(false), 5000);
    }

    // Fetch user profile data
    async function getProfile() {
      try {
        setLoading(true);

        // Get profile data from user metadata or make a separate query to a profiles table
        const fullName = user?.user_metadata?.full_name || 'User';
        
        setProfile({
          id: user.id,
          email: user.email,
          full_name: fullName,
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5fbfc0]"></div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} activeTab="dashboard">
      {showEmailVerified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 mt-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                ✅ Email Verified Successfully! Your account is now fully activated.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-8 mb-8 mt-8">
        <h2 className="text-3xl font-bold mb-6 text-black">Welcome to your dashboard! - PREVIEW VERSION</h2>
        <p className="text-black font-bold mb-6 text-lg">
          This is your personal dashboard where you can manage your rides and account settings.
        </p>
        
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="font-bold mb-3 text-black text-xl">Book a Ride</h3>
            <p className="text-base text-black font-bold mb-6">
              Schedule a new ride with one of our compassionate drivers.
            </p>
            <Link 
              href="/dashboard/book" 
              className="inline-block bg-[#5fbfc0] text-white px-6 py-3 rounded text-base hover:bg-[#4aa5a6] transition-colors font-bold"
            >
              Book Now
            </Link>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="font-bold mb-3 text-black text-xl">My Trips</h3>
            <p className="text-base text-black font-bold mb-6">
              View and manage your completed and upcoming trips.
            </p>
            <Link 
              href="/dashboard/trips" 
              className="inline-block bg-[#5fbfc0] text-white px-6 py-3 rounded text-base hover:bg-[#4aa5a6] transition-colors font-bold"
            >
              View Trips
            </Link>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="font-bold mb-3 text-black text-xl">Account Settings</h3>
            <p className="text-base text-black font-bold mb-6">
              Update your profile and preferences.
            </p>
            <Link 
              href="/dashboard/settings" 
              className="inline-block bg-[#5fbfc0] text-white px-6 py-3 rounded text-base hover:bg-[#4aa5a6] transition-colors font-bold"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}