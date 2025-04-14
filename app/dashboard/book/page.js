import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import BookingForm from '@/app/components/BookingForm';

export default async function BookRide() {
  try {
    // Create server component client
    const supabase = createServerComponentClient({ cookies });
    
    // Get and refresh session if needed
    const { data: { session } } = await supabase.auth.getSession();
    
    // Redirect to login if there's no session
    if (!session) {
      redirect('/login');
    }
    
    return <BookingForm user={session.user} />;
  } catch (error) {
    console.error('Error in book page:', error);
    redirect('/login?error=server_error');
  }
}