import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardView from '@/app/components/DashboardView';

// This is a Server Component
export default async function Dashboard() {
  // This runs on the server
  const { data: { session } } = await supabase.auth.getSession();
  
  // Redirect to login if there's no session
  if (!session) {
    redirect('/login');
  }
  
  return <DashboardView user={session.user} />;
}