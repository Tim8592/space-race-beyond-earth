import { STANDARD_GRAVITY_MS2 } from './nasaData';

export type EngineId = 'kerolox' | 'methalox' | 'hydrolox';

export type Engine = {
  id: EngineId;
  label: string;
  subtitle: string;
  ispSeconds: number;
  thrustNewtons: number;
  fixedCostUsd: number;
};

export const ENGINES: Record<EngineId, Engine> = {
  kerolox: {
    id: 'kerolox',
    label: 'Kerolox',
    subtitle: 'High-thrust workhorse',
    ispSeconds: 330,
    thrustNewtons: 4_200_000,
    fixedCostUsd: 22_000_000,
  },
  methalox: {
    id: 'methalox',
    label: 'Methalox',
    subtitle: 'Balanced performance',
    ispSeconds: 360,
    thrustNewtons: 4_000_000,
    fixedCostUsd: 34_000_000,
  },
  hydrolox: {
    id: 'hydrolox',
    label: 'Hydrolox',
    subtitle: 'High specific impulse',
    ispSeconds: 450,
    thrustNewtons: 3_200_000,
    fixedCostUsd: 48_000_000,
  },
};

// Engine specifications and prices are illustrative game-balancing inputs,
// not specifications for actual vehicles or NASA-provided datasets.
export type Vehicle = {
  name: string;
  engineId: EngineId;
  dryMassKg: number;
  propellantMassKg: number;
  payloadMassKg: number;
};

export const INITIAL_VEHICLE: Vehicle = {
  name: 'Pioneer Mk I',
  engineId: 'kerolox',
  dryMassKg: 11500,
  propellantMassKg: 260000,
  payloadMassKg: 2000,
};

export type VehicleMetrics = {
  initialMassKg: number;
  finalMassKg: number;
  deltaVms: number;
  liftoffTwr: number;
  propellantFraction: number;
  ispSeconds: number;
  thrustNewtons: number;
};

export function calculateVehicleMetrics(vehicle: Vehicle): VehicleMetrics {
  const engine = ENGINES[vehicle.engineId];
  const finalMassKg = vehicle.dryMassKg + vehicle.payloadMassKg;
  const initialMassKg = finalMassKg + vehicle.propellantMassKg;
  if (
    !engine ||
    ![vehicle.dryMassKg, vehicle.payloadMassKg, vehicle.propellantMassKg].every(Number.isFinite) ||
    vehicle.dryMassKg <= 0 ||
    vehicle.payloadMassKg < 0 ||
    vehicle.propellantMassKg < 0 ||
    finalMassKg <= 0
  ) {
    return {
      initialMassKg: NaN,
      finalMassKg: NaN,
      deltaVms: NaN,
      liftoffTwr: NaN,
      propellantFraction: NaN,
      ispSeconds: engine?.ispSeconds ?? NaN,
      thrustNewtons: engine?.thrustNewtons ?? NaN,
    };
  }
  return {
    initialMassKg,
    finalMassKg,
    deltaVms: engine.ispSeconds * STANDARD_GRAVITY_MS2 * Math.log(initialMassKg / finalMassKg),
    liftoffTwr: engine.thrustNewtons / (initialMassKg * STANDARD_GRAVITY_MS2),
    propellantFraction: vehicle.propellantMassKg / initialMassKg,
    ispSeconds: engine.ispSeconds,
    thrustNewtons: engine.thrustNewtons,
  };
}

/** Simplified fictional build cost, in US dollars. Repeated builds earn a capped 2% cost reduction each. */
export function estimateBuildCostUsd(vehicle: Vehicle, completedWithEngine: number): number {
  const engine = ENGINES[vehicle.engineId];
  const subtotal =
    25_000_000 +
    vehicle.dryMassKg * 1500 +
    vehicle.propellantMassKg * 60 +
    engine.fixedCostUsd;
  const learningDiscount = Math.min(Math.max(0, completedWithEngine) * 0.02, 0.2);
  return Math.round(subtotal * (1 - learningDiscount));
}
