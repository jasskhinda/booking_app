// Client-side Supabase client
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createClientSupabase = () => {
  return createClientComponentClient();
};