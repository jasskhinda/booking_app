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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7CCFD0]"></div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} activeTab="dashboard">
      <section
        className="relative w-full min-h-[60vh] flex items-center justify-center bg-center bg-cover px-0"
        style={{
          backgroundImage: "url('/Transportation-near-me-scaled.jpg')",
          backgroundPosition: "center center",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          marginTop: "-123px",
          padding: "167px 0"
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 w-full h-full pointer-events-none" style={{background: "#00000052"}} />
        {/* Hero Card Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto rounded-lg shadow-md p-8" style={{ background: '#69c8cd' }}>
          <h2 className="text-3xl font-bold mb-4 text-white">Welcome to your dashboard!</h2>
          <p className="text-white opacity-90 mb-6 text-lg">
            This is your personal dashboard where you can manage your rides and account settings.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg border border-[#DDE5E7]">
              <h3 className="font-medium mb-2 text-[#2E4F54]">Book a Ride</h3>
              <p className="text-sm text-[#2E4F54]/80 mb-4">
                Schedule a new ride with one of our compassionate drivers.
              </p>
              <Link 
                href="/dashboard/book" 
                className="inline-block bg-[#7CCFD0] text-white px-4 py-2 rounded text-sm hover:bg-[#60BFC0]"
              >
                Book Now
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg border border-[#DDE5E7]">
              <h3 className="font-medium mb-2 text-[#2E4F54]">My Trips</h3>
              <p className="text-sm text-[#2E4F54]/80 mb-4">
                View and manage your completed and upcoming trips.
              </p>
              <Link 
                href="/dashboard/trips" 
                className="inline-block bg-[#7CCFD0] text-white px-4 py-2 rounded text-sm hover:bg-[#60BFC0]"
              >
                View Trips
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg border border-[#DDE5E7]">
              <h3 className="font-medium mb-2 text-[#2E4F54]">Account Settings</h3>
              <p className="text-sm text-[#2E4F54]/80 mb-4">
                Update your profile and preferences.
              </p>
              <Link 
                href="/dashboard/settings" 
                className="inline-block bg-[#7CCFD0] text-white px-4 py-2 rounded text-sm hover:bg-[#60BFC0]"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}