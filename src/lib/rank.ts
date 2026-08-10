export type RankCode = "E" | "D" | "C" | "B" | "A" | "S";

export const RANKS: {
  code: RankCode;
  title: string;
  color: string;
  minLevel: number;
}[] = [
  { code: "E", title: "World's Weakest NEET Hunter", color: "#5d708f", minLevel: 0 },
  { code: "D", title: "Wolf Slayer", color: "#4f9dff", minLevel: 20 },
  { code: "C", title: "Demon Slayer", color: "#5fb2ff", minLevel: 40 },
  { code: "B", title: "Necromancer", color: "#7cc7ff", minLevel: 60 },
  { code: "A", title: "Shadow Lord", color: "#a7dcff", minLevel: 80 },
  { code: "S", title: "Shadow Monarch", color: "#ffffff", minLevel: 100 },
];

// XP cost to go from level N to N+1, by which band level N falls in.
// Bands E–B each span 20 level-ups at a flat per-level cost (matches the
// blueprint's per-band XP table). The A band covers levels 80→99 (19
// level-ups at 400 XP), and level 99→100 is priced separately as the
// "S final push" (2,000 XP) per the blueprint's explicit note that S is a
// single-level milestone, not a 20-level band like the others.
function xpCostForLevel(level: number): number {
  if (level < 20) return 100; // E
  if (level < 40) return 150; // D
  if (level < 60) return 220; // C
  if (level < 80) return 300; // B
  if (level < 99) return 400; // A
  return 2000; // 99 -> 100, the S final push
}

export function rankForLevel(level: number): (typeof RANKS)[number] {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.minLevel) current = rank;
  }
  return current;
}

// Inverse of getLevelProgress: the minimum total XP needed to have reached
// exactly `level` (used by the admin panel's XP/level override, since XP is
// the only value actually stored — "level" is always derived from it).
export function cumulativeXpForLevel(level: number): number {
  let xp = 0;
  for (let l = 0; l < Math.min(level, 100); l++) xp += xpCostForLevel(l);
  return xp;
}

export function getLevelProgress(totalXp: number) {
  let level = 0;
  let remaining = totalXp;

  while (level < 100) {
    const cost = xpCostForLevel(level);
    if (remaining < cost) break;
    remaining -= cost;
    level += 1;
  }

  const xpForLevel = level < 100 ? xpCostForLevel(level) : 0;
  const rank = rankForLevel(level);

  return {
    level,
    rank: rank.code,
    rankTitle: rank.title,
    rankColor: rank.color,
    xpInLevel: level < 100 ? remaining : 0,
    xpForLevel,
    totalXp,
  };
}
