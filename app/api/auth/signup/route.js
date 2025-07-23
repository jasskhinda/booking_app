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
    
    // Step 1: Check if user already exists (and delete any incomplete OTP-only users)
    try {
      const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(user => user.email === email);
      
      if (existingUser) {
        // Check if this user was created only for OTP verification (no complete profile)
        // These users would have been created during OTP verification but never completed signup
        const isIncompleteOtpUser = !existingUser.user_metadata?.first_name && 
                                   !existingUser.user_metadata?.last_name &&
                                   existingUser.email_confirmed_at; // Has verified email but no profile
        
        if (isIncompleteOtpUser) {
          console.log('Deleting incomplete OTP-only user to allow proper signup:', email);
          // Delete the incomplete user so we can create a proper one
          await adminSupabase.auth.admin.deleteUser(existingUser.id);
        } else {
          // This is a complete user account
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 400 }
          );
        }
      }
    } catch (checkError) {
      console.error('Error checking existing users:', checkError);
      // Continue with signup if we can't check
    }
    
    // Step 2: Create the user with admin privileges (bypasses email confirmation)
    const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This is the key setting that bypasses email confirmation
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        birthdate: birthdate,
        phone_number: phoneNumber,
        address: address,
        marketing_consent: marketingConsent || false,
        role: 'client',
      },
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }
    
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