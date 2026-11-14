import { describe, expect, it } from 'vitest';
import {
  absorbedSolarHeatW, batteryMassForEclipseKg, idealBurnDurationSeconds,
  idealDeltaVms, idealLiquidSphericalTank, idealPropellantForDeltaVKg,
  massFlowKgPerSecond, minimumRadiatorAreaM2, solarArrayPowerW,
  sunlightPowerMarginW,
} from './spacecraftSystems';
import { BATTERY_PACKS, IN_SPACE_THRUSTERS, SOLAR_CELLS } from './spacecraftTechnology';

describe('NASA-source-based preliminary subsystem models', () => {
  it('solves rocket equation in both directions', () => {
    const propellant = idealPropellantForDeltaVKg(100, 1200, 1390);
    const deltaV = idealDeltaVms(100 + propellant, 100, 1390);
    expect(deltaV).toBeCloseTo(1200, 7);
  });
  it('makes low-thrust burn duration explicit', () => {
    const thruster = IN_SPACE_THRUSTERS.find(t => t.id === 'busek-bht200')!;
    expect(thruster.nominalThrustN).toBeCloseTo(0.013);
    const flow = massFlowKgPerSecond(thruster.nominalThrustN, thruster.nominalSpecificImpulseSeconds);
    expect(flow).toBeGreaterThan(0);
    expect(idealBurnDurationSeconds(1, thruster.nominalThrustN, thruster.nominalSpecificImpulseSeconds)).toBeGreaterThan(1_000_000);
  });
  it('sizes solar output with inverse square distance, not twice-counted cell ratings', () => {
    const cell = SOLAR_CELLS[0];
    const inputs = { cellAreaM2: 1, bolEfficiency: cell.efficiencyBOL, incidenceCosine: 1, userDeratingFactor: 1 };
    const earth = solarArrayPowerW({ ...inputs, distanceAu: 1 });
    const at2Au = solarArrayPowerW({ ...inputs, distanceAu: 2 });
    expect(earth).toBeCloseTo(1361.6 * 0.295, 5);
    expect(at2Au).toBeCloseTo(earth / 4, 5);
  });
  it('uses battery pack specific energy and power balance', () => {
    const b = BATTERY_PACKS[0];
    const mass = batteryMassForEclipseKg({
      eclipseLoadW: 120,
      eclipseHours: 0.5,
      packSpecificEnergyWhKg: b.specificEnergyWhKg,
      maxDepthOfDischarge: 0.8,
      dischargeEfficiency: 0.9,
    });
    expect(mass).toBeCloseTo(60 / (119.4 * 0.8 * 0.9), 7);
    expect(sunlightPowerMarginW(300, 200, 150)).toBe(-50);
  });
  it('scales thermal loading with area, absorptivity and temperature', () => {
    expect(absorbedSolarHeatW({
      sunlitAreaM2: 1,
      absorptivity: 0.1,
      incidenceCosine: 1,
      distanceAu: 1,
    })).toBeCloseTo(136.16, 5);
    const radiator = minimumRadiatorAreaM2({
      heatLoadW: 100,
      surfaceEmissivity: 0.85,
      radiatorTemperatureK: 300,
      effectiveSinkTemperatureK: 3,
    });
    expect(radiator).toBeGreaterThan(0);
    expect(minimumRadiatorAreaM2({
      heatLoadW: 200,
      surfaceEmissivity: 0.85,
      radiatorTemperatureK: 300,
      effectiveSinkTemperatureK: 3,
    })).toBeCloseTo(radiator * 2, 7);
  });
  it('sizes an idealized liquid tank with ullage and checks thin-wall applicability', () => {
    const tank = idealLiquidSphericalTank({
      propellantMassKg: 100,
      liquidDensityKgM3: 1000,
      ullageFraction: 0.05,
      differentialPressurePa: 1_000_000,
      allowableMembraneStressPa: 100_000_000,
      shellMaterialDensityKgM3: 2700,
    });
    expect(tank.liquidVolumeM3).toBeCloseTo(0.1, 8);
    expect(tank.tankInternalVolumeM3).toBeCloseTo(0.1 / 0.95, 8);
    expect(tank.idealShellMassKg).toBeGreaterThan(0);
    expect(tank.thinWallApproximationSuitable).toBe(true);
  });
  it('rejects non-physical inputs', () => {
    expect(() => solarArrayPowerW({
      cellAreaM2: 1, bolEfficiency: 1.2,
      distanceAu: 1, incidenceCosine: 1, userDeratingFactor: 1,
    })).toThrow(RangeError);
    expect(() => idealLiquidSphericalTank({
      propellantMassKg: 1, liquidDensityKgM3: 1000,
      ullageFraction: 1, differentialPressurePa: 1e6,
      allowableMembraneStressPa: 1e8, shellMaterialDensityKgM3: 2700,
    })).toThrow(RangeError);
  });
});
