import {describe,it,expect} from 'vitest';
import {EARTH} from './nasaData';
import {planetAtDate} from './orbitalMechanics';
import {earthKeplerTrack,earthOrbitInstant,hohmannTrack,lunarKeplerTrack,
 moonMeanPositionKm,pointAtFraction,planetPositionAtFlightDay} from './flightDirectoratePhysics';
const departure=new Date('2026-11-15T12:00:00Z');
describe('Real-distance propagated Flight Directorate models',()=>{
 it('circular 400 km Earth orbit closes and has true ~92 minute period and speed',()=>{
  const orbit=earthKeplerTrack({perigeeAltitudeKm:400,eccentricity:0});
  expect(orbit.centralBody).toBe('earth');
  expect(orbit.orbitPeriodMinutes!).toBeGreaterThan(90);
  expect(orbit.orbitPeriodMinutes!).toBeLessThan(95);
  expect(orbit.departureSpeedKmS).toBeGreaterThan(7.5);
  expect(orbit.departureSpeedKmS).toBeLessThan(8);
  for(const p of orbit.points){
   expect(Math.hypot(...p)).toBeCloseTo(EARTH.equatorialRadiusKm+400,5);
  }
  const first=orbit.points[0],last=orbit.points.at(-1)!;
  expect(Math.hypot(first[0]-last[0],first[1]-last[1])).toBeLessThan(.00001);
 });
 it('Earth elliptical orbit uses real Kepler time evolution, not constant angle or Bezier',()=>{
  const orbit=earthKeplerTrack({perigeeAltitudeKm:420,eccentricity:.64});
  const rp=EARTH.equatorialRadiusKm+420;
  const ra=rp*(1+.64)/(1-.64);
  expect(Math.hypot(...orbit.points[0])).toBeCloseTo(rp,5);
  expect(Math.hypot(...pointAtFraction(orbit.points,.5))).toBeCloseTo(ra,1);
  expect(orbit.departureSpeedKmS).toBeGreaterThan(orbit.arrivalSpeedKmS);
  const x=earthOrbitInstant({perigeeAltitudeKm:420,eccentricity:.64,
    elapsedMinutes:orbit.orbitPeriodMinutes!/2});
  expect(Math.hypot(...x)).toBeCloseTo(ra,5);
 });
 it('Earth-to-Moon coast reaches 384400 km near the mean Moon phase after physical flight days',()=>{
  const orbit=lunarKeplerTrack(departure);
  expect(orbit.model).toBe('lunar-kepler');
  expect(orbit.modeledFlightDays).toBeGreaterThan(4);
  expect(orbit.modeledFlightDays).toBeLessThan(7);
  expect(Math.hypot(...orbit.points[0])).toBeCloseTo(EARTH.equatorialRadiusKm+400,5);
  const last=orbit.points.at(-1)!;
  expect(Math.hypot(...last)).toBeCloseTo(384400,2);
  const arrivalDate=new Date(departure.getTime()+orbit.modeledFlightDays*86400000);
  const moon=moonMeanPositionKm(arrivalDate);
  expect(Math.hypot(last[0]-moon[0],last[1]-moon[1])).toBeLessThan(.01);
  expect(orbit.departureSpeedKmS).toBeGreaterThan(orbit.arrivalSpeedKmS);
  expect(orbit.caveat).toContain('No three-body encounter');
 });
 it('Mars/Jupiter use a Sun-centered Hohmann conic with physical duration and valid speeds',()=>{
  const mars=hohmannTrack(departure,'mars');
  const jupiter=hohmannTrack(departure,'jupiter');
  expect(mars.modeledFlightDays).toBeGreaterThan(240);
  expect(mars.modeledFlightDays).toBeLessThan(280);
  expect(jupiter.modeledFlightDays).toBeGreaterThan(950);
  expect(jupiter.modeledFlightDays).toBeLessThan(1100);
  expect(mars.departureSpeedKmS).toBeGreaterThan(30);
  expect(jupiter.departureSpeedKmS).toBeGreaterThan(mars.departureSpeedKmS);
  const earth=planetAtDate('earth',departure);
  expect(mars.points[0][0]).toBeCloseTo(earth.xAu,7);
  expect(mars.points[0][1]).toBeCloseTo(earth.yAu,7);
  expect(Math.hypot(...mars.points.at(-1)!)).toBeCloseTo(1.52371034,4);
  expect(mars.caveat).toContain('does not solve');
 });
 it('planet positions are actual JPL-element positions for accelerated flight date',()=>{
  const at=planetPositionAtFlightDay(departure,'mars',42);
  const expected=planetAtDate('mars',new Date(departure.getTime()+42*86400000));
  expect(at[0]).toBeCloseTo(expected.xAu,12);
  expect(at[1]).toBeCloseTo(expected.yAu,12);
  const p=pointAtFraction([[0,0,0],[20,10,5]],.25);
  expect(p).toEqual([5,2.5,1.25]);
  expect(()=>pointAtFraction([],0)).toThrow();
 });
});
