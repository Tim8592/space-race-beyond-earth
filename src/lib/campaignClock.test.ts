import {describe,it,expect} from 'vitest';
import {GAME_DAY_DURATION_MS,elapsedGameDays,todayGameDay} from './campaignClock';
describe('Continuous mission calendar',()=>{
  it('starts at the actual local calendar date, anchored on Nov 14 2026',()=>{
    expect(todayGameDay(new Date(2026,10,14))).toBe(1);
    expect(todayGameDay(new Date(2026,10,21))).toBe(8);
  });
  it('passes one day per two real minutes, with no day-skipping click',()=>{
    expect(elapsedGameDays(119_999)).toBe(0);
    expect(elapsedGameDays(120_000)).toBe(1);
    expect(elapsedGameDays(GAME_DAY_DURATION_MS-.1)).toBe(0);
    expect(elapsedGameDays(GAME_DAY_DURATION_MS)).toBe(1);
  });
});
