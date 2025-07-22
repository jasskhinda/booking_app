import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, otpCode } = await request.json();
    
    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    // Email template for OTP
    const subject = 'Your Verification Code - Compassionate Care Transportation';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verification Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #5fbfc0; margin: 0;">Compassionate Care Transportation</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
              <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
              <p style="margin-bottom: 30px; color: #666;">
                Enter this verification code to complete your account registration:
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #5fbfc0; display: inline-block;">
                <div style="font-size: 32px; font-weight: bold; color: #5fbfc0; letter-spacing: 8px; font-family: monospace;">
                  ${otpCode}
                </div>
              </div>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                This code will expire in 100 seconds for security purposes.
              </p>
              
              <p style="margin-top: 20px; color: #888; font-size: 12px;">
                If you didn't request this verification code, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
              <p>© 2024 Compassionate Care Transportation. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
      Compassionate Care Transportation
      
      Email Verification
      
      Enter this verification code to complete your account registration:
      
      ${otpCode}
      
      This code will expire in 100 seconds for security purposes.
      
      If you didn't request this verification code, please ignore this email.
      
      © 2024 Compassionate Care Transportation. All rights reserved.
    `;

    // Send the email
    await sendEmail({
      to: email,
      subject,
      text: textContent,
      html: htmlContent
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent successfully' 
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}