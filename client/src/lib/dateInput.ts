/** Matches the display format MM/DD/YYYY used in date input fields. */
export const DATE_DISPLAY_RE = /^\d{2}\/\d{2}\/\d{4}$/;

/** Converts stored YYYY-MM-DD to display MM/DD/YYYY. Returns empty string for non-full dates. */
export const storedToDisplay = (stored: string): string => {
  const parts = stored.split('-');
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return '';
};

/** Converts display MM/DD/YYYY back to stored YYYY-MM-DD. */
export const displayToStored = (display: string): string => {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : '';
};

/** Auto-slash mask for date input: inserts slashes after MM and DD as digits are typed. */
export const applyDateMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

/**
 * Parses a YYYY-MM-DD string as local midnight, avoiding the UTC-to-local shift that
 * `new Date('YYYY-MM-DD')` applies (which shows the previous day in timezones behind UTC).
 */
export const parseDateLocal = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};
