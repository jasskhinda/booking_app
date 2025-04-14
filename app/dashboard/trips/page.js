import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import TripsView from '@/app/components/TripsView';

export default async function Trips() {
    console.log('Trips server component executing');
    
    try {
        // Create server component client
        const supabase = createServerComponentClient({ cookies });
        console.log('Server supabase client created in trips page');

        // Get and refresh session if needed
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Auth session check in trips:', session ? 'Session exists' : 'No session found');

        // Redirect to login if there's no session
        if (!session) {
            console.log('No session in trips, redirecting to login');
            redirect('/login');
        }

        // Fetch trips data for this user
        const { data: trips, error } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching trips:', error);
        }

        console.log('User authenticated in trips, rendering trips view');
        // Even if there's an error or no trips, we still render the component
        // The client component will handle empty states
        return <TripsView user={session.user} trips={trips || []} />;
    } catch (error) {
        console.error('Error in trips page:', error);
        redirect('/login?error=server_error');
    }
}