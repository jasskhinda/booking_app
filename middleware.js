import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    // Auth routes
    '/login',
    '/signup',
    '/reset-password',
    '/update-password',
    
    // Protected routes
    '/dashboard',
    '/dashboard/:path*',
  ],
};

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  console.log(`Middleware handling path: ${pathname}`);
  
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
  const protectedRoutes = ['/dashboard', '/dashboard/book', '/dashboard/trips', '/dashboard/settings'];
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (isProtectedRoute && !session) {
    // If the route is protected and user is not authenticated, redirect to login
    console.log('Redirecting to login from protected route');
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Define auth routes that should redirect to dashboard if user is already logged in
  const authRoutes = ['/login', '/signup', '/reset-password'];
  
  if (authRoutes.includes(pathname) && session) {
    // If trying to access an auth route while already logged in, redirect to dashboard
    console.log('Redirecting to dashboard from auth route');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  // For all other cases, return the response with any session cookie updates
  return res;
}
