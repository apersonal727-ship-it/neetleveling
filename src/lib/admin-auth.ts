import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "admin_session";
const SESSION_DAYS = 30;

function secret(): string {
  const value = process.env.ADMIN_PASSWORD;
  if (!value) throw new Error("ADMIN_PASSWORD is not configured.");
  return value;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkAdminPassword(candidate: string): boolean {
  return safeEqual(candidate, secret());
}

export function createAdminSessionToken(): string {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (!Number.isFinite(Number(payload)) || Number(payload) < Date.now()) return false;
  return safeEqual(sig, sign(payload));
}

// A dedicated, password-based admin session — entirely independent of
// Supabase Auth and the hunter Profile system, so admin access is never
// coupled to a hunter's lockout/subscription state. There is exactly one
// admin, gated by ADMIN_PASSWORD, so no per-user identity is tracked here.
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidToken(store.get(COOKIE_NAME)?.value);
}

export async function requireAdminSession(): Promise<void> {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

export async function setAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// Quest/QuestTemplate rows still need a createdById FK. This is a plain data
// lookup for the single admin Profile row — not an auth check, and it never
// touches the hunter lockout/subscription pipeline.
export async function getAdminProfileId(): Promise<string> {
  const admin = await prisma.profile.findFirstOrThrow({ where: { isAdmin: true }, select: { id: true } });
  return admin.id;
}
