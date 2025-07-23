import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    
    console.log('Creating user account for:', email);
    
    // Create a regular Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Create user account - this will send verification email automatically
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
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
    
    console.log('User account created successfully');
    
    // Account created - redirect to verification page
    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully!',
      redirectToVerification: true,
      email: email
    });
    
  } catch (error) {
    console.error('Server error in signup:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}