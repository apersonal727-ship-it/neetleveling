import { prisma } from "@/lib/prisma";

function randomDigits(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 10);
  return out;
}

function randomAlnum(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function generateHunterId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = randomDigits(6);
    const existing = await prisma.profile.findUnique({
      where: { hunterId: id },
      select: { id: true },
    });
    if (!existing) return id;
  }
  throw new Error("Could not generate a unique hunter ID");
}

export async function generateReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `NEET-${randomAlnum(6)}`;
    const existing = await prisma.profile.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique referral code");
}
