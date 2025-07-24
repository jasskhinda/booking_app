import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    // Auth routes
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
  
  console.log('Session check in middleware:', session ? 'Session exists' : 'No session');
  
  // Define which routes should be protected
  const protectedRoutes = ['/dashboard', '/dashboard/book', '/dashboard/trips', '/dashboard/settings', '/dashboard/payment-methods', '/update-password'];
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (isProtectedRoute) {
    // If there's no session, redirect to login
    if (!session) {
      console.log('Redirecting to login from protected route - No session');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('returnTo', pathname);
      redirectUrl.searchParams.set('fresh', 'true'); // Add flag to prevent redirect loops
      return NextResponse.redirect(redirectUrl);
    }
    
    // Check email verification status
    if (!session.user.email_confirmed_at) {
      console.log('Redirecting to signup - Email not verified');
      const redirectUrl = new URL('/signup', req.url);
      redirectUrl.searchParams.set('error', 'email_not_verified');
      redirectUrl.searchParams.set('message', 'Please verify your email to continue');
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
