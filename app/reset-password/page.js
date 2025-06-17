'use client';

import Link from "next/link";
import ResetPasswordForm from '@/app/components/ResetPasswordForm';

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 left-0 right-0 p-4 bg-white/60 backdrop-blur-sm border-b border-white/20 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <img 
                src="/cctlogo.png" 
                alt="Compassionate Care Transportation" 
                style={{ width: '117px', height: 'auto' }}
              />
            </Link>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/login" className="bg-[#5fbfc0] text-white px-4 py-2 rounded hover:bg-[#4aa5a6] transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section with Parallax and Reset Password Form */}
      <section className="hero-parallax login-form-container">
        <div className="hero-background"></div>
        <div className="hero-overlay"></div>
        
        {/* Reset Password Form Content */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#5fbfc0]/20 p-6 md:p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-[#5fbfc0] mb-2">Reset Password</h1>
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-[#5fbfc0] hover:text-[#4aa5a6] transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
            <ResetPasswordForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#5fbfc0] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white mb-4 md:mb-0">&copy; 2025 Compassionate Care Transportation. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link href="#" className="text-white hover:text-white/80">
                Terms
              </Link>
              <Link href="#" className="text-white hover:text-white/80">
                Privacy
              </Link>
              <Link href="#" className="text-white hover:text-white/80">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}