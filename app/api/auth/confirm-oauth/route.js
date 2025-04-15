import { adminSupabase } from '@/lib/admin-supabase';
import { NextResponse } from 'next/server';

// This endpoint is called after OAuth login to ensure the user's email is confirmed
export async function POST(request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Use admin API to ensure email is confirmed
    const { error } = await adminSupabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );
    
    if (error) {
      console.error('Error confirming email:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Email confirmed successfully'
    });
    
  } catch (error) {
    console.error('Server error in email confirmation:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}