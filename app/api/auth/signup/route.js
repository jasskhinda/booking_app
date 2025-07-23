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
    
    console.log('Email verified and form completed for:', email);
    
    // Since OTP verification already created the user account,
    // we just need to let them know they can sign in
    return NextResponse.json({ 
      success: true, 
      message: 'Account setup completed! Please sign in with your email and password.',
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