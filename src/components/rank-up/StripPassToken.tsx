"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Drops the pass from the address bar as soon as the screen has loaded, so a
// refresh, Back-forward or copied link no longer carries a usable pass. If a
// browser ever restores this screen from its in-memory page cache (Back/Forward
// on some browsers), it is not a real moment — send the hunter to Profile.
export function StripPassToken() {
  const router = useRouter();
  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname);
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) router.replace("/profile");
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [router]);
  return null;
}
