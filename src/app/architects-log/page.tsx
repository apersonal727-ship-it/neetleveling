import type { Metadata } from "next";
import { ArchitectsLogContent } from "./ArchitectsLogContent";

export const metadata: Metadata = {
  title: "The Architect's Log — NEETLeveling",
  description: "The story of how NEETLeveling was built — solo, start to finish.",
};

export default function ArchitectsLogPage() {
  return <ArchitectsLogContent />;
}
