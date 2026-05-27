/** Escapes &, <, > so arbitrary text can be set via innerHTML without XSS risk. */
export const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
