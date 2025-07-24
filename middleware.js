import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    // Auth routes (but NOT /auth/confirm)
    '/login',
    '/signup',
    '/reset-password',
    '/update-password',
    '/email-confirmed',
    
    // Protected routes
    '/dashboard',
    '/dashboard/:path*',
  ],
};

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  console.log(`Middleware handling path: ${pathname}`);
  
  // Allow test page and email confirmation without authentication
  if (pathname.startsWith('/test-payment') || pathname === '/email-confirmed') {
    return NextResponse.next();
  }
  
  // Create a response object that we can modify
  const res = NextResponse.next();
  
  // Create a Supabase client specifically for middleware
  const supabase = createMiddlewareClient({ req, res });
  
  // This will refresh the session if it exists and is expired
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  console.log('Session check in middleware:', { 
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    emailConfirmed: session?.user?.email_confirmed_at,
    path: pathname 
  });
  
  // Define which routes should be protected
  const protectedRoutes = ['/dashboard', '/dashboard/book', '/dashboard/trips', '/dashboard/settings', '/dashboard/payment-methods', '/update-password'];
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Allow auth pages and error handling without loops
  const authPages = ['/login', '/signup', '/auth/confirm', '/auth/callback'];
  if (authPages.includes(pathname)) {
    // Don't interfere with auth pages - let them handle their own errors
    return NextResponse.next();
  }
  
  if (isProtectedRoute) {
    // If there's no session, redirect to login
    if (!session) {
      console.log('Redirecting to login from protected route - No session');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('returnTo', pathname);
      redirectUrl.searchParams.set('fresh', 'true'); // Add flag to prevent redirect loops
      return NextResponse.redirect(redirectUrl);
    }
    
    // Check email verification status with grace period for recent confirmations
    const isEmailVerified = session.user.email_confirmed_at || session.user.user_metadata?.email_verified;
    
    if (!isEmailVerified) {
      // Check if this is a very recent user (within last 5 minutes) - might be confirming email
      const userCreatedAt = new Date(session.user.created_at);
      const now = new Date();
      const timeSinceCreation = now - userCreatedAt;
      const fiveMinutesInMs = 5 * 60 * 1000;
      
      if (timeSinceCreation < fiveMinutesInMs) {
        // Very recent user, might be in the middle of email confirmation
        console.log('Recent user accessing dashboard - allowing for potential email confirmation in progress');
        return NextResponse.next();
      }
      
      // Also check if this request has the fresh confirmation flag or session storage flag
      const referer = req.headers.get('referer') || '';
      if (referer.includes('/auth/confirm')) {
        console.log('Request coming from email confirmation - allowing access');
        return NextResponse.next();
      }
      
      // Check if user just confirmed email (for immediate access)
      const hasJustConfirmed = req.headers.get('x-email-just-confirmed') === 'true';
      if (hasJustConfirmed) {
        console.log('User just confirmed email - allowing immediate access');
        return NextResponse.next();
      }
      
      console.log('Redirecting to login - Email not verified', {
        userId: session.user.id,
        email: session.user.email,
        emailConfirmedAt: session.user.email_confirmed_at,
        emailVerifiedMetadata: session.user.user_metadata?.email_verified,
        userCreatedAt: session.user.created_at,
        timeSinceCreation: timeSinceCreation
      });
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('error', 'email_not_verified');
      redirectUrl.searchParams.set('message', 'Please verify your email before accessing the dashboard');
      return NextResponse.redirect(redirectUrl);
    }
    
    // Check if user has 'client' role in their metadata
    const userRole = session.user.user_metadata?.role;
    
    if (userRole !== 'client') {
      // If user doesn't have the right role, fetch from profiles table
      // This is necessary for users created before role implementation
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        // If profile exists and doesn't have 'client' role, log the user out
        // For OAuth users, give a grace period for profile creation
        if (!profile) {
          // No profile found - this might be a new OAuth user
          // Check if this is a recent OAuth signup by looking at user creation time
          const userCreatedAt = new Date(session.user.created_at);
          const now = new Date();
          const timeSinceCreation = now - userCreatedAt;
          const fiveMinutesInMs = 5 * 60 * 1000;
          
          if (timeSinceCreation < fiveMinutesInMs) {
            // Recent user, allow them to continue and let the auth callback handle profile creation
            console.log('New user detected, allowing access for profile creation');
          } else {
            // Old user without profile, block access
            console.log('Redirecting to login from protected route - No profile found');
            await supabase.auth.signOut();
            await new Promise(resolve => setTimeout(resolve, 100));
            const redirectUrl = new URL('/login', req.url);
            redirectUrl.searchParams.set('error', 'access_denied');
            redirectUrl.searchParams.set('fresh', 'true');
            return NextResponse.redirect(redirectUrl);
          }
        } else if (profile.role !== 'client') {
          // Profile exists but wrong role
          console.log('Redirecting to login from protected route - Invalid role');
          await supabase.auth.signOut();
          await new Promise(resolve => setTimeout(resolve, 100));
          const redirectUrl = new URL('/login', req.url);
          redirectUrl.searchParams.set('error', 'access_denied');
          redirectUrl.searchParams.set('fresh', 'true');
          return NextResponse.redirect(redirectUrl);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // On error, also redirect to login
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('error', 'server_error');
        redirectUrl.searchParams.set('fresh', 'true'); // Add flag to prevent redirect loops
        return NextResponse.redirect(redirectUrl);
      }
    }
  }
  
  // Define auth routes that should redirect to dashboard if user is already logged in
  const authRoutes = ['/login', '/signup', '/reset-password'];
  
  if (authRoutes.includes(pathname) && session) {
    // Check for the 'fresh' flag or logout flag to prevent redirect loops
    const freshLogin = req.nextUrl.searchParams.get('fresh') === 'true';
    const isLogout = req.nextUrl.searchParams.get('logout') === 'true';
    
    // Allow navigation between auth routes even if session exists
    const referer = req.headers.get('referer') || '';
    const isAuthToAuthNavigation = authRoutes.some(route => referer.includes(route));
    
    // SECURITY FIX: Never redirect from signup page to dashboard
    // Users should complete the signup process even if they have a session
    if (pathname === '/signup') {
      console.log('Allowing signup page access - signup form will handle session management');
      // Let the signup form handle session management instead of middleware
      return NextResponse.next();
    }
    
    if (!freshLogin && !isLogout && !isAuthToAuthNavigation) {
      console.log('Redirecting to dashboard from auth route');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  // For all other cases, return the response with any session cookie updates
  return res;
}
