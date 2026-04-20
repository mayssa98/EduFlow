const buildIcon = (body: string, size = 20) => `
  <svg
    width="${size}"
    height="${size}"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    stroke-width="1.85"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${body}
  </svg>
`.trim();

export const APP_ICONS = {
  home: buildIcon(`
    <path d="M7.25 10.25 12 6.5l4.75 3.75V19h-9.5v-8.75Z" fill="currentColor" opacity="0.14" stroke="none"/>
    <path d="M4.75 10.5 12 4.75l7.25 5.75"/>
    <path d="M7.25 9.75V19h9.5V9.75"/>
    <path d="M10 19v-4.25h4V19"/>
  `),
  users: buildIcon(`
    <path d="M6.5 18.5c0-2.35 2.12-4.25 4.75-4.25S16 16.15 16 18.5" fill="currentColor" opacity="0.12" stroke="none"/>
    <circle cx="11.25" cy="8.25" r="3.25"/>
    <path d="M4.5 18.5c0-2.54 2.74-4.6 6.12-4.6s6.13 2.06 6.13 4.6"/>
    <path d="M16.75 7.25a2.5 2.5 0 1 1 0 5"/>
    <path d="M18.25 18c.9-.24 1.66-.69 2.19-1.31.52-.62.81-1.35.81-2.19 0-1.72-1.21-3.22-3-3.85"/>
  `),
  book: buildIcon(`
    <path d="M4.5 5.5h6.75c1.8 0 3.25 1.45 3.25 3.25V19c-.77-.61-1.74-.92-2.75-.92H4.5Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M4.5 5.5h6.75c1.8 0 3.25 1.45 3.25 3.25V19c-.77-.61-1.74-.92-2.75-.92H4.5Z"/>
    <path d="M19.5 5.5h-6.75c-1.8 0-3.25 1.45-3.25 3.25V19c.77-.61 1.74-.92 2.75-.92h7.25Z"/>
    <path d="M7.25 9h4.5"/>
  `),
  layers: buildIcon(`
    <path d="m12 5.25 7 3.75-7 3.75-7-3.75 7-3.75Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="m12 5.25 7 3.75-7 3.75-7-3.75 7-3.75Z"/>
    <path d="m5 12.5 7 3.75 7-3.75"/>
    <path d="m5 16 7 3.75 7-3.75"/>
  `),
  folderOpen: buildIcon(`
    <path d="M4.75 8.25h5.1l1.4 1.75h7.5l-1.4 8H5.9c-.8 0-1.4-.65-1.4-1.45V8.25Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M4.75 8.25h5.1l1.4 1.75h7.5l-1.4 8H5.9c-.8 0-1.4-.65-1.4-1.45V8.25Z"/>
    <path d="M5 7h4.4l1.35 1.5H19"/>
  `),
  chart: buildIcon(`
    <path d="M5.5 18.5h13" />
    <path d="M8 18.5v-5.75" />
    <path d="M12 18.5V8.25" />
    <path d="M16 18.5V5.5" />
    <path d="M7.15 12.75H8.85" />
    <path d="M11.15 8.25h1.7" />
    <path d="M15.15 5.5h1.7" />
  `),
  sparkles: buildIcon(`
    <path d="M12 3.5 13.95 8l4.55 1.95-4.55 1.95L12 16.4l-1.95-4.5L5.5 9.95 10.05 8 12 3.5Z" fill="currentColor" opacity="0.14" stroke="none"/>
    <path d="M12 3.5 13.95 8l4.55 1.95-4.55 1.95L12 16.4l-1.95-4.5L5.5 9.95 10.05 8 12 3.5Z"/>
    <path d="m18 16.5.75 1.75L20.5 19l-1.75.75L18 21.5l-.75-1.75L15.5 19l1.75-.75L18 16.5Z"/>
    <path d="m6 15 .9 2.1L9 18l-2.1.9L6 21l-.9-2.1L3 18l2.1-.9L6 15Z"/>
  `),
  logout: buildIcon(`
    <path d="M10 5.5H6.75A2.25 2.25 0 0 0 4.5 7.75v8.5a2.25 2.25 0 0 0 2.25 2.25H10"/>
    <path d="M13.5 8.25 18 12l-4.5 3.75"/>
    <path d="M17.75 12H9"/>
  `),
  document: buildIcon(`
    <path d="M7 4.5h6.75L18 8.75V19.5H7Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M7 4.5h6.75L18 8.75V19.5H7Z"/>
    <path d="M13.75 4.5V8.75H18"/>
    <path d="M9.5 12.25h6"/>
    <path d="M9.5 15.5h5"/>
  `),
  profile: buildIcon(`
    <path d="M7.25 19c.43-2.63 2.59-4.5 5.25-4.5s4.82 1.87 5.25 4.5" fill="currentColor" opacity="0.12" stroke="none"/>
    <circle cx="12.5" cy="8.25" r="3.5"/>
    <path d="M5.75 19c.5-3.3 3.18-5.5 6.75-5.5 3.56 0 6.24 2.2 6.75 5.5"/>
  `),
  settings: buildIcon(`
    <path d="M10.7 4.2h2.6l.55 2.1a6.6 6.6 0 0 1 1.65.95l2.02-.82 1.3 2.24-1.5 1.5c.15.49.23 1 .23 1.53s-.08 1.04-.23 1.53l1.5 1.5-1.3 2.24-2.02-.82a6.6 6.6 0 0 1-1.65.95l-.55 2.1h-2.6l-.55-2.1a6.6 6.6 0 0 1-1.65-.95l-2.02.82-1.3-2.24 1.5-1.5A5.2 5.2 0 0 1 7.1 12c0-.53.08-1.04.23-1.53l-1.5-1.5 1.3-2.24 2.02.82c.5-.4 1.05-.72 1.65-.95l.55-2.1Z" fill="currentColor" opacity="0.1" stroke="none"/>
    <path d="M10.7 4.2h2.6l.55 2.1a6.6 6.6 0 0 1 1.65.95l2.02-.82 1.3 2.24-1.5 1.5c.15.49.23 1 .23 1.53s-.08 1.04-.23 1.53l1.5 1.5-1.3 2.24-2.02-.82a6.6 6.6 0 0 1-1.65.95l-.55 2.1h-2.6l-.55-2.1a6.6 6.6 0 0 1-1.65-.95l-2.02.82-1.3-2.24 1.5-1.5A5.2 5.2 0 0 1 7.1 12c0-.53.08-1.04.23-1.53l-1.5-1.5 1.3-2.24 2.02.82c.5-.4 1.05-.72 1.65-.95l.55-2.1Z"/>
    <circle cx="12" cy="12" r="2.65"/>
  `),
  approval: buildIcon(`
    <path d="M12 4.25 18.25 6.5v4.2c0 3.83-2.36 7.3-6.25 8.55-3.89-1.25-6.25-4.72-6.25-8.55V6.5L12 4.25Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M12 4.25 18.25 6.5v4.2c0 3.83-2.36 7.3-6.25 8.55-3.89-1.25-6.25-4.72-6.25-8.55V6.5L12 4.25Z"/>
    <path d="m9.35 11.9 1.75 1.75 3.55-3.8"/>
  `),
  mail: buildIcon(`
    <rect x="4.5" y="6.25" width="15" height="11.5" rx="2.25" fill="currentColor" opacity="0.1" stroke="none"/>
    <rect x="4.5" y="6.25" width="15" height="11.5" rx="2.25"/>
    <path d="m5.5 7.5 6.5 5 6.5-5"/>
    <path d="M9 14.75h6"/>
  `),
  arrowLeft: buildIcon(`
    <path d="m10.25 7.25-4.75 4.75 4.75 4.75"/>
    <path d="M6 12h12"/>
  `),
  shield: buildIcon(`
    <path d="M12 4.25 18.25 6.5v4.2c0 3.83-2.36 7.3-6.25 8.55-3.89-1.25-6.25-4.72-6.25-8.55V6.5L12 4.25Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M12 4.25 18.25 6.5v4.2c0 3.83-2.36 7.3-6.25 8.55-3.89-1.25-6.25-4.72-6.25-8.55V6.5L12 4.25Z"/>
  `),
  shieldLock: buildIcon(`
    <path d="M12 4.25 18.25 6.5v4.2c0 3.83-2.36 7.3-6.25 8.55-3.89-1.25-6.25-4.72-6.25-8.55V6.5L12 4.25Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M12 4.25 18.25 6.5v4.2c0 3.83-2.36 7.3-6.25 8.55-3.89-1.25-6.25-4.72-6.25-8.55V6.5L12 4.25Z"/>
    <rect x="9.35" y="10.8" width="5.3" height="4.45" rx="1.15"/>
    <path d="M10.45 10.8V9.6a1.55 1.55 0 0 1 3.1 0v1.2"/>
  `),
  key: buildIcon(`
    <circle cx="8.25" cy="12.25" r="2.75"/>
    <path d="M10.8 12.25h7.7"/>
    <path d="M15.25 12.25v2.25"/>
    <path d="M17.75 12.25v1.5"/>
  `),
  checkBadge: buildIcon(`
    <path d="M12 4.5 14.2 6l2.65-.25.8 2.55 2.25 1.35-1.02 2.46 1.02 2.46-2.25 1.35-.8 2.55-2.65-.25L12 19.5l-2.2-1.5-2.65.25-.8-2.55L4.1 14.35l1.02-2.46L4.1 9.43l2.25-1.35.8-2.55L9.8 6 12 4.5Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M12 4.5 14.2 6l2.65-.25.8 2.55 2.25 1.35-1.02 2.46 1.02 2.46-2.25 1.35-.8 2.55-2.65-.25L12 19.5l-2.2-1.5-2.65.25-.8-2.55L4.1 14.35l1.02-2.46L4.1 9.43l2.25-1.35.8-2.55L9.8 6 12 4.5Z"/>
    <path d="m9.2 12.15 1.95 1.95 3.65-4.1"/>
  `),
  graduation: buildIcon(`
    <path d="m4.5 9.25 7.5-3.5 7.5 3.5-7.5 3.5-7.5-3.5Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="m4.5 9.25 7.5-3.5 7.5 3.5-7.5 3.5-7.5-3.5Z"/>
    <path d="M7.5 12.25v3.25c0 1.66 2 3 4.5 3s4.5-1.34 4.5-3v-3.25"/>
    <path d="M19.5 10.25v4.25"/>
  `),
  rocket: buildIcon(`
    <path d="M13.35 5.25c2.2.15 4.25 1.85 5.45 4.55-1.2 3.55-4.2 6.55-7.75 7.75-2.7-1.2-4.4-3.25-4.55-5.45 1.05-3.57 3.28-5.8 6.85-6.85Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M13.35 5.25c2.2.15 4.25 1.85 5.45 4.55-1.2 3.55-4.2 6.55-7.75 7.75-2.7-1.2-4.4-3.25-4.55-5.45 1.05-3.57 3.28-5.8 6.85-6.85Z"/>
    <circle cx="14.15" cy="9.85" r="1.2"/>
    <path d="M8.2 14.8 5.5 18.5l3.9-1.2"/>
    <path d="M9.2 9.35 5.5 12.05l1.2-3.9"/>
  `),
  clock: buildIcon(`
    <circle cx="12" cy="12" r="7.5"/>
    <path d="M12 8v4.3l2.8 1.7"/>
  `),
  calendarCheck: buildIcon(`
    <rect x="4.75" y="6.25" width="14.5" height="12.75" rx="2.25" fill="currentColor" opacity="0.12" stroke="none"/>
    <rect x="4.75" y="6.25" width="14.5" height="12.75" rx="2.25"/>
    <path d="M8.25 4.75v3"/>
    <path d="M15.75 4.75v3"/>
    <path d="M4.75 10h14.5"/>
    <path d="m9.3 14.15 1.75 1.75 3.65-4.15"/>
  `),
  edit: buildIcon(`
    <path d="M5.5 18.5h4.25L18.4 9.85a1.85 1.85 0 0 0 0-2.6l-1.65-1.65a1.85 1.85 0 0 0-2.6 0L5.5 14.25V18.5Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M5.5 18.5h4.25L18.4 9.85a1.85 1.85 0 0 0 0-2.6l-1.65-1.65a1.85 1.85 0 0 0-2.6 0L5.5 14.25V18.5Z"/>
    <path d="m12.9 6.85 4.25 4.25"/>
  `),
  lock: buildIcon(`
    <rect x="6.75" y="10.25" width="10.5" height="8" rx="2" fill="currentColor" opacity="0.12" stroke="none"/>
    <rect x="6.75" y="10.25" width="10.5" height="8" rx="2"/>
    <path d="M9 10.25V8.6a3 3 0 0 1 6 0v1.65"/>
  `),
  palette: buildIcon(`
    <path d="M12 4.5c-4.14 0-7.5 3.1-7.5 6.92 0 1.94 1.37 3.08 3.08 3.08H9.5c1.1 0 2 .9 2 2 0 1.66 1.34 3 3 3 3.31 0 6-3.13 6-7 0-4.43-3.81-8-8.5-8Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M12 4.5c-4.14 0-7.5 3.1-7.5 6.92 0 1.94 1.37 3.08 3.08 3.08H9.5c1.1 0 2 .9 2 2 0 1.66 1.34 3 3 3 3.31 0 6-3.13 6-7 0-4.43-3.81-8-8.5-8Z"/>
    <circle cx="8.25" cy="10.25" r="1"/>
    <circle cx="11.75" cy="8.5" r="1"/>
    <circle cx="15.5" cy="9.5" r="1"/>
  `),
  info: buildIcon(`
    <circle cx="12" cy="12" r="7.5"/>
    <path d="M12 10.3v4.2"/>
    <path d="M12 7.9h.01"/>
  `),
  clipboard: buildIcon(`
    <path d="M8 6.25h8.25V19.5H8Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M10 4.5h4a1.5 1.5 0 0 1 1.5 1.5V7H8.5V6A1.5 1.5 0 0 1 10 4.5Z"/>
    <path d="M8 7h8.25V19.5H8Z"/>
    <path d="M10 10.25h4.5"/>
    <path d="M10 13.5h4.5"/>
    <path d="M10 16.75h3"/>
  `),
  award: buildIcon(`
    <circle cx="12" cy="9" r="4.25" fill="currentColor" opacity="0.12" stroke="none"/>
    <circle cx="12" cy="9" r="4.25"/>
    <path d="M9.5 13.4v5.1l2.5-1.65 2.5 1.65v-5.1"/>
    <path d="m10.55 9 1.05 1.05 1.85-2.1"/>
  `),
  activity: buildIcon(`
    <path d="M4.5 15.25h3.1l1.8-5 3.1 7 2.1-4h4.9"/>
    <path d="M4.5 18.5h15"/>
    <path d="M4.5 5.5h15" opacity="0.2"/>
  `),
  target: buildIcon(`
    <circle cx="12" cy="12" r="7.5"/>
    <circle cx="12" cy="12" r="4.5"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <path d="M12 4.5v2.25"/>
    <path d="M12 17.25v2.25"/>
    <path d="M19.5 12h-2.25"/>
    <path d="M6.75 12H4.5"/>
  `),
  checkCircle: buildIcon(`
    <circle cx="12" cy="12" r="7.5" fill="currentColor" opacity="0.12" stroke="none"/>
    <circle cx="12" cy="12" r="7.5"/>
    <path d="m8.9 12.2 2.1 2.1 4.3-4.7"/>
  `),
  alert: buildIcon(`
    <path d="M12 5.25 19 18.5H5L12 5.25Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M12 5.25 19 18.5H5L12 5.25Z"/>
    <path d="M12 9.2v4.2"/>
    <path d="M12 16.2h.01"/>
  `),
  globe: buildIcon(`
    <circle cx="12" cy="12" r="7.5"/>
    <path d="M4.75 12h14.5"/>
    <path d="M12 4.5a12.5 12.5 0 0 1 2.9 7.5A12.5 12.5 0 0 1 12 19.5 12.5 12.5 0 0 1 9.1 12 12.5 12.5 0 0 1 12 4.5Z"/>
  `),
  mailSpark: buildIcon(`
    <rect x="4.5" y="7" width="15" height="10.75" rx="2.25" fill="currentColor" opacity="0.1" stroke="none"/>
    <rect x="4.5" y="7" width="15" height="10.75" rx="2.25"/>
    <path d="m5.5 8.25 6.5 5 6.5-5"/>
    <path d="m17.75 4.5.55 1.3 1.2.55-1.2.55-.55 1.3-.55-1.3-1.2-.55 1.2-.55.55-1.3Z"/>
  `),
  message: buildIcon(`
    <path d="M6.5 7.25h11a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H11l-3.5 2v-2H6.5a2 2 0 0 1-2-2v-5.5a2 2 0 0 1 2-2Z" fill="currentColor" opacity="0.12" stroke="none"/>
    <path d="M6.5 7.25h11a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H11l-3.5 2v-2H6.5a2 2 0 0 1-2-2v-5.5a2 2 0 0 1 2-2Z"/>
    <path d="M8.5 11.25h7"/>
    <path d="M8.5 14h4.5"/>
  `),
  playCircle: buildIcon(`
    <circle cx="12" cy="12" r="7.5" fill="currentColor" opacity="0.12" stroke="none"/>
    <circle cx="12" cy="12" r="7.5"/>
    <path d="m10.35 9.35 4.25 2.65-4.25 2.65V9.35Z" fill="currentColor" stroke="none"/>
  `),
} as const;

export type AppIconName = keyof typeof APP_ICONS;
