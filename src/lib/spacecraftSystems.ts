/**
 * First-order spacecraft system sizing: all dimensions SI unless named otherwise.
 *
 * Models are preliminary engineering approximations, not mission certification.
 * Inputs like tank material strength, utilization, discharge depth and mission
 * losses must be supplied by the player/vehicle specification.
 */
import { STANDARD_GRAVITY_MS2 } from './nasaData';
import { SOLAR_IRRADIANCE_1AU_WM2 } from './spacecraftTechnology';

const STEFAN_BOLTZMANN = 5.670374419e-8; // W/(m²·K⁴), physical constant

function checkPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be > 0`);
}

function checkNonnegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be >= 0`);
}

function checkFraction(name: string, value: number, allowOne = true): void {
  if (!Number.isFinite(value) || value < 0 || (allowOne ? value > 1 : value >= 1)) {
    throw new RangeError(`${name} must be within [0, ${allowOne ? '1' : '1)'}]`);
  }
}

/** Ideal Tsiolkovsky rocket equation for a single fixed-Isp burn, no external forces. */
export function idealDeltaVms(initialMassKg: number, finalMassKg: number, ispSeconds: number): number {
  checkPositive('initialMassKg', initialMassKg);
  checkPositive('finalMassKg', finalMassKg);
  checkPositive('ispSeconds', ispSeconds);
  if (finalMassKg > initialMassKg) throw new RangeError('finalMassKg cannot exceed initialMassKg');
  return ispSeconds * STANDARD_GRAVITY_MS2 * Math.log(initialMassKg / finalMassKg);
}

/** Propellant needed for a maneuver, excluding reserves, boiloff and tank dry mass changes. */
export function idealPropellantForDeltaVKg(
  nonPropellantMassKg: number,
  deltaVms: number,
  ispSeconds: number,
): number {
  checkPositive('nonPropellantMassKg', nonPropellantMassKg);
  checkNonnegative('deltaVms', deltaVms);
  checkPositive('ispSeconds', ispSeconds);
  const exponent = deltaVms / (ispSeconds * STANDARD_GRAVITY_MS2);
  const result = nonPropellantMassKg * Math.expm1(exponent);
  if (!Number.isFinite(result)) throw new RangeError('Calculated propellant exceeds numeric limits');
  return result;
}

/** Thrust and Isp describe mass-flow rate at the given operating point. */
export function massFlowKgPerSecond(thrustN: number, ispSeconds: number): number {
  checkNonnegative('thrustN', thrustN);
  checkPositive('ispSeconds', ispSeconds);
  return thrustN / (ispSeconds * STANDARD_GRAVITY_MS2);
}

/** Constant thrust/Isp burn duration; not a trajectory or gravity-loss model. */
export function idealBurnDurationSeconds(propellantMassKg: number, thrustN: number, ispSeconds: number): number {
  checkNonnegative('propellantMassKg', propellantMassKg);
  checkPositive('thrustN', thrustN);
  return propellantMassKg / massFlowKgPerSecond(thrustN, ispSeconds);
}

/**
 * Beginning-of-life solar electrical output at a heliocentric distance.
 * Efficiency is cell efficiency, NOT conversion from manufacturer-stated peak W/m²:
 * do not multiply by both efficiencies and quoted peak power density.
 */
export function solarArrayPowerW(inputs: {
  cellAreaM2: number;
  bolEfficiency: number;
  distanceAu: number;
  incidenceCosine: number;
  userDeratingFactor: number;
}): number {
  checkNonnegative('cellAreaM2', inputs.cellAreaM2);
  checkFraction('bolEfficiency', inputs.bolEfficiency);
  checkPositive('distanceAu', inputs.distanceAu);
  checkFraction('incidenceCosine', inputs.incidenceCosine);
  checkFraction('userDeratingFactor', inputs.userDeratingFactor);
  return SOLAR_IRRADIANCE_1AU_WM2
    * inputs.cellAreaM2
    * inputs.bolEfficiency
    * inputs.incidenceCosine
    * inputs.userDeratingFactor
    / (inputs.distanceAu ** 2);
}

/**
 * Battery mass to supply an eclipse energy budget.
 * Uses PACK-level energy density rather than raw cell-level energy density.
 */
export function batteryMassForEclipseKg(inputs: {
  eclipseLoadW: number;
  eclipseHours: number;
  packSpecificEnergyWhKg: number;
  maxDepthOfDischarge: number;
  dischargeEfficiency: number;
}): number {
  checkNonnegative('eclipseLoadW', inputs.eclipseLoadW);
  checkNonnegative('eclipseHours', inputs.eclipseHours);
  checkPositive('packSpecificEnergyWhKg', inputs.packSpecificEnergyWhKg);
  checkFraction('maxDepthOfDischarge', inputs.maxDepthOfDischarge);
  checkFraction('dischargeEfficiency', inputs.dischargeEfficiency);
  if (inputs.maxDepthOfDischarge === 0 || inputs.dischargeEfficiency === 0) {
    if (inputs.eclipseLoadW * inputs.eclipseHours === 0) return 0;
    throw new RangeError('Battery depth of discharge and discharge efficiency must be non-zero for a powered eclipse');
  }
  const requiredWh = inputs.eclipseLoadW * inputs.eclipseHours;
  return requiredWh
    / (inputs.packSpecificEnergyWhKg * inputs.maxDepthOfDischarge * inputs.dischargeEfficiency);
}

