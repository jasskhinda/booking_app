"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function HeaderNav() {
  const [user, setUser] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, [supabase]);

  if (user) {
    // Logged in: show dashboard nav
    return (
      <nav className="hidden md:flex flex-1 justify-center">
        <ul className="flex space-x-8">
          <li><Link href="/dashboard/book" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">Book Now</Link></li>
          <li><Link href="/dashboard/trips" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">View Trips</Link></li>
          <li><Link href="/dashboard/settings" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">Settings</Link></li>
        </ul>
      </nav>
    );
  }
  // Not logged in: show public nav
  return (
    <nav className="hidden md:flex flex-1 justify-center">
      <ul className="flex space-x-8">
        <li><a href="https://book.compassionatecaretransportation.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">HOME</a></li>
        <li><a href="https://compassionatecaretransportation.com/about-us/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">ABOUT</a></li>
        <li><a href="https://compassionatecaretransportation.com/services/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">SERVICES</a></li>
        <li><a href="https://compassionatecaretransportation.com/contact-us/" target="_blank" rel="noopener noreferrer" className="font-bold text-black uppercase tracking-wide hover:text-[#69c8cd] transition">CONTACT US</a></li>
      </ul>
    </nav>
  );
}
