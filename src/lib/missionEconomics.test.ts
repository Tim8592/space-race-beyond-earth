import {describe,it,expect} from 'vitest';
import {DEFAULT_SUBSYSTEM_DESIGN,sizeSubsystemDesign} from './subsystemDesign';
import {spacecraftHardwareEconomics} from './missionEconomics';
describe('Nuclear cooling and research procurement',()=>{
  it('requires a dedicated hot radiator branch for real known SNAP-10A waste heat',()=>{
    const bare=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,
      powerSourceId:'snap10a',reactorRadiatorAreaM2:0});
    const cooled=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,
      powerSourceId:'snap10a',reactorRadiatorAreaM2:8});
    expect(bare.reactorHeatLoadW).toBeGreaterThan(30_000);
    expect(bare.reactorRadiatorCapacityW).toBe(0);
    expect(bare.reactorThermalMarginW).toBeLessThan(0);
    expect(cooled.reactorRadiatorCapacityW).toBeGreaterThan(bare.reactorRadiatorCapacityW);
    expect(cooled.reactorCoolingMassKg).toBeGreaterThan(0);
    expect(cooled.modeledWetMassKg).toBeGreaterThan(bare.modeledWetMassKg);
    expect(cooled.reactorThermalMarginW).toBeGreaterThan(bare.reactorThermalMarginW!);
  });
  it('unknown KRUSTY thermal inventory stays unknown, not a false zero-heat pass',()=>{
    const k=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,powerSourceId:'krusty',
      reactorRadiatorAreaM2:12});
    expect(k.reactorHeatLoadW).toBeNull();
    expect(k.reactorThermalMarginW).toBeNull();
    expect(k.warnings.some(w=>/UNKNOWN/.test(w))).toBe(true);
    expect(k.massEstimateIncomplete).toBe(true);
  });
  it('25 kWe imaginary reactor explicitly creates many kW of waste heat and large installed mass',()=>{
    const c=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,
      powerSourceId:'reactor-25kwe',reactorRadiatorAreaM2:8});
    expect(c.generatorElectricPowerW).toBe(25_000);
    expect(c.reactorHeatLoadW).toBe(65_000);
    expect(c.powerSystemMassKg).toBe(1200);
    expect(c.modeledWetMassKg).toBeGreaterThan(1200);
    expect(c.massEstimateIncomplete).toBe(true);
  });
  it('research discount reduces procurement but not engine thrust or hardware quantities',()=>{
    const a=spacecraftHardwareEconomics(DEFAULT_SUBSYSTEM_DESIGN,0);
    const b=spacecraftHardwareEconomics(DEFAULT_SUBSYSTEM_DESIGN,.12);
    expect(a.beforeDiscountUsd).toBeGreaterThan(0);
    expect(b.beforeDiscountUsd).toBe(a.beforeDiscountUsd);
    expect(b.afterDiscountUsd).toBeCloseTo(a.afterDiscountUsd*.88);
  });
});
