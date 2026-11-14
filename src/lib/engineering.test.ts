import { describe, expect, it } from 'vitest';
import { calculateVehicleMetrics, estimateBuildCostUsd, INITIAL_VEHICLE } from './engineering';
import { circularOrbitPeriodMinutes, circularOrbitSpeedKmS } from './nasaData';

describe('spacecraft performance', () => {
  it('computes ideal delta V and initial mass from rocket equation', () => {
    const metrics = calculateVehicleMetrics(INITIAL_VEHICLE);
    expect(metrics.initialMassKg).toBe(273500);
    expect(metrics.finalMassKg).toBe(13500);
    expect(metrics.deltaVms).toBeGreaterThan(9500);
    expect(metrics.liftoffTwr).toBeGreaterThan(1.15);
  });

  it('reduces delta V when extra payload is added', () => {
    const baseline = calculateVehicleMetrics(INITIAL_VEHICLE);
    const heavier = calculateVehicleMetrics({ ...INITIAL_VEHICLE, payloadMassKg: 10000 });
    expect(heavier.deltaVms).toBeLessThan(baseline.deltaVms);
  });

  it('rejects invalid masses and does not return a plausible performance score', () => {
    const invalid = calculateVehicleMetrics({ ...INITIAL_VEHICLE, dryMassKg: 0 });
    expect(Number.isNaN(invalid.deltaVms)).toBe(true);
  });

  it('applies and caps manufacturing learning cost discounts', () => {
    const first = estimateBuildCostUsd(INITIAL_VEHICLE, 0);
    expect(estimateBuildCostUsd(INITIAL_VEHICLE, 1)).toBeLessThan(first);
    expect(estimateBuildCostUsd(INITIAL_VEHICLE, 20)).toBe(Math.round(first * 0.8));
  });
});

describe('simple Earth circular orbit calculations', () => {
  it('returns expected 400-km orbital speed and period orders of magnitude', () => {
    expect(circularOrbitSpeedKmS(400)).toBeCloseTo(7.6686, 2);
    expect(circularOrbitPeriodMinutes(400)).toBeGreaterThan(92);
    expect(circularOrbitPeriodMinutes(400)).toBeLessThan(93);
  });

  it('requires positive altitude', () => {
    expect(Number.isNaN(circularOrbitSpeedKmS(-100))).toBe(true);
  });
});
