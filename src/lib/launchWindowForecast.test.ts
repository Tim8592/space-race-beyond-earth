import {describe,it,expect} from 'vitest';
import {approximateDepartureWindows,LAUNCH_WINDOW_SAMPLES,LAUNCH_WINDOW_STEP_DAYS}
 from './launchWindowForecast';
import {DEFAULT_MISSION_OPTIONS,orbitalRoute,dateForGameDay} from './campaignMissions';
describe('Mission flight review current vs future transfer date map',()=>{
 it('samples 32 upcoming dates and keeps todays requirement aligned with campaign Hohmann model',()=>{
   const forecast=approximateDepartureWindows('mars',50,DEFAULT_MISSION_OPTIONS)!;
   expect(forecast.points).toHaveLength(LAUNCH_WINDOW_SAMPLES);
   expect(forecast.current.day).toBe(50);
   expect(forecast.current.date).toBe(dateForGameDay(50));
   expect(forecast.points[1].day-forecast.current.day).toBe(LAUNCH_WINDOW_STEP_DAYS);
   expect(forecast.current.requiredDeltaVms).toBeCloseTo(
     orbitalRoute('mars',50,DEFAULT_MISSION_OPTIONS).totalDeltaVms*1.05,7);
   expect(forecast.best.requiredDeltaVms).toBeLessThanOrEqual(forecast.current.requiredDeltaVms);
   expect(forecast.best.day).toBeGreaterThanOrEqual(50);
   expect(forecast.best.day).toBeLessThan(50+LAUNCH_WINDOW_SAMPLES*LAUNCH_WINDOW_STEP_DAYS);
 });
 it('Jupiter target has distinct future phase-angle curve from Mars mission',()=>{
   const mars=approximateDepartureWindows('mars',35,DEFAULT_MISSION_OPTIONS)!;
   const jupiter=approximateDepartureWindows('jupiter',35,DEFAULT_MISSION_OPTIONS)!;
   expect(jupiter.current.requiredDeltaVms).not.toBeCloseTo(mars.current.requiredDeltaVms);
   expect(jupiter.flightDays).toBeGreaterThan(mars.flightDays);
   expect(new Set(jupiter.points.map(p=>Math.round(p.requiredDeltaVms))).size).toBeGreaterThan(1);
 });
 it('Earth and Moon cannot claim a fake date-dependent launch-window minimum',()=>{
   expect(approximateDepartureWindows('lunar',1,DEFAULT_MISSION_OPTIONS)).toBeNull();
   expect(approximateDepartureWindows('ellipse',1,DEFAULT_MISSION_OPTIONS)).toBeNull();
   expect(approximateDepartureWindows('asteroid',1,DEFAULT_MISSION_OPTIONS)).toBeNull();
   expect(()=>approximateDepartureWindows('mars',0,DEFAULT_MISSION_OPTIONS)).toThrow();
 });
});
