/** Unwrap a thrown value into a display string, falling back when it isn't an Error. */
export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;
