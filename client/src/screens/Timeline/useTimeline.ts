import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { type DateRange } from './timelineScale';

/** Fetches the reading timeline — books with reading cycles overlapping the range (all when omitted). */
export const useTimeline = (range?: DateRange) =>
  useQuery({
    queryKey: ['log', 'timeline', range?.start ?? 'all', range?.end ?? 'all'],
    queryFn: () => api.log.timeline(range),
  });
