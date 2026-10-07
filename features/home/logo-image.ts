// Must match images.remotePatterns in next.config.ts: only this project's public
// Storage goes through the optimizer; any other logo URL is served as is.
const STORAGE_PREFIX = 'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/'

export const isOptimizable = (url: string) => url.startsWith(STORAGE_PREFIX)