/** Simplified sunlight operating power margin (negative means a deficit). */
export function sunlightPowerMarginW(
  solarPowerW: number,
  housekeepingPowerW: number,
  electricThrusterPowerW: number,
): number {
  checkNonnegative('solarPowerW', solarPowerW);
  checkNonnegative('housekeepingPowerW', housekeepingPowerW);
  checkNonnegative('electricThrusterPowerW', electricThrusterPowerW);
  return solarPowerW - housekeepingPowerW - electricThrusterPowerW;
}

/**
 * Radiative heat rejection from an isothermal flat radiator into a uniform sink.
 * Assumes clear view to sink, no solar/Earth/planet incident heating unless
 * already included in heatLoadW, and no conductive bottlenecks.
 */
export function minimumRadiatorAreaM2(inputs: {
  heatLoadW: number;
  surfaceEmissivity: number;
  radiatorTemperatureK: number;
  effectiveSinkTemperatureK: number;
}): number {
  checkNonnegative('heatLoadW', inputs.heatLoadW);
  checkFraction('surfaceEmissivity', inputs.surfaceEmissivity);
  checkPositive('radiatorTemperatureK', inputs.radiatorTemperatureK);
  checkNonnegative('effectiveSinkTemperatureK', inputs.effectiveSinkTemperatureK);
  if (inputs.heatLoadW === 0) return 0;
  if (inputs.surfaceEmissivity === 0 || inputs.radiatorTemperatureK <= inputs.effectiveSinkTemperatureK) {
    throw new RangeError('Radiator requires positive emissivity and temperature higher than sink');
  }
  const heatFlux = inputs.surfaceEmissivity * STEFAN_BOLTZMANN
    * (inputs.radiatorTemperatureK ** 4 - inputs.effectiveSinkTemperatureK ** 4);
  return inputs.heatLoadW / heatFlux;
}

/** Solar heat absorbed by an illuminated surface, before reradiation. */
export function absorbedSolarHeatW(inputs: {
  sunlitAreaM2: number;
  absorptivity: number;
  incidenceCosine: number;
  distanceAu: number;
}): number {
  checkNonnegative('sunlitAreaM2', inputs.sunlitAreaM2);
  checkFraction('absorptivity', inputs.absorptivity);
  checkFraction('incidenceCosine', inputs.incidenceCosine);
  checkPositive('distanceAu', inputs.distanceAu);
  return SOLAR_IRRADIANCE_1AU_WM2 * inputs.sunlitAreaM2
    * inputs.absorptivity * inputs.incidenceCosine / inputs.distanceAu ** 2;
}

/**
 * Illustrative liquid spherical pressure-tank shell. NOT a design-code check.
 * p*r/(2*S) applies to an ideal thin-walled sphere under differential pressure.
 * Omits welds, joints, bosses, fatigue, pressure cycles, PMD, external loads,
 * proof/burst factors, liners, supports, buckling and cryogenic insulation.
 * Do not apply this model to compressed xenon or other non-liquid storage.
 */
export function idealLiquidSphericalTank(inputs: {
  propellantMassKg: number;
  liquidDensityKgM3: number;
  ullageFraction: number;
  differentialPressurePa: number;
  allowableMembraneStressPa: number;
  shellMaterialDensityKgM3: number;
}): {
  liquidVolumeM3: number;
  tankInternalVolumeM3: number;
  radiusM: number;
  idealWallThicknessM: number;
  idealShellMassKg: number;
  thinWallRatio: number;
  thinWallApproximationSuitable: boolean;
} {
  checkPositive('propellantMassKg', inputs.propellantMassKg);
  checkPositive('liquidDensityKgM3', inputs.liquidDensityKgM3);
  checkFraction('ullageFraction', inputs.ullageFraction, false);
  checkPositive('differentialPressurePa', inputs.differentialPressurePa);
  checkPositive('allowableMembraneStressPa', inputs.allowableMembraneStressPa);
  checkPositive('shellMaterialDensityKgM3', inputs.shellMaterialDensityKgM3);
  const liquidVolumeM3 = inputs.propellantMassKg / inputs.liquidDensityKgM3;
  const tankInternalVolumeM3 = liquidVolumeM3 / (1 - inputs.ullageFraction);
  const radiusM = Math.cbrt(3 * tankInternalVolumeM3 / (4 * Math.PI));
  const idealWallThicknessM = inputs.differentialPressurePa * radiusM
    / (2 * inputs.allowableMembraneStressPa);
  const idealShellMassKg = 4 * Math.PI * radiusM ** 2 * idealWallThicknessM
    * inputs.shellMaterialDensityKgM3;
  const thinWallRatio = idealWallThicknessM / radiusM;
  return {
    liquidVolumeM3,
    tankInternalVolumeM3,
    radiusM,
    idealWallThicknessM,
    idealShellMassKg,
    thinWallRatio,
    thinWallApproximationSuitable: thinWallRatio < 0.05,
  };
}
