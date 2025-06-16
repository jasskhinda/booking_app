'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from './DashboardLayout';

export default function DashboardView({ user }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
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
      <div className="bg-[#F8F9FA] dark:bg-[#1A1A1A] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#333333] p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[black] dark:text-[white]">Welcome to your dashboard!</h2>
        <p className="text-[black] dark:text-[white] opacity-80 mb-3">
          This is your personal dashboard where you can manage your rides and account settings.
        </p>
        
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="bg-white dark:bg-[black] p-6 rounded-lg border border-[#DDE5E7] dark:border-[#333333]">
            <h3 className="font-medium mb-2 text-[black] dark:text-[white]">Book a Ride</h3>
            <p className="text-sm text-[black]/80 dark:text-[white]/80 mb-4">
              Schedule a new ride with one of our compassionate drivers.
            </p>
            <Link 
              href="/dashboard/book" 
              className="inline-block bg-[#5fbfc0] text-white px-4 py-2 rounded text-sm hover:bg-[#4aa5a6]"
            >
              Book Now
            </Link>
          </div>
          
          <div className="bg-white dark:bg-[black] p-6 rounded-lg border border-[#DDE5E7] dark:border-[#333333]">
            <h3 className="font-medium mb-2 text-[black] dark:text-[white]">My Trips</h3>
            <p className="text-sm text-[black]/80 dark:text-[white]/80 mb-4">
              View and manage your completed and upcoming trips.
            </p>
            <Link 
              href="/dashboard/trips" 
              className="inline-block bg-[#5fbfc0] text-white px-4 py-2 rounded text-sm hover:bg-[#4aa5a6]"
            >
              View Trips
            </Link>
          </div>
          
          <div className="bg-white dark:bg-[black] p-6 rounded-lg border border-[#DDE5E7] dark:border-[#333333]">
            <h3 className="font-medium mb-2 text-[black] dark:text-[white]">Account Settings</h3>
            <p className="text-sm text-[black]/80 dark:text-[white]/80 mb-4">
              Update your profile and preferences.
            </p>
            <Link 
              href="/dashboard/settings" 
              className="inline-block bg-[#5fbfc0] text-white px-4 py-2 rounded text-sm hover:bg-[#4aa5a6]"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}