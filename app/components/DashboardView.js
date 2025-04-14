'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardView({ user }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-black shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Compassionate Rides</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Hello, {profile?.full_name}
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to your dashboard!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            This is your personal dashboard where you can manage your rides and account settings.
          </p>
          
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="font-medium mb-2">Book a Ride</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Schedule a new ride with one of our compassionate drivers.
              </p>
              <Link 
                href="/dashboard/book" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Book Now
              </Link>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <h3 className="font-medium mb-2">Upcoming Rides</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View and manage your scheduled rides.
              </p>
              <Link 
                href="/dashboard/rides" 
                className="inline-block bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              >
                View Rides
              </Link>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
              <h3 className="font-medium mb-2">Account Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Update your profile and preferences.
              </p>
              <Link 
                href="/dashboard/settings" 
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-900 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              &copy; 2025 Compassionate Rides. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link 
                href="#" 
                className="text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400"
              >
                Help
              </Link>
              <Link 
                href="#" 
                className="text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400"
              >
                Privacy
              </Link>
              <Link 
                href="#" 
                className="text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400"
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