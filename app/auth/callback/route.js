import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// This route handles the callback after OAuth sign-in
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  
  console.log('Auth callback called with:', { 
    code: code ? 'present' : 'missing',
    error, 
    errorDescription,
    type: requestUrl.searchParams.get('type'),
    tokenHash: requestUrl.searchParams.get('token_hash') ? 'present' : 'missing',
    fullUrl: requestUrl.toString(),
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  });
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error received:', { error, errorDescription, allParams: Object.fromEntries(requestUrl.searchParams.entries()) });
    
    // Log more details for debugging
    if (error === 'access_denied') {
      console.error('Google OAuth access denied - possible causes:');
      console.error('1. Email already exists with different auth method');
      console.error('2. Supabase Auth settings not allowing account linking');
      console.error('3. OAuth client configuration mismatch');
      console.error('4. User declined authorization');
    }
    
    const errorParam = error === 'access_denied' ? 'access_denied' : 'Authentication failed';
    const detailedError = errorDescription ? `${errorParam}: ${errorDescription}` : errorParam;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(detailedError)}`, requestUrl.origin)
    );
  }
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      console.log('Attempting to exchange code for session...');
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        
        // Handle specific email confirmation errors
        if (exchangeError.message?.includes('expired') || exchangeError.message?.includes('invalid')) {
          return NextResponse.redirect(
            new URL('/signup?error=Email confirmation link expired. Please sign up again.', requestUrl.origin)
          );
        }
        
        return NextResponse.redirect(
          new URL('/login?error=Authentication failed', requestUrl.origin)
        );
      }
      
      console.log('Session exchange successful, user:', data?.session?.user?.email);
      
      // For OAuth users, ensure they have a profile entry and role
      if (data && data.session && data.session.user) {
        const user = data.session.user;
        console.log('Processing user profile for:', user.email);
        
        try {
          // Check if profile exists, if not create it
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log('Creating new profile for user:', user.email);
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                role: 'client',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.error('Error creating profile:', insertError);
            } else {
              console.log('Profile created successfully');
            }
          } else if (!existingProfile?.role) {
            // Profile exists but no role, update it
            console.log('Updating profile role for user:', user.email);
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                role: 'client',
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
            
            if (updateError) {
              console.error('Error updating profile role:', updateError);
            } else {
              console.log('Profile role updated successfully');
            }
          } else {
            console.log('Profile already exists with correct role');
          }
          
        } catch (profileError) {
          console.error('Error handling user profile:', profileError);
          // Continue with the redirect even if profile updates fail
        }
      }
      
      // Successful authentication, redirect to dashboard
      console.log('Redirecting to dashboard after successful authentication');
      
      // Check if this is an email confirmation by looking for specific parameters
      const isEmailConfirmation = requestUrl.searchParams.get('type') === 'signup' || 
                                  requestUrl.searchParams.get('token_hash');
      
      if (isEmailConfirmation) {
        // SECURITY FIX: Don't auto-login for email confirmations during signup
        // Check if this is a temporary signup user
        const user = data.session.user;
        if (user.user_metadata?.temp_signup) {
          // This is a temp user - sign them out and redirect to signup with verification
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL('/signup?otp_verified=true&email=' + encodeURIComponent(user.email), requestUrl.origin));
        }
        
        // For regular email confirmations (password resets, etc.), show confirmation page
        return NextResponse.redirect(new URL('/email-confirmed', requestUrl.origin));
      } else {
        // Direct redirect to dashboard for OAuth
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
      }
      
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(
        new URL('/login?error=Authentication failed', requestUrl.origin)
      );
    }
  }
  
  // If no code is present, redirect back to login
  console.log('No code parameter found in callback, redirecting to login');
  return NextResponse.redirect(new URL('/login?error=Authentication failed', requestUrl.origin));
}