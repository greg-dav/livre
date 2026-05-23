import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { BookCard, BookGrid, Loader, Text } from '@livre/primitives';
import { Layout, CurrentlyReadingCard, ShelfTabs, type ShelfStatus } from '../../components';
import { api } from '../../lib/api';
import {
  Split,
  LeftPanel,
  LeftPanelHeader,
  LeftPanelDivider,
  RightPanel,
  ShelfHeading,
  ShelfHeadingLeft,
} from './Library.styles';

const SHELF_LABELS: Record<ShelfStatus, string> = {
  read: 'Read',
  want: 'Want to Read',
  dnf: 'Did Not Finish',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * Main authenticated screen. Split layout: sticky left panel for currently-reading books, right
 * panel for the shelf browser. Shelf data is live from the API — tab counts stay in sync because
 * every shelf response includes counts for all statuses.
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
    placeholderData: keepPreviousData,
  });

  const readingEntries = readingData?.entries ?? [];
  const tabCounts = data
    ? { read: data.counts.read, want: data.counts.want, dnf: data.counts.dnf }
    : { read: 0, want: 0, dnf: 0 };
  const entryCount = data?.entries.length ?? 0;

  return (
    <Layout fullWidth>
      <Split>
        <LeftPanel>
          <LeftPanelHeader>
            <Text variant="label" color="accent">
              Currently Reading
            </Text>
            <LeftPanelDivider />
          </LeftPanelHeader>
          {readingEntries.map((entry) => (
            <CurrentlyReadingCard
              key={entry.userBookId}
              title={entry.title}
              author={entry.authors.join(', ')}
              coverUrl={entry.coverUrl ?? undefined}
              startedDate={formatDate(entry.addedDate)}
              onClick={
                entry.googleId
                  ? () => navigate(`/book/${entry.googleId}`, { state: { from: 'library' } })
                  : undefined
              }
            />
          ))}
        </LeftPanel>
        <RightPanel>
          <ShelfTabs active={activeShelf} counts={tabCounts} onChange={setActiveShelf} />
          <ShelfHeading>
            <ShelfHeadingLeft>
              <Text variant="h3" as="h2">
                {SHELF_LABELS[activeShelf]}
              </Text>
              <Text variant="label" color="muted">
                {entryCount} {entryCount === 1 ? 'book' : 'books'}
              </Text>
            </ShelfHeadingLeft>
          </ShelfHeading>
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
                  onClick={
                    entry.googleId
                      ? () => navigate(`/book/${entry.googleId}`, { state: { from: 'library' } })
                      : undefined
                  }
                />
              ))}
            </BookGrid>
          )}
        </RightPanel>
      </Split>
    </Layout>
  );
};
