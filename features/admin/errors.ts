export function errorMessage(
  error: unknown,
  fallback = 'No pudimos completar la operación. Inténtalo de nuevo.',
) {
  return error instanceof Error ? error.message : fallback
}
