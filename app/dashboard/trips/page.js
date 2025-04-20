'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TripsView from '@/app/components/TripsView';

export default function TripsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check URL for query parameters
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('cancelled') === 'true') {
      setSuccessMessage('Your trip has been successfully cancelled.');
      
      // Clear the URL parameter without refreshing the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
    // Check for session and fetch user data
    async function fetchUserData() {
      try {
        console.log('Checking session...');
        // Get the most fresh session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log('No session found, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Session found, user authenticated');
        setUser(session.user);

        // Refresh the session first to ensure token is valid
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Error refreshing session:', refreshError);
          // Continue anyway, the existing session might still work
        }

        // Fetch trips data with more detailed logging
        try {
          const userId = session.user.id;
          console.log('Fetching trips for user:', userId, 'User object:', JSON.stringify(session.user));
          
          // Get user role from profile to check if it's valid
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Continue anyway - maybe they're a user without a profile yet
          } else {
            console.log('User role from profile:', profileData?.role);
          }
          
          // First fetch trips without driver info
          const { data: tripsData, error: tripsError } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          
          // If trips are found and there are driver_ids, fetch driver information
          if (!tripsError && tripsData && tripsData.length > 0) {
            const tripsWithDriverIds = tripsData.filter(trip => trip.driver_id);
            
            if (tripsWithDriverIds.length > 0) {
              // Get all unique driver IDs
              const driverIds = [...new Set(tripsWithDriverIds.map(trip => trip.driver_id))];
              
              // Fetch driver profiles 
              const { data: driverProfiles, error: driversError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, full_name, avatar_url')
                .in('id', driverIds);
                
              if (!driversError && driverProfiles) {
                // Map driver info to each trip
                const enrichedTrips = tripsData.map(trip => {
                  if (trip.driver_id) {
                    const driverProfile = driverProfiles.find(profile => profile.id === trip.driver_id);
                    return {
                      ...trip,
                      driver: driverProfile || null
                    };
                  }
                  return trip;
                });
                
                console.log(`Successfully enriched ${enrichedTrips.length} trips with driver data`);
                setTrips(enrichedTrips || []);
              } else {
                console.error('Error fetching driver profiles:', driversError);
                setTrips(tripsData || []);
              }
            } else {
              setTrips(tripsData || []);
            }
          }

          if (tripsError) {
            console.error('Error fetching trips:', tripsError);
            console.error('Error details:', JSON.stringify(tripsError));
            setError(tripsError.message || 'An error occurred while fetching your trips');
          } else if (!tripsData || tripsData.length === 0) {
            console.log('No trips found for this user');
            setTrips([]);
          }
        } catch (tripsError) {
          console.error('Trips fetch error:', tripsError);
          setError('Failed to fetch trips data. Please try again later.');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // More detailed error logging
        console.error('Authentication error details:', JSON.stringify(error, null, 2));
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7CCFD0]"></div>
      </div>
    );
  }

  // If we have a user but there was an error loading trips, show error state
  if (error && user) {
    return (
      <div className="min-h-screen p-4">
        <div className="bg-[#F8F9FA] dark:bg-[#24393C] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#3F5E63] p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#2E4F54] dark:text-[#E0F4F5] mb-4">Your Trips</h2>
          <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-600 dark:text-red-400">
              {error || 'There was an error loading your trips. Please try again later.'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-[#7CCFD0] text-white rounded-md hover:bg-[#60BFC0]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <TripsView user={user} trips={trips} successMessage={successMessage} />;
}