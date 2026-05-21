import { useState } from 'react';
import { BookCard } from '@livre/primitives';
import Nav from '../../components/Nav/Nav';
import AppHeader from '../../components/AppHeader/AppHeader';
import CurrentlyReadingCard from '../../components/CurrentlyReadingCard/CurrentlyReadingCard';
import ShelfTabs, { type ShelfStatus } from '../../components/ShelfTabs/ShelfTabs';
import { Page, Content, BookGrid } from './Library.styles';

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
  {
    id: 1,
    title: 'The Sun Also Rises',
    author: 'Hemingway',
    coverColor: '#3730A3',
    rating: 4,
    pageCount: 251,
  },
  {
    id: 2,
    title: 'Infinite Jest',
    author: 'D.F. Wallace',
    coverColor: '#14532D',
    rating: 4,
    pageCount: 1079,
  },
  {
    id: 3,
    title: 'Post Office',
    author: 'Bukowski',
    coverColor: '#7F1D1D',
    rating: 4,
    pageCount: 320,
  },
  { id: 4, title: '1984', author: 'Orwell', coverColor: '#365314', rating: 5, pageCount: 328 },
  {
    id: 5,
    title: 'The Catcher in the Rye',
    author: 'Salinger',
    coverColor: '#1E3A5F',
    rating: 5,
    pageCount: 277,
  },
  {
    id: 6,
    title: 'The Myth of Sisyphus',
    author: 'Camus',
    coverColor: '#2A2A2A',
    rating: 4,
    pageCount: 212,
  },
];

interface LibraryProps {
  onToggleTheme?: () => void;
}

const Library = ({ onToggleTheme }: LibraryProps) => {
  const [activeShelf, setActiveShelf] = useState<ShelfStatus>('read');

  return (
    <Page>
      <Nav active="library" onNavigate={() => {}} />
      <AppHeader onToggleTheme={onToggleTheme} />
      <Content>
        <CurrentlyReadingCard {...CURRENTLY_READING} />
        <ShelfTabs active={activeShelf} counts={SHELF_COUNTS} onChange={setActiveShelf} />
        <BookGrid>
          {BOOKS.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </BookGrid>
      </Content>
    </Page>
  );
};

export default Library;
