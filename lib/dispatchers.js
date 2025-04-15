import { adminSupabase } from './admin-supabase';

// Use the centralized admin client from admin-supabase.js
const supabaseAdmin = adminSupabase;

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
    
    let dispatchers = [];
    
    try {
      // Try to use admin API first (requires service role key)
      const { data: usersData, error: usersError } = await supabaseAdmin
        .auth.admin.listUsers();
  
      if (!usersError) {
        // Filter to only users with IDs from our dispatcher profiles
        // and attach their profile data
        dispatchers = usersData.users
          .filter(user => dispatcherIds.includes(user.id))
          .map(user => {
            const profile = dispatcherProfiles.find(p => p.id === user.id);
            return {
              id: user.id,
              email: user.email,
              full_name: profile?.full_name || user.user_metadata?.full_name || 'Dispatcher',
            };
          });
      } else {
        console.warn('Admin API access denied. Falling back to profiles table only:', usersError.message);
        
        // Fallback to just using the profile data we have
        // Note: This won't have emails unless they're stored in profiles table
        dispatchers = dispatcherProfiles.map(profile => ({
          id: profile.id,
          email: profile.email || `${profile.id}@example.com`, // Fallback email that won't work
          full_name: profile.full_name || 'Dispatcher',
        }));
        
        console.log('Using dispatcher data from profiles only:', dispatchers);
      }
    } catch (error) {
      console.error('Error fetching dispatcher users:', error);
      
      // Fallback to just using the profile data we have
      dispatchers = dispatcherProfiles.map(profile => ({
        id: profile.id,
        email: profile.email || `${profile.id}@example.com`, // Fallback email that won't work
        full_name: profile.full_name || 'Dispatcher',
      }));
    }

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