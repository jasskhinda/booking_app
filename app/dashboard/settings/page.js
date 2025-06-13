import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ProfileForm from '@/app/components/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function Settings() {
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
          <ProfileForm user={session.user} profile={profile || {}} />
        </div>
      </section>
    );
  } catch (error) {
    console.error('Error in settings page:', error);
    redirect('/login?error=server_error');
  }
}