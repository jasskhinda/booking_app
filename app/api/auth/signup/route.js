import { adminSupabase } from '@/lib/admin-supabase';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { email, password, firstName, lastName, birthdate, marketingConsent } = await request.json();
    
    // Validate inputs
    if (!email || !password || !firstName || !lastName || !birthdate) {
      return NextResponse.json(
        { error: 'Email, password, first name, last name, and date of birth are required' },
        { status: 400 }
      );
    }
    
    // Step 1: Create the user with admin privileges (bypasses email confirmation)
    const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This is the key setting that bypasses email confirmation
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        birthdate: birthdate,
        marketing_consent: marketingConsent || false,
        role: 'client',
      },
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }
    
    // The user is now created and email is confirmed
    
    // Step 2: Sign in the user automatically
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