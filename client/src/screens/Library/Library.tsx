import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookCard, BookGrid, Loader } from '@livre/primitives';
import { Layout, CurrentlyReadingCard, ShelfTabs, type ShelfStatus } from '../../components';
import { api } from '../../lib/api';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

/**
 * Main authenticated screen. Shows the currently reading card, shelf filter tabs, and the book
 * grid. Shelf data is live from the API — tab counts stay in sync because every shelf response
 * includes counts for all statuses.
 */
export const Library = () => {
  const navigate = useNavigate();
  const [activeShelf, setActiveShelf] = useState<ShelfStatus>('read');

  const { data: readingData } = useQuery({
    queryKey: ['shelves', 'reading'],
    queryFn: () => api.shelves.getByStatus('reading'),
  });

  const { data } = useQuery({
    queryKey: ['shelves', activeShelf],
    queryFn: () => api.shelves.getByStatus(activeShelf),
  });

  const readingEntries = readingData?.entries ?? [];
  const tabCounts = data
    ? { read: data.counts.read, want: data.counts.want, dnf: data.counts.dnf }
    : { read: 0, want: 0, dnf: 0 };

  return (
    <Layout>
      {readingEntries.map((entry) => (
        <CurrentlyReadingCard
          key={entry.userBookId}
          title={entry.title}
          author={entry.authors.join(', ')}
          coverUrl={entry.coverUrl ?? undefined}
          startedDate={formatDate(entry.addedDate)}
          onClick={entry.googleId ? () => navigate(`/book/${entry.googleId}`) : undefined}
        />
      ))}
      <ShelfTabs active={activeShelf} counts={tabCounts} onChange={setActiveShelf} />
      {!data ? (
        <Loader />
      ) : (
        <BookGrid>
          {data.entries.map((entry) => (
            <BookCard
              key={entry.userBookId}
              title={entry.title}
              author={entry.authors.join(', ')}
              coverUrl={entry.coverUrl ?? undefined}
              rating={entry.rating ?? undefined}
              onClick={entry.googleId ? () => navigate(`/book/${entry.googleId}`) : undefined}
            />
          ))}
        </BookGrid>
      )}
    </Layout>
  );
};
