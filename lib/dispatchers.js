import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
// Note: This should use a service_role key for admin access, not anon key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Fallback to anon key in dev
);

/**
 * Fetch all users with the 'dispatcher' role
 * @returns {Promise<Array>} - Array of dispatcher users with their emails
 */
export async function getDispatchers() {
  try {
    // First get all profiles with 'dispatcher' role
    const { data: dispatcherProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'dispatcher');

    if (profilesError) {
      console.error('Error fetching dispatcher profiles:', profilesError);
      return [];
    }

    if (!dispatcherProfiles.length) {
      console.log('No dispatchers found in profiles table');
      return [];
    }

    // Get user emails from auth.users table using the service role key
    // In development, we'll use an alternative approach if service key isn't available
    const dispatcherIds = dispatcherProfiles.map(profile => profile.id);
    
    // Since we may not have access to auth.users without service role key,
    // we'll check for any emails in user_metadata
    const { data: usersData, error: usersError } = await supabaseAdmin
      .auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return [];
    }

    // Filter to only users with IDs from our dispatcher profiles
    // and attach their profile data
    const dispatchers = usersData.users
      .filter(user => dispatcherIds.includes(user.id))
      .map(user => {
        const profile = dispatcherProfiles.find(p => p.id === user.id);
        return {
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || 'Dispatcher',
        };
      });

    return dispatchers;
  } catch (error) {
    console.error('Error in getDispatchers function:', error);
    return [];
  }
}

/**
 * Get just the dispatcher email addresses
 * @returns {Promise<Array<string>>} - Array of dispatcher email addresses
 */
export async function getDispatcherEmails() {
  const dispatchers = await getDispatchers();
  return dispatchers.map(d => d.email);
}