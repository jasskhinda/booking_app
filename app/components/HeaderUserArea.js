"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaUser, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import Link from "next/link";

export default function HeaderUserArea() {
  const [user, setUser] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/?logout=true';
  };

  if (user) {
    const name = user.user_metadata?.full_name || user.user_metadata?.first_name || user.email || 'User';
    return (
      <div className="flex items-center gap-4">
        <span className="font-bold text-black">{name}</span>
        <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2 rounded-full font-bold bg-[#69c8cd] text-white hover:bg-[#3ea7b2] transition-all text-base shadow-sm">
          <FaSignOutAlt /> LOGOUT
        </button>
      </div>
    );
  }
  return (
    <>
      <Link href="/login" className="flex items-center gap-2 px-5 py-2 rounded-full font-bold bg-[#69c8cd] text-white hover:bg-[#3ea7b2] transition-all text-base shadow-sm"><FaUser /> Login</Link>
      <Link href="/signup" className="flex items-center gap-2 px-5 py-2 rounded-full font-bold bg-[#69c8cd] text-white hover:bg-[#3ea7b2] transition-all text-base shadow-sm"><FaUserPlus /> Sign Up</Link>
    </>
  );
}
