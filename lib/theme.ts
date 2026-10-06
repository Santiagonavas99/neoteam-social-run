export type ThemeChoice = 'light' | 'dark' | 'system'
export type Theme = 'light' | 'dark'

export const THEME_KEY = 'neoteam_admin_theme'

export function parseThemeChoice(value: unknown): ThemeChoice {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): Theme {
  return choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice
}

// Runs before paint inside the themed element, so a stored dark choice never flashes light.
export const themeScript = `(function(){try{var c=localStorage.getItem('${THEME_KEY}');var d=c==='dark'||(c!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.currentScript.parentElement.setAttribute('data-theme',d?'dark':'light')}catch(e){}})()`
