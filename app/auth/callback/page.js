"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Exchange the code for a session in the browser
    supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
      if (!error) {
        router.replace("/dashboard");
      } else {
        router.replace("/login?error=Authentication failed");
      }
    });
  }, [router, supabase]);

  return <div>Signing you in...</div>;
}
