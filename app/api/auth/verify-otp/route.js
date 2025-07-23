import { otpStore } from '@/lib/otp-store';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, code, verificationId } = await request.json();
    
    if (!email || !code || !verificationId) {
      return NextResponse.json(
        { error: 'Email, code, and verification ID are required' },
        { status: 400 }
      );
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code format' },
        { status: 400 }
      );
    }

    // Get stored OTP data
    const storeKey = `${email}_${verificationId}`;
    const storedData = otpStore.get(storeKey);
    
    if (!storedData) {
      return NextResponse.json(
        { error: 'Verification code expired or not found' },
        { status: 400 }
      );
    }
    
    // Check expiration (100 seconds)
    const now = Date.now();
    if (now - storedData.timestamp > 100000) {
      otpStore.delete(storeKey);
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }
    
    // Check attempt limits
    if (storedData.attempts >= 3) {
      otpStore.delete(storeKey);
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code.' },
        { status: 400 }
      );
    }
    
    // Verify the code
    if (storedData.code !== code) {
      storedData.attempts += 1;
      otpStore.set(storeKey, storedData);
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }
    
    // Code is valid - remove from store
    otpStore.delete(storeKey);
    
    console.log(`OTP verified successfully for ${email}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Code verified successfully' 
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}