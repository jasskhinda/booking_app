import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    
    // Require email verification
    if (!emailVerified) {
      return NextResponse.json(
        { error: 'Email verification required' },
        { status: 400 }
      );
    }
    
    console.log('Creating user account for:', email);
    
    // Create a regular Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Create the user account with all their information
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          birthdate: birthdate,
          phone_number: phoneNumber,
          address: address,
          marketing_consent: marketingConsent || false,
          role: 'client',
        }
      }
    });
    
    if (signUpError) {
      console.error('Signup error:', signUpError);
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }
    
    console.log('User created successfully');
    
    // Since we already verified their email with OTP, they should be able to sign in immediately
    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully! You can now sign in.',
      redirect: '/login?email=' + encodeURIComponent(email)
    });
    
  } catch (error) {
    console.error('Server error in signup:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}