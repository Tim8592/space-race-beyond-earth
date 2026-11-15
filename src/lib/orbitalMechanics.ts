/**
 * Educational, mathematically propagated 2-body orbital models.
 * Earth satellite: Newtonian two-body, no drag/J2, non-rotating plane.
 * Planet positions: JPL approximate Keplerian elements (Table 1, 1800–2050).
 *
 * JPL: https://ssd.jpl.nasa.gov/planets/approx_pos.html
 * Earth GM: https://ssd.jpl.nasa.gov/astro_par.html
 * Earth radius: https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
 *
 * Solar-system positions are projected onto J2000 ecliptic XY.
 * Earth point is the EARTH-MOON BARYCENTER, not geocentric Earth.
 * Date conversion uses UTC as approximation to TDB (display only).
 * These are NOT launch-window, ephemeris-grade or low-thrust mission solvers.
 */
import { EARTH } from './nasaData';

export const MU_EARTH_KM3_S2 = EARTH.gravitationalParameterKm3PerS2;
export const EARTH_RADIUS_KM = EARTH.equatorialRadiusKm;

export type OrbitState = {
  xKm: number; yKm: number;
  radiusKm: number;
  speedKmS: number;
  periodMinutes: number;
  perigeeAltitudeKm: number;
  apogeeAltitudeKm: number;
  semimajorAxisKm: number;
  eccentricAnomalyRad: number;
  trueAnomalyRad: number;
};

const TAU = 2 * Math.PI;
const DEGREES = Math.PI / 180;

export function solveKepler(meanAnomalyRadians: number, eccentricity: number): number {
  if (!Number.isFinite(meanAnomalyRadians) ||
      !Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1) {
    throw new RangeError('Kepler solver expects finite M and elliptical eccentricity 0 ≤ e < 1');
  }
  // Clamp the angle to speed up convergence but preserve equivalent phase.
  const M = ((meanAnomalyRadians % TAU) + TAU) % TAU;
  let E = eccentricity > 0.8 ? Math.PI : M;
  for (let i = 0; i < 40; i++) {
    const f = E - eccentricity * Math.sin(E) - M;
    const slope = 1 - eccentricity * Math.cos(E);
    const step = f / slope;
    E -= step;
    if (Math.abs(step) < 1e-12) return E;
  }
  throw new Error('Kepler equation did not converge');
}

/** Earth-centered orbit from perigee altitude, e, elapsed minutes and argument of periapsis. */
export function earthOrbitAtTime(
  perigeeAltitudeKm: number,
  eccentricity: number,
  elapsedMinutes: number,
  argumentPeriapsisDeg = 0,
): OrbitState {
  if (![perigeeAltitudeKm, eccentricity, elapsedMinutes, argumentPeriapsisDeg].every(Number.isFinite) ||
      perigeeAltitudeKm < 150 || perigeeAltitudeKm > 100000 ||
      eccentricity < 0 || eccentricity >= 0.985) {
    throw new RangeError('Orbit inputs outside supported range');
  }
  const rp = EARTH_RADIUS_KM + perigeeAltitudeKm;
  const a = rp / (1 - eccentricity);
  const ra = a * (1 + eccentricity);
  const meanMotion = Math.sqrt(MU_EARTH_KM3_S2 / (a ** 3));
  const E = solveKepler(elapsedMinutes * 60 * meanMotion, eccentricity);
  const xv = a * (Math.cos(E) - eccentricity);
  const yv = a * Math.sqrt(1 - eccentricity ** 2) * Math.sin(E);
  const omega = argumentPeriapsisDeg * DEGREES;
  const xKm = xv * Math.cos(omega) - yv * Math.sin(omega);
  const yKm = xv * Math.sin(omega) + yv * Math.cos(omega);
  const radiusKm = Math.hypot(xKm,yKm);
  const speedKmS = Math.sqrt(MU_EARTH_KM3_S2 * (2 / radiusKm - 1 / a));
  const periodMinutes = TAU / meanMotion / 60;
  return {
    xKm, yKm, radiusKm, speedKmS, periodMinutes,
    perigeeAltitudeKm,
    apogeeAltitudeKm: ra - EARTH_RADIUS_KM,
    semimajorAxisKm: a,
    eccentricAnomalyRad: E,
    trueAnomalyRad: Math.atan2(yv, xv + a * eccentricity),
  };
}

/** Solar system J2000 Table 1 elements plus linear secular rates. */
export const PLANETS = {
  venus: { label: 'Venus', base: [0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255], rate: [0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418] },
  earth: { label: 'Earth–Moon barycenter', base: [1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0], rate: [0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0] },
  mars: { label: 'Mars', base: [1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891], rate: [0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343] },
  jupiter: { label: 'Jupiter', base: [5.20288700,0.04838624,1.30439695,34.39644051,14.72847983,100.47390909], rate: [-0.00011607,-0.00013253,-0.00183714,3034.74612775,0.21252668,0.20469106] },
} as const;

export type PlanetId = keyof typeof PLANETS;
export type HeliocentricPosition = { xAu: number; yAu: number; zAu: number; distanceAu: number; label: string };
const J2000_MS = Date.UTC(2000,0,1,12,0,0);

export function planetAtDate(planetId: PlanetId, at: Date): HeliocentricPosition {
  const p = PLANETS[planetId];
  const ms = at.getTime();
  if (!p || !Number.isFinite(ms)) throw new RangeError('Invalid planet/date');
  // Table 1's validity limits; forbid extrapolating beyond source interval.
  const year = at.getUTCFullYear();
  if (year < 1800 || year > 2050) throw new RangeError('JPL Table 1 elements only valid 1800–2050');
  const T = (ms - J2000_MS) / (36525 * 86400000);
  const eValues = p.base.map((value,i)=> value + p.rate[i]*T);
  const [a,e,I,L,peri,node] = eValues;
  const M = (L-peri) * DEGREES;
  const E = solveKepler(M,e);
  const xPrime = a * (Math.cos(E)-e);
  const yPrime = a * Math.sqrt(1-e*e)*Math.sin(E);
  const w = (peri-node)*DEGREES;
  const O = node*DEGREES;
  const incl = I*DEGREES;
  const xAu = (Math.cos(w)*Math.cos(O)-Math.sin(w)*Math.sin(O)*Math.cos(incl))*xPrime
    + (-Math.sin(w)*Math.cos(O)-Math.cos(w)*Math.sin(O)*Math.cos(incl))*yPrime;
  const yAu = (Math.cos(w)*Math.sin(O)+Math.sin(w)*Math.cos(O)*Math.cos(incl))*xPrime
    + (-Math.sin(w)*Math.sin(O)+Math.cos(w)*Math.cos(O)*Math.cos(incl))*yPrime;
  const zAu = Math.sin(w)*Math.sin(incl)*xPrime + Math.cos(w)*Math.sin(incl)*yPrime;
  return {xAu,yAu,zAu,distanceAu:Math.hypot(xAu,yAu,zAu),label:p.label};
}
