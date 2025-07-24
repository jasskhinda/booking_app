import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Store signup data temporarily (in production, use Redis or database)
export const signupStore = new Map();

export async function POST(request) {
  try {
    const { email, password, firstName, lastName, birthdate, phoneNumber, address, marketingConsent } = await request.json();
    
    // Validate inputs
    if (!email || !password || !firstName || !lastName || !birthdate || !phoneNumber || !address) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    console.log('Starting signup process for:', email);
    
    // Create a regular Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Store signup data temporarily
    const signupData = {
      email,
      password,
      firstName,
      lastName,
      birthdate,
      phoneNumber,
      address,
      marketingConsent,
      timestamp: Date.now()
    };
    
    // Generate a unique signup ID
    const signupId = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    signupStore.set(signupId, signupData);
    
    // Clean up old entries (older than 10 minutes)
    for (const [key, data] of signupStore.entries()) {
      if (Date.now() - data.timestamp > 600000) {
        signupStore.delete(key);
      }
    }
    
    // Send OTP for email verification (this works in test-email page)
    const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
      email: email,
    });
    
    if (otpError && !otpError.message.includes('User already registered')) {
      console.error('OTP send error:', otpError);
      return NextResponse.json({ error: otpError.message }, { status: 400 });
    }
    
    console.log('OTP sent successfully for signup verification');
    
    // Set signup ID in cookie for verification page
    const cookieStore = cookies();
    cookieStore.set('signup_id', signupId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });
    
    // Redirect to OTP verification page
    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent! Please check your email.',
      redirectToVerification: true,
      email: email,
      useOtp: true
    });
    
  } catch (error) {
    console.error('Server error in signup:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}