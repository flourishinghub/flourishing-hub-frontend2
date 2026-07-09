import { useEffect, useState } from 'react';

// Forces a re-render every `intervalMs` with no network call. "Live" status
// (isEventLive) is a pure function of already-fetched startAt/endAt vs the
// current time — there's nothing to re-fetch, just a reason to re-evaluate
// it, so this beats polling the API just to keep a badge fresh.
export function useNowTick(intervalMs = 30000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
