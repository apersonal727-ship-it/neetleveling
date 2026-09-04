import type { Metadata } from "next";
import { HomeContent } from "./HomeContent";

export const metadata: Metadata = {
  title: "NEETLEVELING — Activate Your System.",
};

export default function LandingPage() {
  return <HomeContent />;
}
