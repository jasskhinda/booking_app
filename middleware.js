import { authMiddleware } from './lib/auth';

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

export default authMiddleware;