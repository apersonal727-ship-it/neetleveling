// Falls back to the real custom domain rather than a Vercel preview URL, so
// metadata/email links are correct even if NEXT_PUBLIC_SITE_URL isn't set.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://neetleveling.in").replace(
  /\/$/,
  "",
);
