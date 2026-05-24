import { z } from 'zod';
import { bookRefSchema } from '@livre/types';

const STORAGE_KEY = 'livre:recent-books';
const MAX_RECENT = 5;

const recentBookSchema = z.object({
  bookRef: bookRefSchema,
  title: z.string(),
  authors: z.array(z.string()),
  thumbnail: z.string().optional(),
});

export type RecentBook = z.infer<typeof recentBookSchema>;

const recentBooksSchema = z.array(recentBookSchema);

export const getRecentBooks = (): RecentBook[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return recentBooksSchema.parse(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const pushRecentBook = (book: RecentBook): void => {
  const current = getRecentBooks();
  const updated = [book, ...current.filter((b) => b.bookRef !== book.bookRef)].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
