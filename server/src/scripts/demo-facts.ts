import { type ShelfStatus } from '@livre/types';

/**
 * Hand-authored facts for the demo library — the half a metadata source can't supply: which shelf a
 * book sits on, the reader's rating and review, custom tags, and a full reading-log timeline with
 * explicit start/finish dates (so the Timeline draws real cycles). `buildDemoFixture.ts` resolves
 * each title against a real book source for cover + description + genre, then merges these facts on
 * top, keyed by title. `authors` overrides whatever the source returns so attribution stays clean;
 * `query` overrides the default `intitle/inauthor` lookup when a title needs disambiguating.
 *
 * Dates are `YYYY-MM-DD` and span roughly Aug 2025 → Jun 2026 so the timeline looks lived-in. Events
 * carry only what the seeder needs; the `shelved` head is authored here but the seeder also enforces
 * it. Reviews are first-person and deliberately short.
 */
export interface DemoEventFact {
  event: 'shelved' | 'started' | 'restarted' | 'finished' | 'dnf' | 'note' | 'quote';
  date: string;
  text?: string;
}

export interface DemoFact {
  title: string;
  authors: string[];
  query?: string;
  status: ShelfStatus;
  rating?: number;
  review?: string;
  tags: string[];
  addedDate: string;
  events: DemoEventFact[];
}

