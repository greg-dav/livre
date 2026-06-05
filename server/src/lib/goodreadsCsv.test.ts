import { describe, it, expect } from 'vitest';
import { toGoodreadsCsv, type ExportBook } from './goodreadsCsv';

const book = (overrides: Partial<ExportBook> = {}): ExportBook => ({
  id: 1,
  title: 'Blood Meridian',
  authors: ['Cormac McCarthy'],
  isbn: '9780679728757',
  rating: 5,
  publisher: 'Vintage',
  pageCount: 351,
  publishedDate: '1985',
  addedDate: '2026-01-02',
  tags: [],
  review: null,
  status: 'read',
  dateRead: '2026-02-01',
  readCount: 1,
  ...overrides,
});

// The data row is the line after the header.
const rowOf = (b: ExportBook): string => toGoodreadsCsv([b]).split('\r\n')[1];

describe('toGoodreadsCsv formula-injection defusing', () => {
  it.each(['=', '+', '-', '@', '\t', '\r'])(
    'prefixes a quote when a user-text cell starts with %j',
    (lead) => {
      const row = rowOf(book({ title: `${lead}HYPERLINK("http://evil")` }));
      // The cell is CSV-quoted because of the inner quotes, so the defusing quote sits just inside.
      expect(row).toContain(`"'${lead}HYPERLINK`);
    }
  );

  it('defuses tags surfaced through the Bookshelves columns', () => {
    const row = rowOf(book({ status: 'read', tags: ['=cmd|calc'] }));
    expect(row).toContain(`'=cmd|calc`);
  });

  it('leaves the forced-text ISBN cells intact (CSV-quoted, never defused)', () => {
    // escapeCell wraps the ="..." cell because of its inner quotes, but no defusing ' is added.
    const row = rowOf(book({ isbn: '9780679728757' }));
    expect(row).toContain('=""9780679728757""');
    expect(row).not.toContain(`'=`);
  });

  it('leaves a benign title untouched', () => {
    expect(rowOf(book({ title: 'Blood Meridian' }))).toContain(',Blood Meridian,');
  });
});
