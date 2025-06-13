import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { FaUser, FaUserPlus, FaPhoneAlt, FaSignOutAlt } from "react-icons/fa";
import HeaderUserArea from "@/app/components/HeaderUserArea";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Compassionate Care Transportation - Booking",
  description: "Accessible transportation for everyone",
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png' },
    ],
    shortcut: ['/favicon.png'],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }) {
  // Current timestamp for cache-busting favicons
  const faviconVersion = Date.now();

  return (
    <html lang="en">
      <head>
        {/* Force reload of favicon */}
        <link 
          rel="icon" 
          href={`/favicon.png?v=${faviconVersion}`} 
          type="image/png" 
          sizes="any"
        />
        <link 
          rel="apple-touch-icon" 
          href={`/favicon.png?v=${faviconVersion}`} 
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f8f9fa]`}> 
        <header className="sticky top-0 z-50 w-full" style={{ background: "#ffffffc2" }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 md:px-8">
            {/* Left: Logo */}
            <div className="flex items-center min-w-[160px]">
              <Link href="/">
                <Image src="/CCTVector-01-2048x1583.png" alt="Compassionate Care Transportation Logo" width={120} height={50} style={{ width: '120px', height: 'auto' }} className="inline-block align-middle" />
              </Link>
            </div>
            {/* Center: Nav */}
            <nav className="hidden md:flex flex-1 justify-center">
              <ul className="flex space-x-8">
                <li><a href="https://book.compassionatecaretransportation.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">HOME</a></li>
                <li><a href="https://compassionatecaretransportation.com/about-us/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">ABOUT</a></li>
                <li><a href="https://compassionatecaretransportation.com/services/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">SERVICES</a></li>
                <li><a href="https://compassionatecaretransportation.com/contact-us/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">CONTACT US</a></li>
              </ul>
            </nav>
            {/* Right: Call and Buttons/User */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 font-bold text-base text-black">
                <FaPhoneAlt className="inline-block mr-1 text-[#69c8cd]" />
                <span>Call Us:</span>
                <span className="font-bold tracking-wide">614-967-9887</span>
              </div>
              <span className="hidden md:block h-6 w-px bg-black/40 mx-2" />
              <HeaderUserArea />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-[#7bcfd0] py-8 border-t border-[#DDE5E7] dark:border-[#3F5E63]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-white mb-4 md:mb-0 text-sm">&copy; 2025 Compassionate Care Transportation. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#" className="text-white hover:text-white transition">Terms</a>
                <a href="#" className="text-white hover:text-white transition">Privacy</a>
                <a href="#" className="text-white hover:text-white transition">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
