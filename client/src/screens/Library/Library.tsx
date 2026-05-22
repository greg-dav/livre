import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCard, BookGrid } from '@livre/primitives';
import { Layout, CurrentlyReadingCard, ShelfTabs, type ShelfStatus } from '../../components';

const CURRENTLY_READING = {
  title: 'Blood Meridian',
  author: 'Cormac McCarthy',
  coverColor: '#1C1C1C',
  progress: 42,
  startedDate: 'March 12',
};

const SHELF_COUNTS: Record<ShelfStatus, number> = {
  read: 24,
  want: 41,
  dnf: 3,
};

const BOOKS = [
  { id: 1, title: 'The Sun Also Rises', author: 'Hemingway', coverColor: '#3730A3', rating: 4 },
  { id: 2, title: 'Infinite Jest', author: 'D.F. Wallace', coverColor: '#14532D', rating: 4 },
  { id: 3, title: 'Post Office', author: 'Bukowski', coverColor: '#7F1D1D', rating: 4 },
  { id: 4, title: '1984', author: 'Orwell', coverColor: '#365314', rating: 5 },
  { id: 5, title: 'The Catcher in the Rye', author: 'Salinger', coverColor: '#1E3A5F', rating: 5 },
  { id: 6, title: 'The Myth of Sisyphus', author: 'Camus', coverColor: '#2A2A2A', rating: 4 },
];

/**
 * Main authenticated screen. Shows the currently reading card, shelf filter tabs, and the book
 * grid. All data here is static placeholder — will be replaced with real shelf queries.
 */
export const Library = () => {
  const navigate = useNavigate();
  const [activeShelf, setActiveShelf] = useState<ShelfStatus>('read');

  return (
    <Layout>
      <CurrentlyReadingCard {...CURRENTLY_READING} />
      <ShelfTabs active={activeShelf} counts={SHELF_COUNTS} onChange={setActiveShelf} />
      <BookGrid>
        {BOOKS.map((book) => (
          <BookCard key={book.id} {...book} onClick={() => navigate(`/book/${book.id}`)} />
        ))}
      </BookGrid>
    </Layout>
  );
};
