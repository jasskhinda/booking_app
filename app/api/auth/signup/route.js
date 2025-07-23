import { adminSupabase } from '@/lib/admin-supabase';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { email, password, firstName, lastName, birthdate, phoneNumber, address, marketingConsent, emailVerified } = await request.json();
    
    // Validate inputs
    if (!email || !password || !firstName || !lastName || !birthdate || !phoneNumber || !address) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // SECURITY: Require email verification
    if (!emailVerified) {
      return NextResponse.json(
        { error: 'Email verification required' },
        { status: 400 }
      );
    }
    
    // Step 1: Get the current user from the session (created during OTP verification)
    const cookieStore = cookies();
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          storageKey: 'sb-session',
          cookies: {
            get: (key) => {
              const cookie = cookieStore.get(key);
              return cookie?.value;
            },
            set: (key, value, options) => {
              cookieStore.set(key, value, options);
            },
            remove: (key, options) => {
              cookieStore.set(key, '', { ...options, maxAge: 0 });
            },
          },
        },
      }
    );
    
    const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
    
    if (!currentUser) {
      console.log('No current user session found');
      return NextResponse.json(
        { error: 'Email verification session expired. Please verify your email again.' },
        { status: 400 }
      );
    }
    
    if (currentUser.email !== email) {
      console.log('Session email does not match form email');
      return NextResponse.json(
        { error: 'Email verification session mismatch. Please verify your email again.' },
        { status: 400 }
      );
    }
    
    console.log('Found current user from session:', {
      id: currentUser.id,
      email: currentUser.email,
      email_confirmed_at: currentUser.email_confirmed_at,
      user_metadata: currentUser.user_metadata
    });
    
    // Check if this user already has complete profile data
    const hasCompleteProfile = currentUser.user_metadata?.first_name && 
                              currentUser.user_metadata?.last_name;
    
    if (hasCompleteProfile) {
      console.log('User already has complete profile, rejecting signup');
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }
    
    console.log('User exists but has incomplete profile, will update with complete data');
    
    // Step 2: Update the existing user with complete profile data
    console.log('Updating existing user with complete profile data');
    const { data: userData, error: updateError } = await adminSupabase.auth.admin.updateUserById(
      currentUser.id,
      {
        password: password,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          birthdate: birthdate,
          phone_number: phoneNumber,
          address: address,
          marketing_consent: marketingConsent || false,
          role: 'client',
        }
      }
    );
    
    if (updateError) {
      console.error('Error updating user with profile data:', updateError);
      console.error('Full error details:', JSON.stringify(updateError, null, 2));
      return NextResponse.json({ error: `Failed to complete account setup: ${updateError.message}` }, { status: 400 });
    }
    
    console.log('User profile updated successfully:', userData.user?.id);
    
    // The user profile is now complete and they're already signed in from OTP verification
    
    // Return successful response with user data
    return NextResponse.json({ 
      success: true, 
      user: userData.user,
      message: 'User created and signed in successfully'
    });
    
  } catch (error) {
    console.error('Server error in signup:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}