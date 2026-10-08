// Falls back to the real custom domain rather than a Vercel preview URL, so
// metadata/email links are correct even if NEXT_PUBLIC_SITE_URL isn't set.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://neetleveling.in").replace(
  /\/$/,
  "",
);

// Optional public fallback contact, shown on the report page only if sending
// fails. Unset by default so no address is published unless you choose one:
// set NEXT_PUBLIC_SUPPORT_EMAIL in .env / Vercel to turn it on.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? null;
