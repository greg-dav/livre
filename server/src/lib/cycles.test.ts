import { describe, it, expect } from 'vitest';
import { type LogEntry } from '@livre/types';
import { deriveCycles } from './cycles';

let nextId = 1;
const landmark = (
  event: 'shelved' | 'started' | 'restarted' | 'finished' | 'dnf',
  date: string
): LogEntry => ({ id: nextId++, event, date });
const note = (date: string, text = 'a note'): LogEntry => ({
  id: nextId++,
  event: 'note',
  date,
  text,
});
const quote = (date: string, text = 'a quote'): LogEntry => ({
  id: nextId++,
  event: 'quote',
  date,
  text,
});

describe('deriveCycles', () => {
  it('returns a single read cycle', () => {
    const log = [landmark('started', '2026-02-03'), landmark('finished', '2026-02-28')];
    const cycles = deriveCycles(log);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toMatchObject({ start: '2026-02-03', end: '2026-02-28', status: 'read' });
  });

  it('splits a re-read into multiple cycles', () => {
    const log = [
      landmark('started', '2026-01-18'),
      landmark('finished', '2026-03-01'),
      landmark('restarted', '2026-04-08'),
      landmark('finished', '2026-05-01'),
    ];
    const cycles = deriveCycles(log);
    expect(cycles).toHaveLength(2);
    expect(cycles[0]).toMatchObject({ start: '2026-01-18', end: '2026-03-01', status: 'read' });
    expect(cycles[1]).toMatchObject({ start: '2026-04-08', end: '2026-05-01', status: 'read' });
  });

  it('marks a dnf cycle', () => {
    const log = [landmark('started', '2026-03-19'), landmark('dnf', '2026-04-14')];
    expect(deriveCycles(log)[0]).toMatchObject({ status: 'dnf', end: '2026-04-14' });
  });

  it('leaves an active read open (reading, null end)', () => {
    const log = [landmark('started', '2026-05-14')];
    expect(deriveCycles(log)[0]).toMatchObject({ status: 'reading', end: null });
  });

  it('attaches a between-cycle note to the most recently closed cycle', () => {
    const started = landmark('started', '2026-01-18');
    const finished = landmark('finished', '2026-05-01');
    const between = note('2026-05-09', 'retrospective');
    const cycles = deriveCycles([started, finished, between]);
    expect(cycles).toHaveLength(1);
    expect(cycles[0].events.map((e) => e.id)).toContain(between.id);
  });

  it('attaches notes/quotes within a cycle to that cycle', () => {
    const log = [
      landmark('started', '2026-02-03'),
      note('2026-02-10'),
      quote('2026-02-20'),
      landmark('finished', '2026-02-28'),
    ];
    const cycles = deriveCycles(log);
    expect(cycles[0].events.filter((e) => e.event === 'note' || e.event === 'quote')).toHaveLength(
      2
    );
  });

  it('returns no cycles for a notes-only book (never started)', () => {
    const log = [landmark('shelved', '2026-01-01'), note('2026-01-05')];
    expect(deriveCycles(log)).toHaveLength(0);
  });

  it('is independent of input order', () => {
    const log = [landmark('finished', '2026-02-28'), landmark('started', '2026-02-03')];
    const cycles = deriveCycles(log);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toMatchObject({ start: '2026-02-03', end: '2026-02-28' });
  });
});
