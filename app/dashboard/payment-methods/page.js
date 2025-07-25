import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import PaymentMethodsManager from '@/app/components/PaymentMethodsManager';
import ErrorBoundary from '@/app/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default async function PaymentMethods() {
  try {
    // Create server component client
    const supabase = createServerComponentClient({ cookies });
    
    // Get and refresh session if needed
    const { data: { session } } = await supabase.auth.getSession();
    
    // Redirect to login if there's no session
    if (!session) {
      redirect('/login');
    }
    
    // Fetch user profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }
    
    // Even if there's an error, we'll render the component
    // The client component will handle the empty state
    return (
      <ErrorBoundary>
        <PaymentMethodsManager user={session.user} profile={profile || {}} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error in payment methods page:', error);
    redirect('/login?error=server_error');
  }
}