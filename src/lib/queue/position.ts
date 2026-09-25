export function computeQueuePosition(
  currentPublicNumber: number,
  waitingAheadCount: number,
) {
  return {
    peopleAhead: waitingAheadCount,
    isNext: waitingAheadCount === 0,
    isNear: waitingAheadCount > 0 && waitingAheadCount <= 2,
    currentPublicNumber,
  };
}
