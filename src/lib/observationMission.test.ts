import {describe,expect,it} from 'vitest';
import { INITIAL_VEHICLE } from './engineering';
import { DEFAULT_SUBSYSTEM_DESIGN } from './subsystemDesign';
import {
  DEFAULT_OBSERVATION, INSTRUMENTS, SCIENCE_GOAL, OBSERVATION_DAYS,
  observationPreview, simulateObservation, type ObservationConfig,
} from './observationMission';

function mission(patch:Partial<ObservationConfig>={}):ObservationConfig{
  return {choices:DEFAULT_OBSERVATION,spacecraft:DEFAULT_SUBSYSTEM_DESIGN,
    launcher:INITIAL_VEHICLE,completedWithEngine:0,...patch};
}
describe('Earth Observation One integrated physical and gameplay constraints',()=>{
  it('default full mission can deliver at least the science objective',()=>{
    const result=simulateObservation(mission());
    expect(result.preview.launchReady).toBe(true);
    expect(result.days).toHaveLength(OBSERVATION_DAYS);
    expect(result.scienceReturned).toBeGreaterThanOrEqual(SCIENCE_GOAL);
    expect(result.successful).toBe(true);
    expect(result.preview.capacities).toHaveLength(6);
  });
  it('selected science instrument replaces generic payload slot, without double-counting',()=>{
    const a=observationPreview(mission());
    const b=observationPreview(mission({
      spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,payloadMassKg:700},
    }));
    expect(a.massKg).toBeCloseTo(b.massKg);
    expect(a.missionResult.modeledWetMassKg).toBeCloseTo(b.missionResult.modeledWetMassKg);
    expect(a.missionResult.modeledWetMassKg).toBeGreaterThan(INSTRUMENTS.multispectral.massKg);
  });
  it('more solar cells improve imaging power and count toward spacecraft mass',()=>{
    const poor=observationPreview(mission({spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,cellAreaM2:0}}));
    const healthy=observationPreview(mission());
    expect(poor.powerCapacityW).toBeLessThan(healthy.powerCapacityW);
    expect(poor.effectPower).toBeLessThan(healthy.effectPower);
    expect(healthy.massKg).toBeGreaterThan(poor.massKg);
  });
  it('insufficient radiator capacity reduces returned science',()=>{
    const noUpgrade=simulateObservation(mission({
      choices:{...DEFAULT_OBSERVATION,radiatorExtraAreaM2:0},
    }));
    const upgraded=simulateObservation(mission());
    expect(noUpgrade.preview.thermalCapacityW).toBeLessThan(upgraded.preview.thermalCapacityW);
    expect(noUpgrade.scienceReturned).toBeLessThan(upgraded.scienceReturned);
  });
  it('limited downlink returns less science than a capable radio',()=>{
    const low=simulateObservation(mission({choices:{...DEFAULT_OBSERVATION,radio:'uhf'}}));
    const high=simulateObservation(mission({choices:{...DEFAULT_OBSERVATION,radio:'xband'}}));
    expect(low.totalDeliveredMb).toBeLessThan(high.totalDeliveredMb);
    expect(low.scienceReturned).toBeLessThan(high.scienceReturned);
    expect(low.successful).toBe(false);
  });
  it('too-small allocated launch slot blocks launch even when power is ample',()=>{
    const p=observationPreview(mission({choices:{...DEFAULT_OBSERVATION,launchSlotKg:140}}));
    expect(p.launchReady).toBe(false);
    expect(p.massKg).toBeGreaterThan(p.launchCapacityKg);
  });
  it('additional battery capacity improves eclipse margin without creating energy',()=>{
    const weak=observationPreview(mission({
      choices:{...DEFAULT_OBSERVATION,batteryExtraWh:0},
      spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,eclipseHours:.1},
    }));
    const strong=observationPreview(mission());
    expect(weak.effectEclipse).toBeLessThan(strong.effectEclipse);
    expect(weak.batteryUsableWh).toBeLessThan(strong.batteryUsableWh);
    expect(weak.powerCapacityW).toBeCloseTo(strong.powerCapacityW);
  });
  it('seven-day downlink balances generated, lost and stored data',()=>{
    const r=simulateObservation(mission({
      choices:{...DEFAULT_OBSERVATION,instrument:'hyperspectral',radio:'uhf',storage:'4gb',dutyFraction:1,radiatorExtraAreaM2:2.5},
    }));
    let carry=0;
    for(const day of r.days){
      expect(day.generatedMb+carry).toBeCloseTo(day.lostMb+day.deliveredMb+day.bufferedMb,3);
      carry=day.bufferedMb;
      expect(day.bufferedMb).toBeLessThanOrEqual(r.preview.bufferMb+1e-8);
    }
  });
});
