import { type LogEntry, type TimelineCycle } from '@livre/types';

type MutableCycle = {
  start: string;
  end: string | null;
  status: 'reading' | 'read' | 'dnf';
  events: LogEntry[];
};

const byDateAsc = (a: LogEntry, b: LogEntry): number => {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return a.id - b.id;
};

/**
 * Slices a book's reading log into reading cycles — one continuous read each — for the timeline.
 * A `started`/`restarted` opens a cycle; `finished`/`dnf` closes it (as `read`/`dnf`); a trailing
 * open cycle stays `reading`. `note`/`quote`/`format` attach to the open cycle, or to the most
 * recently closed one when logged between cycles. `shelved` is a book-level marker, not a cycle.
 * Events with no cycle to attach to (e.g. notes on a book that was never started) are dropped —
 * such books have no bar on the reading timeline.
 *
 * Pure and order-independent of input: the log is re-sorted ascending by (date, id) since the
 * repository returns it descending.
 */
export function deriveCycles(log: LogEntry[]): TimelineCycle[] {
  const ordered = [...log].sort(byDateAsc);
  const cycles: MutableCycle[] = [];
  let open: MutableCycle | null = null;
  let lastClosed: MutableCycle | null = null;

  for (const entry of ordered) {
    switch (entry.event) {
      case 'shelved':
        break;
      case 'started':
      case 'restarted': {
        open = { start: entry.date, end: null, status: 'reading', events: [entry] };
        cycles.push(open);
        break;
      }
      case 'finished':
      case 'dnf': {
        if (open) {
          open.end = entry.date;
          open.status = entry.event === 'finished' ? 'read' : 'dnf';
          open.events.push(entry);
          lastClosed = open;
          open = null;
        }
        break;
      }
      case 'note':
      case 'quote':
      case 'format': {
        const target = open ?? lastClosed;
        if (target) target.events.push(entry);
        break;
      }
    }
  }

  return cycles;
}
