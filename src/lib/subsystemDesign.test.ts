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
    expect(higherPressure.primaryMode.feedTank.membraneTminMm)
      .toBeGreaterThan(chemical.primaryMode.feedTank.membraneTminMm!);
    expect(higherPressure.tankWallMm).toBeGreaterThanOrEqual(chemical.tankWallMm!);
    expect(higherPressure.modeledWetMassKg).toBeGreaterThanOrEqual(chemical.modeledWetMassKg);
    expect(chemical.modeledWetMassKg - chemical.modeledDryMassKg).toBeCloseTo(base.propellantMassKg);
  });

  it('changes dry mass with different propellant acquisition device allowances', () => {
    const base = { ...DEFAULT_SUBSYSTEM_DESIGN, thrusterId: 'mono-reference' as const };
    const bellows = sizeSubsystemDesign({ ...base, tankType: 'bellows' });
    const capillary = sizeSubsystemDesign({ ...base, tankType: 'capillary' });
    expect(bellows.modeledDryMassKg).toBeGreaterThan(capillary.modeledDryMassKg);
  });

  it('uses different tank architectures for xenon gas and solid iodine', () => {
    const xenon=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,thrusterId:'busek-bht100'});
    const iodine=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,thrusterId:'busek-bit3'});
    expect(xenon.primaryMode.feedTank.kind).toBe('xenon');
    expect(xenon.tankShellMassKg).toBeGreaterThan(0);
    expect(xenon.primaryMode.feedTank.designPressureBar).toBe(180);
    expect(iodine.primaryMode.feedTank.kind).toBe('iodine');
    expect(iodine.tankWallMm).toBeNull();
    expect(iodine.primaryMode.feedTank.designPressureBar).toBeNull();
    expect(xenon.massEstimateIncomplete).toBe(true);
    expect(iodine.massEstimateIncomplete).toBe(true);
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

  it('more wings keep fixed cell area/power but increase controls and mounting mass', () => {
    const base=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,solarWingCount:2,radiatorPanelCount:2});
    const many=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,solarWingCount:8,radiatorPanelCount:6});
    expect(many.sunlightPowerW).toBeCloseTo(base.sunlightPowerW);
    expect(many.wingControlPowerW).toBeGreaterThan(base.wingControlPowerW);
    expect(many.radiatorControlPowerW).toBeGreaterThan(base.radiatorControlPowerW);
    expect(many.radiatorAreaM2!).toBeGreaterThan(base.radiatorAreaM2!);
    expect(many.arrayMassKg).toBeGreaterThan(base.arrayMassKg);
    expect(many.modeledDryMassKg).toBeGreaterThan(base.modeledDryMassKg);
  });

  it('dual propulsion carries two independent propellant stores and models sequential burns', () => {
    const single=sizeSubsystemDesign(DEFAULT_SUBSYSTEM_DESIGN);
    const dual=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,
      secondaryThrusterId:'mono-reference',secondaryThrusterCount:2,secondaryPropellantMassKg:3});
    expect(dual.tankReports).toHaveLength(2);
    expect(dual.secondaryMode?.kind).toBe('hydrazine');
    expect(dual.totalPropellantKg).toBe(8);
    expect(dual.modeledWetMassKg).toBeGreaterThan(single.modeledWetMassKg);
    expect(dual.idealDeltaVms).toBeGreaterThan(single.idealDeltaVms);
    expect(dual.propulsionPeakPowerW).toBeGreaterThan(0);
  });

  it('science instrument power and hardware automatically change housekeeping and thermal sizing', () => {
    const plain=sizeSubsystemDesign(DEFAULT_SUBSYSTEM_DESIGN);
    const camera=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,payloadInstrumentId:'hyperspectral'});
    expect(camera.instrumentMassKg).toBe(70);
    expect(camera.instrumentPowerW).toBe(240);
    expect(camera.housekeepingPowerW).toBeGreaterThan(plain.housekeepingPowerW);
    expect(camera.thermalLoadW).toBeGreaterThan(plain.thermalLoadW);
    expect(camera.modeledWetMassKg).toBeGreaterThan(plain.modeledWetMassKg);
    expect(camera.totalAvailablePowerW).toBeCloseTo(plain.totalAvailablePowerW);
  });

  it('rejects nonphysical values rather than reporting plausible mass estimates', () => {
    expect(() => sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, radiatorTemperatureK: -10 })).toThrow(RangeError);
    expect(() => sizeSubsystemDesign({ ...DEFAULT_SUBSYSTEM_DESIGN, propellantMassKg: 0 })).toThrow(RangeError);
  });
});
