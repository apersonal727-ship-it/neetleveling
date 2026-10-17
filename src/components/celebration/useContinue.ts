"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { openStep, type OpenResult } from "@/actions/rank-up";
import type { Dest } from "@/lib/rank-up-pass";

export type StepOpener = (steps: string[], dest: Dest) => Promise<OpenResult>;

// What a celebration screen's Continue does: open the next screen in the chain
// (replacing this one in the browser history), or — at the end — land on the
// destination. Replacing, never pushing, is what keeps Back from ever revealing
// these screens: it returns to whatever the hunter was doing before them.
export function useContinue(rest: string[], dest: Dest, opener: StepOpener = openStep) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function next() {
    if (busy) return;
    setBusy(true);
    try {
      if (rest.length > 0 && dest !== "back") {
        const res = await opener(rest, dest);
        if ("href" in res) {
          router.replace(res.href);
          return;
        }
      }
      if (dest === "back") router.back();
      else router.replace(dest === "profile" ? "/profile" : "/dashboard");
    } finally {
      setBusy(false);
    }
  }
  return next;
}
