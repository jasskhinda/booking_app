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
    
    // Step 1: Find the existing user created during OTP verification
    let existingUser = null;
    try {
      console.log('Looking for existing user created during OTP verification:', email);
      const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
      existingUser = existingUsers?.users?.find(user => user.email === email);
      
      if (existingUser) {
        console.log('Found existing user from OTP verification:', {
          id: existingUser.id,
          email: existingUser.email,
          email_confirmed_at: existingUser.email_confirmed_at,
          user_metadata: existingUser.user_metadata
        });
        
        // Check if this user already has complete profile data
        const hasCompleteProfile = existingUser.user_metadata?.first_name && 
                                  existingUser.user_metadata?.last_name;
        
        if (hasCompleteProfile) {
          console.log('User already has complete profile, rejecting signup');
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 400 }
          );
        }
        
        console.log('User exists but has incomplete profile, will update with complete data');
      } else {
        console.log('No existing user found - this should not happen after OTP verification');
        return NextResponse.json(
          { error: 'Email verification session expired. Please verify your email again.' },
          { status: 400 }
        );
      }
    } catch (checkError) {
      console.error('Error checking existing users:', checkError);
      return NextResponse.json(
        { error: 'Unable to verify user status' },
        { status: 500 }
      );
    }
    
    // Step 2: Update the existing user with complete profile data
    console.log('Updating existing user with complete profile data');
    const { data: userData, error: updateError } = await adminSupabase.auth.admin.updateUserById(
      existingUser.id,
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
    
    // The user is now created and email is confirmed
    
    // Step 3: Sign in the user automatically
    // We need to use a client with cookies support to establish a session
    const cookieStore = cookies();
    const supabase = createClient(
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
    
    // Now perform the sign-in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      console.error('Error signing in after creation:', signInError);
      return NextResponse.json({ error: signInError.message }, { status: 400 });
    }
    
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