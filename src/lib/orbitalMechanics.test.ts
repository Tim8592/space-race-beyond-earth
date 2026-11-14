import { describe,expect,it } from 'vitest';
import { EARTH_RADIUS_KM, earthOrbitAtTime, planetAtDate, solveKepler } from './orbitalMechanics';

describe('Keplerian orbit propagation', () => {
  it('solves Kepler equation at circular and eccentric cases',()=>{
    expect(solveKepler(0.3,0)).toBeCloseTo(0.3,10);
    const e=0.7;
    const M=2.1;
    const E=solveKepler(M,e);
    expect(E-e*Math.sin(E)).toBeCloseTo(M,11);
  });
  it('matches orbital periapsis and apoapsis at half a period',()=>{
    const start=earthOrbitAtTime(400,0.4,0);
    expect(start.radiusKm).toBeCloseTo(EARTH_RADIUS_KM+400,5);
    const half=earthOrbitAtTime(400,0.4,start.periodMinutes/2);
    expect(half.radiusKm).toBeCloseTo(start.semimajorAxisKm*(1+0.4),4);
    expect(start.speedKmS).toBeGreaterThan(half.speedKmS);
  });
  it('circular 400km orbit has approx 7.668 km/s and 92.56 minutes',()=>{
    const state=earthOrbitAtTime(400,0,0);
    expect(state.speedKmS).toBeCloseTo(7.6686,2);
    expect(state.periodMinutes).toBeGreaterThan(92);
    expect(state.periodMinutes).toBeLessThan(93);
    const cycle=earthOrbitAtTime(400,0,state.periodMinutes);
    expect(cycle.xKm).toBeCloseTo(state.xKm,6);
    expect(cycle.yKm).toBeCloseTo(state.yKm,6);
  });
  it('JPL approximate planet positions remain near documented heliocentric radii',()=>{
    const t=new Date('2026-11-14T12:00:00Z');
    const earth=planetAtDate('earth',t);
    const mars=planetAtDate('mars',t);
    const jupiter=planetAtDate('jupiter',t);
    expect(earth.distanceAu).toBeGreaterThan(0.98);
    expect(earth.distanceAu).toBeLessThan(1.02);
    expect(mars.distanceAu).toBeGreaterThan(1.3);
    expect(mars.distanceAu).toBeLessThan(1.7);
    expect(jupiter.distanceAu).toBeGreaterThan(4.8);
    expect(jupiter.distanceAu).toBeLessThan(5.5);
  });
  it('rejects dates beyond JPL fitted validity',()=>{
    expect(()=>planetAtDate('mars',new Date('2070-01-01T00:00:00Z'))).toThrow(RangeError);
  });
});
