import { describe, expect, it } from 'vitest';
import { DEFAULT_SUBSYSTEM_DESIGN, sizeSubsystemDesign } from './subsystemDesign';

describe('coupled in-space spacecraft engineering', () => {
  it('links Hall thruster load to solar array power and surface distance', () => {
    const earth = sizeSubsystemDesign(DEFAULT_SUBSYSTEM_DESIGN);
    const pluto = sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, distanceAu: 39.5 });
    expect(earth.isElectric).toBe(true);
    expect(earth.canPowerThruster).toBe(true);
    expect(pluto.sunlightPowerW).toBeCloseTo(earth.sunlightPowerW / 39.5 ** 2, 7);
    expect(pluto.canPowerThruster).toBe(false);
    expect(pluto.sunlightMarginW).toBeLessThan(0);
  });

  it('reflects added solar array mass in the spacecraft wet mass and delta V', () => {
    const small = sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, cellAreaM2: 1 });
    const large = sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, cellAreaM2: 15 });
    expect(large.sunlightPowerW).toBeGreaterThan(small.sunlightPowerW);
    expect(large.modeledWetMassKg).toBeGreaterThan(small.modeledWetMassKg);
    expect(large.idealDeltaVms).toBeLessThan(small.idealDeltaVms);
  });

  it('links propulsion power to PPU waste heat and radiator area', () => {
    const lower = sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, thrusterId: 'busek-bht100' });
    const higher = sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, thrusterId: 'busek-bht200' });
    expect(higher.totalElectricalDemandW).toBeGreaterThan(lower.totalElectricalDemandW);
    expect(higher.thermalLoadW).toBeGreaterThan(lower.thermalLoadW);
    expect(higher.radiatorAreaM2!).toBeGreaterThan(lower.radiatorAreaM2!);
  });

  it('includes both propellant and preliminary physical liquid tank mass', () => {
    const base = { ...DEFAULT_SUBSYSTEM_DESIGN, thrusterId: 'mono-reference' as const };
    const chemical = sizeSubsystemDesign(base);
    const higherPressure = sizeSubsystemDesign({ ...base, tankPressureBar: base.tankPressureBar * 2 });
    expect(chemical.isElectric).toBe(false);
    expect(chemical.tankInternalVolumeL).toBeGreaterThan(0);
    expect(chemical.tankShellMassKg).toBeGreaterThan(0);
    expect(higherPressure.tankWallMm).toBeCloseTo(chemical.tankWallMm! * 2, 6);
    expect(higherPressure.tankShellMassKg).toBeCloseTo(chemical.tankShellMassKg! * 2, 6);
    expect(higherPressure.modeledWetMassKg).toBeGreaterThan(chemical.modeledWetMassKg);
    expect(chemical.modeledWetMassKg - chemical.modeledDryMassKg).toBeCloseTo(base.propellantMassKg);
  });

  it('changes dry mass with different propellant acquisition device allowances', () => {
    const base = { ...DEFAULT_SUBSYSTEM_DESIGN, thrusterId: 'mono-reference' as const };
    const bellows = sizeSubsystemDesign({ ...base, tankType: 'bellows' });
    const capillary = sizeSubsystemDesign({ ...base, tankType: 'capillary' });
    expect(bellows.modeledDryMassKg).toBeGreaterThan(capillary.modeledDryMassKg);
  });

  it('does not incorrectly reuse liquid tank sizing for compressed xenon or iodine', () => {
    for (const thrusterId of ['busek-bht100', 'busek-bit3'] as const) {
      const results = sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, thrusterId });
      expect(results.tankShellMassKg).toBeNull();
      expect(results.massEstimateIncomplete).toBe(true);
      expect(results.warnings.some(w => /unmodeled|omitted/i.test(w))).toBe(true);
    }
  });

  it('lets multiple RTGs supply electric thrusters far from the Sun, at a substantial mass cost', () => {
    const solar = sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, distanceAu: 39.5 });
    const nuclear = sizeSubsystemDesign({
      ...DEFAULT_SUBSYSTEM_DESIGN,
      distanceAu: 39.5, cellAreaM2: 0, powerSourceId: 'mmrtg', powerSourceCount: 4,
    });
    expect(solar.canPowerThruster).toBe(false);
    expect(nuclear.canPowerThruster).toBe(true);
    expect(nuclear.generatorElectricPowerW).toBe(440);
    expect(nuclear.powerSystemMassKg).toBe(180);
    expect(nuclear.modeledDryMassKg).toBeGreaterThan(solar.modeledDryMassKg);
    expect(nuclear.idealDeltaVms).toBeLessThan(solar.idealDeltaVms);
  });

  it('keeps radioisotope generator waste heat separate from the spacecraft radiator', () => {
    const solar = sizeSubsystemDesign(DEFAULT_SUBSYSTEM_DESIGN);
    const nuclear = sizeSubsystemDesign({
      ...DEFAULT_SUBSYSTEM_DESIGN, powerSourceId: 'mmrtg', powerSourceCount: 1,
    });
    expect(nuclear.powerSystemWasteHeatW).toBeGreaterThan(1000);
    expect(nuclear.thermalLoadW).toBeCloseTo(solar.thermalLoadW);
    expect(nuclear.warnings.some(w => w.includes('Dedicated source heat rejection'))).toBe(true);
  });

  it('counts simultaneous thrusters in power, thrust, burn time and dry mass', () => {
    const one = sizeSubsystemDesign(DEFAULT_SUBSYSTEM_DESIGN);
    const four = sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN, thrusterCount:4, cellAreaM2:20});
    expect(four.engineThrustN).toBeCloseTo(one.engineThrustN*4);
    expect(four.nominalThrusterPowerW).toBeCloseTo(one.nominalThrusterPowerW*4);
    expect(four.idealBurnDays).toBeCloseTo(one.idealBurnDays/4);
    expect(four.modeledDryMassKg).toBeGreaterThan(one.modeledDryMassKg);
  });

  it('wing and radiator counts change display and mount mass, not total area or generation', () => {
    const base = sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN, solarWingCount:2, radiatorPanelCount:2});
    const many = sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN, solarWingCount:8, radiatorPanelCount:6});
    expect(many.sunlightPowerW).toBeCloseTo(base.sunlightPowerW);
    expect(many.radiatorAreaM2).toBeCloseTo(base.radiatorAreaM2!);
    expect(many.modeledDryMassKg).toBeGreaterThan(base.modeledDryMassKg);
  });

  it('rejects nonphysical values rather than reporting plausible mass estimates', () => {
    expect(() => sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, radiatorTemperatureK: -10 })).toThrow(RangeError);
    expect(() => sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, propellantMassKg: 0 })).toThrow(RangeError);
  });
});
