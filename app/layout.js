import Link from "next/link";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="p-4" style={{ backgroundColor: '#ffffff8a' }}>
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-[#2E4F54] dark:text-[#E0F4F5]">
                <img src="/CCTVector-01-2048x1583.png" alt="Compassionate Care Transportation Logo" style={{ width: '120px', height: 'auto' }} className="inline-block align-middle" />
              </h1>
            </div>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <a href="https://compassionatecaretransportation.com/about-us/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase">ABOUT US</a>
                </li>
                <li>
                  <a href="https://compassionatecaretransportation.com/contact-us/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase">CONTACT US</a>
                </li>
                <li>
                  <a href="https://compassionatecaretransportation.com/services/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase">OUR SERVICES</a>
                </li>
                <li>
                  <Link href="/login" className="bg-[#7bcfd0] text-white px-4 py-2 rounded hover:bg-[#60BFC0] transition-colors font-bold uppercase">LOGIN</Link>
                </li>
                <li>
                  <Link href="/signup" className="bg-[#7CCFD0] text-white px-4 py-2 rounded hover:bg-[#60BFC0] transition-colors font-bold uppercase">SIGN UP</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-[#F8F9FA] dark:bg-[#1C2C2F] py-8 border-t border-[#DDE5E7] dark:border-[#3F5E63]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 mb-4 md:mb-0">&copy; 2025 Compassionate Care Transportation. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#" className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 hover:text-[#7CCFD0] dark:hover:text-[#7CCFD0]">Terms</a>
                <a href="#" className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 hover:text-[#7CCFD0] dark:hover:text-[#7CCFD0]">Privacy</a>
                <a href="#" className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 hover:text-[#7CCFD0] dark:hover:text-[#7CCFD0]">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
