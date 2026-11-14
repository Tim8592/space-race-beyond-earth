/**
 * NASA/JPL data used by the game's circular-orbit display.
 *
 * Earth GM from JPL Solar System Dynamics (DE440):
 * https://ssd.jpl.nasa.gov/astro_par.html
 *
 * Earth equatorial radius from NASA NSSDC Earth Fact Sheet:
 * https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
 *
 * Orbital equations are classical two-body mechanics.
 * This is not a launch-trajectory or mission design solver.
 */
export const EARTH = {
  gravitationalParameterKm3PerS2: 398600.435507,
  equatorialRadiusKm: 6378.137,
} as const;

export const STANDARD_GRAVITY_MS2 = 9.80665;

export function circularOrbitSpeedKmS(altitudeKm: number): number {
  const radius = EARTH.equatorialRadiusKm + altitudeKm;
  if (!Number.isFinite(radius) || radius <= EARTH.equatorialRadiusKm) return NaN;
  return Math.sqrt(EARTH.gravitationalParameterKm3PerS2 / radius);
}

export function circularOrbitPeriodMinutes(altitudeKm: number): number {
  const radius = EARTH.equatorialRadiusKm + altitudeKm;
  if (!Number.isFinite(radius) || radius <= EARTH.equatorialRadiusKm) return NaN;
  const seconds = 2 * Math.PI * Math.sqrt(radius ** 3 / EARTH.gravitationalParameterKm3PerS2);
  return seconds / 60;
}
