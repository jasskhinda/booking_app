import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import DriverTracker from '@/app/components/DriverTracker';

export const dynamic = 'force-dynamic';

export default async function TrackDriver({ params }) {
  try {
    const { tripId } = params;
    
    // Create server component client
    const supabase = createServerComponentClient({ cookies });
    
    // Get and refresh session if needed
    const { data: { session } } = await supabase.auth.getSession();
    
    // Redirect to login if there's no session
    if (!session) {
      redirect('/login');
    }
    
    // Fetch trip data with driver information
    const { data: trip, error } = await supabase
      .from('trips')
      .select(`
        *,
        driver:driver_id (
          id,
          email,
          profile:profiles (
            first_name,
            last_name,
            full_name,
            avatar_url,
            phone_number
          )
        )
      `)
      .eq('id', tripId)
      .eq('user_id', session.user.id)
      .single();
    
    if (error || !trip) {
      console.error('Error fetching trip:', error);
      redirect('/dashboard/trips?error=trip_not_found');
    }
    
    // Verify trip is in progress, otherwise redirect
    if (trip.status !== 'in_progress') {
      redirect(`/dashboard/trips?error=trip_not_in_progress&id=${tripId}`);
    }
    
    // Fetch simulated driver location
    // In a real app, this would come from a real-time database or GPS service
    const driverLocation = {
      latitude: 37.7749 + (Math.random() * 0.01 - 0.005), // Random location near San Francisco
      longitude: -122.4194 + (Math.random() * 0.01 - 0.005),
      lastUpdated: new Date().toISOString(),
    };
    
    return <DriverTracker trip={trip} driverLocation={driverLocation} user={session.user} />;
  } catch (error) {
    console.error('Error in track driver page:', error);
    redirect('/dashboard/trips?error=track_error');
  }
}