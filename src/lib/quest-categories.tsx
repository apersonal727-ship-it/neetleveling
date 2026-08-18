export const CATEGORIES = [
  {
    subject: "PHYSICS" as const,
    name: "Physics",
    color: "#8fd6ff",
    icon: (
      <>
        <circle cx="12" cy="12" r="2.5" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
      </>
    ),
  },
  {
    subject: "CHEMISTRY" as const,
    name: "Chemistry",
    color: "#ffb84f",
    icon: <path d="M9 3h6M10 3v6l-5 9a1.6 1.6 0 0 0 1.4 2.4h11.2A1.6 1.6 0 0 0 19 18l-5-9V3" />,
  },
  {
    subject: "BIOLOGY" as const,
    name: "Biology",
    color: "#3ddc84",
    icon: <path d="M12 21S4 14.5 4 8.8A4.8 4.8 0 0 1 12 5a4.8 4.8 0 0 1 8 3.8C20 14.5 12 21 12 21Z" />,
  },
  {
    subject: "DISCIPLINE" as const,
    name: "Discipline",
    color: "#8fd6ff",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
  },
];
