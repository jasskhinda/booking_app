import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Create Supabase client for route handler
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session, return unauthorized
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', hasClientRole: false },
        { status: 401 }
      );
    }
    
    // First check user metadata for role
    let hasClientRole = session.user.user_metadata?.role === 'client';
    
    // If role not found in metadata, check profiles table
    if (!hasClientRole) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      hasClientRole = profile?.role === 'client';
    }
    
    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      hasClientRole
    });
  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}