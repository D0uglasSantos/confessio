export function estimateWaitMinutes({
  peopleAhead,
  activeStations,
  averageServiceMinutes,
}: {
  peopleAhead: number;
  activeStations: number;
  averageServiceMinutes: number | null;
}) {
  if (averageServiceMinutes === null || activeStations <= 0) {
    return null;
  }

  return Math.ceil(peopleAhead / activeStations) * averageServiceMinutes;
}
