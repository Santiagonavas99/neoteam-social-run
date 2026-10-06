export type ThemeChoice = 'light' | 'dark' | 'system'
export type Theme = 'light' | 'dark'

export const THEME_KEY = 'neoteam_theme'
// The admin stored its choice here before the theme covered the whole site.
export const LEGACY_THEME_KEY = 'neoteam_admin_theme'

export function parseThemeChoice(value: unknown): ThemeChoice {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): Theme {
  return choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice
}

// Runs in <head> before paint, so a stored dark choice never flashes light.
export const themeScript = `(function(){try{var s=localStorage,c=s.getItem('${THEME_KEY}')||s.getItem('${LEGACY_THEME_KEY}');var d=c==='dark'||(c!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light')}catch(e){}})()`
