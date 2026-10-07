const OTHER_ENGINES = /Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Android/i

export const isIOSPlatform = (userAgent: string) => /iPhone|iPad|iPod/i.test(userAgent)

export const isAndroidPlatform = (userAgent: string) => /Android/i.test(userAgent)

// iPadOS in desktop mode reports itself as Mac Safari, so the Safari rule covers it too.
export const isApplePlatform = (userAgent: string) =>
  isIOSPlatform(userAgent) || (/Safari/i.test(userAgent) && !OTHER_ENGINES.test(userAgent))