export const DEMO_FACTS: DemoFact[] = [
  {
    title: 'The Name of the Rose',
    authors: ['Umberto Eco'],
    status: 'read',
    rating: 5,
    review:
      'A medieval murder mystery that turns into a meditation on knowledge, faith, and the danger of certainty. I came for the monastery whodunit and stayed for the library.',
    tags: ['favorites', 'historical', 'literary-fiction'],
    addedDate: '2025-08-12',
    events: [
      { event: 'shelved', date: '2025-08-12' },
      { event: 'started', date: '2025-08-15' },
      { event: 'finished', date: '2025-09-09' },
    ],
  },
  {
    title: 'Blood Meridian',
    authors: ['Cormac McCarthy'],
    status: 'read',
    rating: 5,
    review:
      'Biblical and merciless. The prose is so dense I had to read some pages twice, and the Judge has not left my head since.',
    tags: ['favorites', 'literary-fiction', 'classics'],
    addedDate: '2025-09-01',
    events: [
      { event: 'shelved', date: '2025-09-01' },
      { event: 'started', date: '2025-09-12' },
      {
        event: 'quote',
        date: '2025-09-20',
        text: 'War is the truest form of divination. It is the testing of one’s will and the will of another.',
      },
      { event: 'finished', date: '2025-10-02' },
    ],
  },
  {
    title: 'Klara and the Sun',
    authors: ['Kazuo Ishiguro'],
    status: 'read',
    rating: 4,
    tags: ['sci-fi', 'literary-fiction'],
    addedDate: '2025-09-15',
    events: [
      { event: 'shelved', date: '2025-09-15' },
      { event: 'started', date: '2025-10-05' },
      { event: 'finished', date: '2025-10-18' },
    ],
  },
  {
    title: 'The Left Hand of Darkness',
    authors: ['Ursula K. Le Guin'],
    status: 'read',
    rating: 5,
    review:
      'Le Guin builds a whole anthropology and then breaks your heart inside it. The trek across the ice is one of the great passages in science fiction.',
    tags: ['favorites', 'sci-fi', 'classics'],
    addedDate: '2025-09-22',
    events: [
      { event: 'shelved', date: '2025-09-22' },
      { event: 'started', date: '2025-10-20' },
      { event: 'finished', date: '2025-11-04' },
    ],
  },
  {
    title: 'Piranesi',
    authors: ['Susanna Clarke'],
    status: 'read',
    rating: 5,
    review:
      'Strange, gentle, and quietly devastating. I finished it in two sittings and immediately wanted to walk back into the House.',
    tags: ['favorites', 'literary-fiction'],
    addedDate: '2025-10-10',
    events: [
      { event: 'shelved', date: '2025-10-10' },
      { event: 'started', date: '2025-11-06' },
      { event: 'finished', date: '2025-11-15' },
    ],
  },
  {
    title: 'Wolf Hall',
    authors: ['Hilary Mantel'],
    status: 'reading',
    tags: ['historical', 'book-club'],
    addedDate: '2026-05-10',
    events: [
      { event: 'shelved', date: '2026-05-10' },
      { event: 'started', date: '2026-05-22' },
    ],
  },
  {
    title: 'Beloved',
    authors: ['Toni Morrison'],
    status: 'read',
    rating: 4,
    tags: ['literary-fiction', 'classics'],
    addedDate: '2025-10-25',
    events: [
      { event: 'shelved', date: '2025-10-25' },
      { event: 'started', date: '2025-11-18' },
      { event: 'finished', date: '2025-12-01' },
    ],
  },
  {
    title: 'The Road',
    authors: ['Cormac McCarthy'],
    status: 'read',
    rating: 5,
    review:
      'Read it once years ago and again this winter. Bleaker and more tender than I remembered — the whole thing is carrying the fire.',
    tags: ['favorites', 'literary-fiction', 'to-reread'],
    addedDate: '2025-07-01',
    events: [
      { event: 'shelved', date: '2025-07-01' },
      { event: 'started', date: '2025-07-04' },
      { event: 'finished', date: '2025-07-12' },
      { event: 'restarted', date: '2025-12-20' },
      { event: 'finished', date: '2025-12-28' },
    ],
  },
  {
    title: 'Never Let Me Go',
    authors: ['Kazuo Ishiguro'],
    status: 'read',
    rating: 4,
    tags: ['sci-fi', 'literary-fiction'],
    addedDate: '2025-11-12',
    events: [
      { event: 'shelved', date: '2025-11-12' },
      { event: 'started', date: '2025-12-29' },
      { event: 'finished', date: '2026-01-08' },
    ],
  },
  {
    title: 'Dune',
    authors: ['Frank Herbert'],
    status: 'read',
    rating: 5,
    review:
      'The one that made me love the genre as a teenager. Coming back to it, the politics and ecology hold up even better than the worms.',
    tags: ['favorites', 'sci-fi', 'classics', 'to-reread'],
    addedDate: '2025-06-15',
    events: [
      { event: 'shelved', date: '2025-06-15' },
      { event: 'started', date: '2025-06-18' },
      { event: 'finished', date: '2025-07-02' },
      { event: 'restarted', date: '2026-01-12' },
      { event: 'finished', date: '2026-01-30' },
    ],
  },
  {
    title: 'The Secret History',
    authors: ['Donna Tartt'],
    status: 'read',
    rating: 5,
    review:
      'Pretentious classics students do a murder and it is unputdownable. Tartt makes you complicit by the second chapter.',
    tags: ['favorites', 'literary-fiction'],
    addedDate: '2025-12-05',
    events: [
      { event: 'shelved', date: '2025-12-05' },
      { event: 'started', date: '2026-02-01' },
      { event: 'finished', date: '2026-02-16' },
    ],
  },
  {
    title: 'Pachinko',
    authors: ['Min Jin Lee'],
    status: 'want',
    tags: ['historical', 'book-club'],
    addedDate: '2026-05-28',
    events: [{ event: 'shelved', date: '2026-05-28' }],
  },
  {
    title: 'A Little Life',
    authors: ['Hanya Yanagihara'],
    status: 'dnf',
    tags: ['literary-fiction'],
    addedDate: '2026-01-20',
    events: [
      { event: 'shelved', date: '2026-01-20' },
      { event: 'started', date: '2026-02-20' },
      { event: 'dnf', date: '2026-03-06' },
    ],
  },
  {
    title: 'The Overstory',
    authors: ['Richard Powers'],
    status: 'reading',
    tags: ['nature', 'literary-fiction'],
    addedDate: '2026-04-30',
    events: [
      { event: 'shelved', date: '2026-04-30' },
      { event: 'started', date: '2026-05-18' },
    ],
  },
  {
    title: 'Circe',
    authors: ['Madeline Miller'],
    status: 'read',
    rating: 4,
    tags: ['literary-fiction'],
    addedDate: '2026-02-10',
    events: [
      { event: 'shelved', date: '2026-02-10' },
      { event: 'started', date: '2026-02-18' },
      { event: 'finished', date: '2026-03-01' },
    ],
  },
  {
    title: 'Norwegian Wood',
    authors: ['Haruki Murakami'],
    status: 'read',
    rating: 3,
    tags: ['literary-fiction'],
    addedDate: '2026-02-22',
    events: [
      { event: 'shelved', date: '2026-02-22' },
      { event: 'started', date: '2026-03-08' },
      { event: 'finished', date: '2026-03-19' },
    ],
  },
  {
    title: 'The Brothers Karamazov',
    authors: ['Fyodor Dostoevsky'],
    status: 'want',
    tags: ['classics', 'owned'],
    addedDate: '2026-03-15',
    events: [{ event: 'shelved', date: '2026-03-15' }],
  },
  {
    title: 'Gilead',
    authors: ['Marilynne Robinson'],
    status: 'read',
    rating: 4,
    tags: ['literary-fiction'],
    addedDate: '2026-03-01',
    events: [
      { event: 'shelved', date: '2026-03-01' },
      { event: 'started', date: '2026-03-22' },
      { event: 'finished', date: '2026-04-02' },
    ],
  },
  {
    title: 'Cloud Atlas',
    authors: ['David Mitchell'],
    status: 'read',
    rating: 4,
    tags: ['sci-fi', 'literary-fiction'],
    addedDate: '2026-03-10',
    events: [
      { event: 'shelved', date: '2026-03-10' },
      { event: 'started', date: '2026-04-04' },
      { event: 'finished', date: '2026-04-20' },
    ],
  },
  {
    title: 'The Master and Margarita',
    authors: ['Mikhail Bulgakov'],
    status: 'want',
    tags: ['classics'],
    addedDate: '2026-04-12',
    events: [{ event: 'shelved', date: '2026-04-12' }],
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    authors: ['Yuval Noah Harari'],
    status: 'read',
    rating: 4,
    review:
      'Sweeping and provocative — best read as a conversation-starter rather than gospel. The chapter on the agricultural revolution as history’s great con stuck with me.',
    tags: ['science', 'history'],
    addedDate: '2025-09-05',
    events: [
      { event: 'shelved', date: '2025-09-05' },
      { event: 'started', date: '2025-09-25' },
      { event: 'finished', date: '2025-10-15' },
    ],
  },
  {
    title: 'Thinking, Fast and Slow',
    authors: ['Daniel Kahneman'],
    status: 'dnf',
    tags: ['science', 'psychology'],
    addedDate: '2025-11-01',
    events: [
      { event: 'shelved', date: '2025-11-01' },
      { event: 'started', date: '2025-11-20' },
      { event: 'dnf', date: '2025-12-10' },
    ],
  },
  {
    title: 'The Emperor of All Maladies',
    authors: ['Siddhartha Mukherjee'],
    status: 'read',
    rating: 5,
    review:
      'A "biography of cancer" that reads like a thriller. Mukherjee makes centuries of medicine feel urgent and human.',
    tags: ['favorites', 'science', 'history'],
    addedDate: '2025-10-08',
    events: [
      { event: 'shelved', date: '2025-10-08' },
      { event: 'started', date: '2025-10-28' },
      { event: 'finished', date: '2025-11-22' },
    ],
  },
  {
    title: 'Educated',
    authors: ['Tara Westover'],
    status: 'read',
    rating: 5,
    review:
      'Could not put it down. A memoir about the cost and the gift of an education, told without an ounce of self-pity.',
    tags: ['favorites', 'memoir'],
    addedDate: '2025-11-25',
    events: [
      { event: 'shelved', date: '2025-11-25' },
      { event: 'started', date: '2025-12-12' },
      { event: 'finished', date: '2025-12-22' },
    ],
  },
  {
    title: 'The Sixth Extinction',
    authors: ['Elizabeth Kolbert'],
    status: 'read',
    rating: 4,
    tags: ['science', 'nature'],
    addedDate: '2026-01-05',
    events: [
      { event: 'shelved', date: '2026-01-05' },
      { event: 'started', date: '2026-01-18' },
      { event: 'finished', date: '2026-02-05' },
    ],
  },
  {
    title: 'Why We Sleep',
    authors: ['Matthew Walker'],
    status: 'reading',
    tags: ['science', 'health'],
    addedDate: '2026-05-15',
    events: [
      { event: 'shelved', date: '2026-05-15' },
      { event: 'started', date: '2026-05-29' },
    ],
  },
  {
    title: 'A Brief History of Time',
    authors: ['Stephen Hawking'],
    status: 'read',
    rating: 4,
    tags: ['science', 'classics'],
    addedDate: '2025-12-15',
    events: [
      { event: 'shelved', date: '2025-12-15' },
      { event: 'started', date: '2026-01-02' },
      { event: 'finished', date: '2026-01-16' },
    ],
  },
  {
    title: 'The Body Keeps the Score',
    authors: ['Bessel van der Kolk'],
    status: 'want',
    tags: ['psychology', 'science'],
    addedDate: '2026-05-20',
    events: [{ event: 'shelved', date: '2026-05-20' }],
  },
  {
    title: 'Braiding Sweetgrass',
    authors: ['Robin Wall Kimmerer'],
    status: 'read',
    rating: 5,
    review:
      'Science and gratitude braided together. I started keeping a small garden because of this book.',
    tags: ['favorites', 'nature', 'science'],
    addedDate: '2026-02-28',
    events: [
      { event: 'shelved', date: '2026-02-28' },
      { event: 'started', date: '2026-03-25' },
      { event: 'finished', date: '2026-04-15' },
    ],
  },
  {
    title: 'Guns, Germs, and Steel',
    authors: ['Jared Diamond'],
    status: 'read',
    rating: 3,
    tags: ['history', 'science'],
    addedDate: '2025-10-30',
    events: [
      { event: 'shelved', date: '2025-10-30' },
      { event: 'started', date: '2025-12-05' },
      { event: 'finished', date: '2025-12-30' },
    ],
  },
  {
    title: 'The Immortal Life of Henrietta Lacks',
    authors: ['Rebecca Skloot'],
    status: 'read',
    rating: 4,
    tags: ['science', 'history'],
    addedDate: '2026-03-20',
    events: [
      { event: 'shelved', date: '2026-03-20' },
      { event: 'started', date: '2026-04-22' },
      { event: 'finished', date: '2026-05-06' },
    ],
  },
  {
    title: 'On Writing',
    authors: ['Stephen King'],
    status: 'read',
    rating: 4,
    review:
      'Half memoir, half master class. The advice is blunt and useful; the memoir half is better than most novels.',
    tags: ['memoir', 'craft'],
    addedDate: '2026-01-25',
    events: [
      { event: 'shelved', date: '2026-01-25' },
      { event: 'started', date: '2026-02-08' },
      { event: 'finished', date: '2026-02-19' },
    ],
  },
  {
    title: 'The Wager',
    authors: ['David Grann'],
    status: 'want',
    tags: ['history', 'true-crime'],
    addedDate: '2026-05-25',
    events: [{ event: 'shelved', date: '2026-05-25' }],
  },
  {
    title: 'Entangled Life',
    authors: ['Merlin Sheldrake'],
    status: 'read',
    rating: 4,
    tags: ['science', 'nature'],
    addedDate: '2026-04-08',
    events: [
      { event: 'shelved', date: '2026-04-08' },
      { event: 'started', date: '2026-04-24' },
      { event: 'finished', date: '2026-05-09' },
    ],
  },
  {
    title: 'Sea of Tranquility',
    authors: ['Emily St. John Mandel'],
    status: 'read',
    rating: 4,
    tags: ['sci-fi', 'literary-fiction'],
    addedDate: '2026-04-18',
    events: [
      { event: 'shelved', date: '2026-04-18' },
      { event: 'started', date: '2026-05-02' },
      { event: 'finished', date: '2026-05-14' },
    ],
  },
  {
    title: 'Station Eleven',
    authors: ['Emily St. John Mandel'],
    status: 'read',
    rating: 4,
    review:
      'A pandemic novel that is really about art and memory. "Survival is insufficient" earned its place on the caravan.',
    tags: ['sci-fi', 'literary-fiction'],
    addedDate: '2026-01-10',
    events: [
      { event: 'shelved', date: '2026-01-10' },
      { event: 'started', date: '2026-03-12' },
      { event: 'finished', date: '2026-03-24' },
    ],
  },
  {
    title: 'The Three-Body Problem',
    authors: ['Cixin Liu'],
    query: 'intitle:"The Three-Body Problem" inauthor:"Liu"',
    status: 'reading',
    tags: ['sci-fi'],
    addedDate: '2026-05-05',
    events: [
      { event: 'shelved', date: '2026-05-05' },
      { event: 'started', date: '2026-05-26' },
    ],
  },
  {
    title: 'Project Hail Mary',
    authors: ['Andy Weir'],
    status: 'want',
    tags: ['sci-fi'],
    addedDate: '2026-06-01',
    events: [{ event: 'shelved', date: '2026-06-01' }],
  },
];
