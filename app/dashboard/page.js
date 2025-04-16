import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import DashboardView from '@/app/components/DashboardView';

export const dynamic = 'force-dynamic';

// This is a Server Component
export default async function Dashboard() {
    console.log('Dashboard server component executing');
    
    try {
        // Create server component client
        const supabase = createServerComponentClient({ cookies });
        console.log('Server supabase client created');

        // This will refresh the session if needed
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Auth session check result:', session ? 'Session exists' : 'No session found');

        // Redirect to login if there's no session
        if (!session) {
            console.log('No session, redirecting to login');
            redirect('/login');
        }

        console.log('User authenticated, rendering dashboard');
        return <DashboardView user={session.user} />;
    } catch (error) {
        console.error('Error in dashboard page:', error);
        redirect('/login?error=server_error');
    }
}