import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signupStore } from '../signup/route.js';

// Create admin client for user creation (only if service key exists)
const createAdminClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }
    
    console.log('Verifying OTP for signup:', email);
    
    // Create a regular Supabase client for OTP verification
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set(name, value, options);
          },
          remove(name, options) {
            cookieStore.set(name, '', options);
          },
        },
      }
    );
    
    // Verify OTP
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'email'
    });
    
    if (verifyError) {
      console.error('OTP verification error:', verifyError);
      return NextResponse.json({ error: verifyError.message }, { status: 400 });
    }
    
    console.log('OTP verified successfully');
    
    // Get signup data from store
    const signupId = cookieStore.get('signup_id')?.value;
    if (!signupId) {
      return NextResponse.json({ error: 'Signup session expired. Please start over.' }, { status: 400 });
    }
    
    // Find signup data across all stored entries (for this implementation)
    let signupData = null;
    for (const [key, data] of signupStore.entries()) {
      if (key === signupId && data.email === email) {
        signupData = data;
        break;
      }
    }
    
    
    if (!signupData) {
      return NextResponse.json({ error: 'Signup data not found. Please start over.' }, { status: 400 });
    }
    
    // Create the actual user account
    let userData, createError;
    
    const adminSupabase = createAdminClient();
    if (adminSupabase) {
      // Use admin API if available (local development)
      const result = await adminSupabase.auth.admin.createUser({
        email: signupData.email,
        password: signupData.password,
        email_confirm: true, // Mark email as confirmed
        user_metadata: {
          first_name: signupData.firstName,
          last_name: signupData.lastName,
          birthdate: signupData.birthdate,
          phone_number: signupData.phoneNumber,
          address: signupData.address,
          marketing_consent: signupData.marketingConsent || false,
          role: 'client',
        }
      });
      userData = result.data;
      createError = result.error;
    } else {
      // Use regular signup for production
      const result = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            birthdate: signupData.birthdate,
            phone_number: signupData.phoneNumber,
            address: signupData.address,
            marketing_consent: signupData.marketingConsent || false,
            role: 'client',
          }
        }
      });
      userData = result.data;
      createError = result.error;
    }
    
    if (createError) {
      console.error('User creation error:', createError);
      
      // If user already exists, try to sign them in
      if (createError.message.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: signupData.email,
          password: signupData.password,
        });
        
        if (signInError) {
          return NextResponse.json({ error: 'Account already exists. Please login.' }, { status: 400 });
        }
        
        // Clean up signup data
        signupStore.delete(signupId);
        cookieStore.delete('signup_id');
        
        return NextResponse.json({ 
          success: true, 
          message: 'Logged in successfully!',
          redirect: '/dashboard'
        });
      }
      
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }
    
    console.log('User account created successfully');
    
    // Clean up signup data
    signupStore.delete(signupId);
    cookieStore.delete('signup_id');
    
    // Sign in the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: signupData.email,
      password: signupData.password,
    });
    
    if (signInError) {
      console.error('Auto sign-in error:', signInError);
      return NextResponse.json({ 
        success: true, 
        message: 'Account created! Please login.',
        redirect: '/login'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Account created and verified successfully!',
      redirect: '/dashboard'
    });
    
  } catch (error) {
    console.error('Server error in verify-signup:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}