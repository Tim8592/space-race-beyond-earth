import {
  BATTERY_PACKS, IN_SPACE_THRUSTERS, SOLAR_CELLS, THERMAL_SURFACES,
} from './spacecraftTechnology';
import {
  idealDeltaVms, idealBurnDurationSeconds, idealLiquidSphericalTank,
  solarArrayPowerW, batteryMassForEclipseKg,
} from './spacecraftSystems';

/** All example design choices here are preliminary and not flight qualification. */
export type SubsystemDesign = {
  thrusterId: 'mono-reference' | 'busek-bht100' | 'busek-bht200' | 'busek-bit3';
  solarCellId: string;
  batteryPackId: string;
  coatingId: string;
  distanceAu: number;
  cellAreaM2: number;
  propellantMassKg: number;
  busDryMassKg: number;
  payloadMassKg: number;
  busElectricalPowerW: number;
  eclipseHours: number;
  liquidDensityKgM3: number;
  tankPressureBar: number;
  tankAllowableStressMpa: number;
  tankMetalDensityKgM3: number;
  tankType: 'diaphragm' | 'bellows' | 'capillary';
  infraredEmissivity: number;
  radiatorTemperatureK: number;
  radiatorSunIncidence: number;
};

export const DEFAULT_SUBSYSTEM_DESIGN: SubsystemDesign = {
  thrusterId: 'busek-bht200',
  solarCellId: 'azur-3g30',
  batteryPackId: 'aac-optimus',
  coatingId: 'gsfc-silver',
  distanceAu: 1,
  cellAreaM2: 4,
  propellantMassKg: 5,
  busDryMassKg: 100,
  payloadMassKg: 20,
  busElectricalPowerW: 90,
  eclipseHours: 0.6,
  liquidDensityKgM3: 1000,
  tankPressureBar: 20,
  tankAllowableStressMpa: 150,
  tankMetalDensityKgM3: 2700,
  tankType: 'diaphragm',
  infraredEmissivity: 0.85,
  radiatorTemperatureK: 300,
  radiatorSunIncidence: 0.2,
};

export const DESTINATIONS = [
  { name: 'Earth region', distanceAu: 1 },
  { name: 'Mars region', distanceAu: 1.52 },
  { name: 'Main asteroid belt', distanceAu: 2.7 },
  { name: 'Jupiter region', distanceAu: 5.2 },
  { name: 'Pluto region', distanceAu: 39.5 },
] as const;

export type SystemResults = {
  isElectric: boolean;
  engineName: string;
  engineSourceUrl: string;
  engineSpecificImpulseS: number;
  engineThrustN: number;
  nominalThrusterPowerW: number;
  totalElectricalDemandW: number;
  sunlightPowerW: number;
  sunlightMarginW: number;
  canPowerThruster: boolean;
  batteryMassKg: number;
  storedBatteryEnergyWh: number;
  thermalLoadW: number;
  radiatorAreaM2: number | null;
  radiatorMassKg: number | null;
  absorbedSolarFluxWm2: number;
  radiatorNetFluxWm2: number;
  tankShellMassKg: number | null;
  tankInternalVolumeL: number | null;
  tankRadiusM: number | null;
  tankWallMm: number | null;
  tankTypeAllowanceKg: number;
  tankThinWallSuitable: boolean | null;
  modeledDryMassKg: number;
  modeledWetMassKg: number;
  idealDeltaVms: number;
  idealBurnDays: number;
  lowThrustAccelerationMmS2: number;
  massEstimateIncomplete: boolean;
  warnings: string[];
};

const BOL_ARRAY_DERATE = 0.75; // Illustrative array-level electronics, temperature and aging allowance
const DOD = 0.8; // Illustrative max usable battery fraction
const DISCHARGE_EFFICIENCY = 0.9; // Illustrative battery discharge efficiency
const ARRAY_AREAL_MASS_KGM2 = 2.5; // Illustrative, not NASA-sourced
const RADIATOR_AREAL_MASS_KGM2 = 4; // Illustrative, not NASA-sourced
const PPU_EFFICIENCY = 0.88; // Illustrative electrical processing efficiency
const ELECTRIC_SYSTEM_ALLOWANCE_KG = 6; // Illustrative PPU and plumbing allocation, excludes high-pressure xenon storage
const CHEMICAL_COMPONENT_MASS_KG = 3; // Illustrative small thruster/valves mass
const CHEMICAL_VALVE_POWER_W = 8; // Illustrative electrical valve power
const STEFAN_BOLTZMANN = 5.670374419e-8;
const SOLAR_IRRADIANCE = 1361.6;

