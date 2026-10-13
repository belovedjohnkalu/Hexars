const paths: Record<string, string> = {
  board: "M12 3 20 7.5v9L12 21l-8-4.5v-9Z M12 3v18 M4 7.5l16 9 M20 7.5l-16 9",
  engine: "M8 8h8v8H8Z M9 3v5 M15 3v5 M9 16v5 M15 16v5 M3 9h5 M3 15h5 M16 9h5 M16 15h5",
  roadmap: "M8 5h13 M8 12h13 M8 19h13 M3 5h1 M3 12h1 M3 19h1",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  flip: "M4 9a8 8 0 0 1 14-3l2 2 M20 3v5h-5 M20 15a8 8 0 0 1-14 3l-2-2 M4 21v-5h5",
  grid: "M9 3v18 M15 3v18 M3 9h18 M3 15h18",
  check: "M5 12l4 4L19 6",
  terminal: "M4 5h16v14H4Z M7 9l3 3-3 3 M13 15h4",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
  copy: "M9 9h11v12H9Z M15 9V3H3v12h6",
  reset: "M3 11a9 9 0 1 1 3 7 M3 4v7h7",
  info: "M12 8h.01 M12 11v6 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.board} />
    </svg>
  );
}
