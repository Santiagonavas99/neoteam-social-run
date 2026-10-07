const OTHER_ENGINES = /Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Android/i

// iPadOS in desktop mode reports itself as Mac Safari, so the Safari rule covers it too.
export const isApplePlatform = (userAgent: string) =>
  /iPhone|iPad|iPod/i.test(userAgent) ||
  (/Safari/i.test(userAgent) && !OTHER_ENGINES.test(userAgent))
