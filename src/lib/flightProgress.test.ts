import {it,expect} from 'vitest';
import {flightProgress,flightEta,DEFAULT_FLIGHT_VIEWER_MS} from './flightProgress';
it('time-based flight remains consistent after leaving and reentering a view',()=>{
 const started=1000;
 expect(flightProgress(started,started).fraction).toBe(0);
 expect(flightProgress(started,started+DEFAULT_FLIGHT_VIEWER_MS/2).fraction).toBe(.5);
 expect(flightProgress(started,started+DEFAULT_FLIGHT_VIEWER_MS).ready).toBe(true);
 expect(flightProgress(started,started+DEFAULT_FLIGHT_VIEWER_MS*2).fraction).toBe(1);
 expect(flightEta(75_000)).toBe('1:15');
 expect(flightEta(0)).toBe('0:00');
});
