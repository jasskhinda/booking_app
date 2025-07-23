import { adminSupabase } from '@/lib/admin-supabase';
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
    
    console.log('Creating new user account for:', email);
    
    // Create the user account
    const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation since we verified OTP
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
      
      // If user already exists, that's probably from OTP verification
      if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
        console.log('User already exists, updating profile instead');
        
        // Find the existing user and update their profile
        const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(user => user.email === email);
        
        if (existingUser) {
          const { data: updatedUser, error: updateError } = await adminSupabase.auth.admin.updateUserById(
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
            console.error('Error updating user:', updateError);
            return NextResponse.json({ error: 'Failed to complete account setup' }, { status: 400 });
          }
          
          console.log('User profile updated successfully');
          return NextResponse.json({ 
            success: true, 
            message: 'Account created successfully',
            user: updatedUser.user
          });
        }
      }
      
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }
    
    console.log('User created successfully:', userData.user?.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully',
      user: userData.user
    });
    
  } catch (error) {
    console.error('Server error in signup:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}