import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, unauthenticated — powers the homepage's live activity feed.
// Exposes only a hunter's chosen display name and signup time, nothing
// else, so real new signups can replace the old fake "someone is
// joining right now" simulation.
export async function GET() {
  const hunters = await prisma.profile.findMany({
    where: { isAdmin: false },
    select: { hunterId: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ hunters });
}
