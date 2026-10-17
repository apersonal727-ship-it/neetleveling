"use client";

import type { Dest } from "@/lib/rank-up-pass";
import { useContinue, type StepOpener } from "./useContinue";

export function ContinueButton({
  rest,
  dest,
  className,
  children,
  opener,
}: {
  rest: string[];
  dest: Dest;
  className?: string;
  children: React.ReactNode;
  opener?: StepOpener;
}) {
  const next = useContinue(rest, dest, opener);
  return (
    <button type="button" className={className} onClick={next}>
      {children}
    </button>
  );
}