export function sizeSubsystemDesign(design: SubsystemDesign): SystemResults {
  const { thrusterId } = design;
  const isElectric = thrusterId !== 'mono-reference';
  const realThruster = IN_SPACE_THRUSTERS.find(t => t.id === thrusterId);
  const cell = SOLAR_CELLS.find(c => c.id === design.solarCellId);
  const battery = BATTERY_PACKS.find(b => b.id === design.batteryPackId);
  const coating = THERMAL_SURFACES.find(c => c.id === design.coatingId);
  if (!cell || !battery || !coating || (isElectric && !realThruster)) {
    throw new Error('Unknown spacecraft technology selected');
  }
  const inputNumbers = [
    design.distanceAu, design.cellAreaM2, design.propellantMassKg,
    design.busDryMassKg, design.payloadMassKg, design.busElectricalPowerW,
    design.eclipseHours, design.liquidDensityKgM3, design.tankPressureBar,
    design.tankAllowableStressMpa, design.tankMetalDensityKgM3,
    design.infraredEmissivity, design.radiatorTemperatureK, design.radiatorSunIncidence,
  ];
  if (inputNumbers.some(n => !Number.isFinite(n)) || design.distanceAu <= 0 ||
      design.busDryMassKg <= 0 || design.cellAreaM2 < 0 || design.propellantMassKg <= 0 ||
      design.payloadMassKg < 0 || design.busElectricalPowerW < 0 || design.eclipseHours < 0 ||
      design.infraredEmissivity <= 0 || design.infraredEmissivity > 1 ||
      design.radiatorSunIncidence < 0 || design.radiatorSunIncidence > 1 ||
      design.radiatorTemperatureK <= 0) {
    throw new RangeError('Spacecraft design contains nonphysical inputs');
  }

  const engineName = realThruster?.name ?? 'Illustrative 1 N monopropellant';
  const engineSpecificImpulseS = realThruster?.nominalSpecificImpulseSeconds ?? 230;
  const engineThrustN = realThruster?.nominalThrustN ?? 1;
  const nominalThrusterPowerW = realThruster?.nominalThrusterPowerW ?? 0;
  const propulsionElectronicsW = isElectric
    ? nominalThrusterPowerW / PPU_EFFICIENCY : CHEMICAL_VALVE_POWER_W;
  const totalElectricalDemandW = design.busElectricalPowerW + propulsionElectronicsW;
  const sunlightPowerW = solarArrayPowerW({
    cellAreaM2: design.cellAreaM2,
    bolEfficiency: cell.efficiencyBOL,
    distanceAu: design.distanceAu,
    incidenceCosine: 1,
    userDeratingFactor: BOL_ARRAY_DERATE,
  });
  const sunlightMarginW = sunlightPowerW - totalElectricalDemandW;
  const canPowerThruster = sunlightMarginW >= 0;

  const batteryMassKg = batteryMassForEclipseKg({
    eclipseLoadW: design.busElectricalPowerW,
    eclipseHours: design.eclipseHours,
    packSpecificEnergyWhKg: battery.specificEnergyWhKg,
    maxDepthOfDischarge: DOD,
    dischargeEfficiency: DISCHARGE_EFFICIENCY,
  });
  const storedBatteryEnergyWh = batteryMassKg * battery.specificEnergyWhKg;

  // Thermal input: bus power is treated as dissipated heat, and the
  // PPU losses as heat. 10% of the rated thruster input is an illustrative
  // heat-coupling allowance, not a sourced device thermal measurement.
  const propulsionHeatW = isElectric
    ? propulsionElectronicsW - nominalThrusterPowerW + 0.1 * nominalThrusterPowerW
    : CHEMICAL_VALVE_POWER_W;
  const thermalLoadW = design.busElectricalPowerW + propulsionHeatW;
  const solarFluxWm2 = SOLAR_IRRADIANCE / design.distanceAu ** 2;
  const absorbedSolarFluxWm2 =
    solarFluxWm2 * coating.solarAbsorptivityBOL * design.radiatorSunIncidence;
  const radiatorNetFluxWm2 =
    design.infraredEmissivity * STEFAN_BOLTZMANN * (design.radiatorTemperatureK ** 4 - 3 ** 4)
    - absorbedSolarFluxWm2;
  const radiatorAreaM2 = radiatorNetFluxWm2 > 0
    ? thermalLoadW / radiatorNetFluxWm2 : null;
  const radiatorMassKg = radiatorAreaM2 === null ? null
    : radiatorAreaM2 * RADIATOR_AREAL_MASS_KGM2;

  let tankShellMassKg: number | null = null;
  let tankInternalVolumeL: number | null = null;
  let tankRadiusM: number | null = null;
  let tankWallMm: number | null = null;
  let tankThinWallSuitable: boolean | null = null;
  let tankTypeAllowanceKg = 0;
  const warnings: string[] = [];
  const massEstimateIncomplete = isElectric || radiatorMassKg === null;
  if (!isElectric) {
    const tank = idealLiquidSphericalTank({
      propellantMassKg: design.propellantMassKg,
      liquidDensityKgM3: design.liquidDensityKgM3,
      ullageFraction: 0.05, // user-independent illustrative ullage assumption
      differentialPressurePa: design.tankPressureBar * 100_000,
      allowableMembraneStressPa: design.tankAllowableStressMpa * 1_000_000,
      shellMaterialDensityKgM3: design.tankMetalDensityKgM3,
    });
    tankShellMassKg = tank.idealShellMassKg;
    tankInternalVolumeL = tank.tankInternalVolumeM3 * 1000;
    tankRadiusM = tank.radiusM;
    tankWallMm = tank.idealWallThicknessM * 1000;
    tankThinWallSuitable = tank.thinWallApproximationSuitable;
    tankTypeAllowanceKg = design.tankType === 'bellows' ? 1.5 :
      design.tankType === 'diaphragm' ? 1 : 0.5; // Illustrative PMD assembly masses
    if (!tank.thinWallApproximationSuitable) {
      warnings.push('Tank wall is outside the thin-shell approximation: pressure-vessel sizing is invalid.');
    }
    warnings.push('Liquid tank calculation is a theoretical shell estimate; verify pressure factors, gas ingestion prevention, cryogenic behavior and supports.');
  } else {
    warnings.push(
      thrusterId === 'busek-bit3'
        ? 'BIT-3 mass reported by NASA is integrated WET mass; omitted from dry roll-up to avoid double-counting. Full dry mass is unknown.'
        : 'Compressed-gas xenon tank/feed mass is unmodeled. Shown wet/dry masses are partial estimates, not verified launch mass estimates.'
    );
  }
  if (!canPowerThruster) warnings.push('Insufficient simultaneous sunlight power: selected thruster cannot fire at its rated point here.');
  if (radiatorAreaM2 === null) warnings.push('Net radiator heat flux is non-positive at this orientation and temperature; thermal rejection fails.');
  if (design.distanceAu >= 5) warnings.push('Far from the Sun, array power falls as 1/r². Consider a different power architecture (RTG/fission not yet modeled).');

  const thrusterHardwareMassKg = !isElectric
    ? CHEMICAL_COMPONENT_MASS_KG
    : realThruster!.massScope === 'thruster-only' ? (realThruster!.reportedMassKg ?? 0) : 0;
  const systemAllowanceKg = isElectric ? ELECTRIC_SYSTEM_ALLOWANCE_KG : 0;
  const modeledDryMassKg = design.busDryMassKg + design.payloadMassKg
    + design.cellAreaM2 * ARRAY_AREAL_MASS_KGM2
    + batteryMassKg + (radiatorMassKg ?? 0)
    + thrusterHardwareMassKg + systemAllowanceKg
    + (tankShellMassKg ?? 0) + tankTypeAllowanceKg;
  const modeledWetMassKg = modeledDryMassKg + design.propellantMassKg;
  const idealDeltaV = idealDeltaVms(modeledWetMassKg, modeledDryMassKg, engineSpecificImpulseS);
  const idealBurnSeconds = idealBurnDurationSeconds(
    design.propellantMassKg, engineThrustN, engineSpecificImpulseS,
  );

  return {
    isElectric, engineName,
    engineSourceUrl: realThruster?.source.url ?? 'https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/',
    engineSpecificImpulseS, engineThrustN, nominalThrusterPowerW,
    totalElectricalDemandW, sunlightPowerW, sunlightMarginW, canPowerThruster,
    batteryMassKg, storedBatteryEnergyWh, thermalLoadW, radiatorAreaM2,
    radiatorMassKg, absorbedSolarFluxWm2, radiatorNetFluxWm2,
    tankShellMassKg, tankInternalVolumeL, tankRadiusM, tankWallMm,
    tankTypeAllowanceKg, tankThinWallSuitable,
    modeledDryMassKg, modeledWetMassKg,
    idealDeltaVms: idealDeltaV, idealBurnDays: idealBurnSeconds / 86400,
    lowThrustAccelerationMmS2: engineThrustN / modeledWetMassKg * 1000,
    massEstimateIncomplete, warnings,
  };
}
