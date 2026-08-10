"use client";

import { useState, useTransition } from "react";
import { cancelSubscription } from "@/actions/settings";

export function CancelSubscriptionLink({ disabled }: { disabled: boolean }) {
  const [canceled, setCanceled] = useState(disabled);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (canceled) return;
    if (!confirm("Cancel your subscription? Access continues until this cycle ends, then the account locks until you resubscribe.")) {
      return;
    }
    startTransition(async () => {
      await cancelSubscription();
      setCanceled(true);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || canceled}
      style={{
        textAlign: "center",
        padding: "12px",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "12px",
        color: canceled ? "var(--slate)" : "var(--red)",
        background: "none",
        border: "none",
        cursor: canceled ? "default" : "pointer",
      }}
    >
      {canceled ? "Subscription canceled" : pending ? "Canceling…" : "Cancel subscription"}
    </button>
  );
}
