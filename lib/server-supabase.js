import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  // Create a cookies instance
  const cookieStore = cookies();
  
  // Use the auth-helpers-nextjs helper which is specifically designed for Next.js
  return createServerComponentClient({ cookies: () => cookieStore });
}