/** Real-time pacing for the open browser session: 7 game days per real minute. */
export const GAME_DAYS_PER_REAL_MINUTE = 7;
export const GAME_DAY_DURATION_MS = 60_000 / GAME_DAYS_PER_REAL_MINUTE;
export const GAME_EPOCH_MS = Date.UTC(2026, 10, 14, 12);
const DAY_MS = 86_400_000;
export function todayGameDay(now: Date = new Date()): number {
  const localDateAtUtcNoon = Date.UTC(now.getFullYear(),now.getMonth(),now.getDate(),12);
  return Math.max(1,Math.floor((localDateAtUtcNoon-GAME_EPOCH_MS)/DAY_MS)+1);
}
export function elapsedGameDays(elapsedMs: number): number {
  return Number.isFinite(elapsedMs)&&elapsedMs>0?
    Math.floor((elapsedMs+1e-7)/GAME_DAY_DURATION_MS):0;
}
