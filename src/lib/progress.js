/**
 * Calculate a bounded lesson progress percentage.
 * Returns 0 when totalCount is zero/invalid.
 */
export function calculateProgress(completedCount, totalCount) {
  if (!totalCount || totalCount <= 0) return 0;
  const percentage = (completedCount / totalCount) * 100;
  return Math.max(0, Math.min(100, Math.round(percentage)));
}
