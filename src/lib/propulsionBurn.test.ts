import {describe,it,expect} from 'vitest';
import {evaluatePropulsionBurn} from './propulsionBurn';
import {STANDARD_GRAVITY_MS2 as g0} from './nasaData';
const one={id:'one',name:'reference thruster',installedEngines:1,
 thrustPerEngineN:.02,ispSeconds:1500,propellantKg:5,busPowerPerEngineW:250};
describe('Finite burn physics: mass depletion / available engine operating points',()=>{
 it('uses F/(Isp*g0) as the exact propellant flow and Tsiolkovsky after mass depletion',()=>{
  const r=evaluatePropulsionBurn({initialWetMassKg:150,windowDays:5,
   powerBudgetW:250,dutyFraction:1,modes:[one]});
  const rate=.02/(1500*g0);
  const fuel=Math.min(5,rate*5*86400);
  expect(r.phases[0].activeMassFlowKgS).toBeCloseTo(rate,12);
  expect(r.burnedPropellantKg).toBeCloseTo(fuel,8);
  expect(r.wetMassAfterKg).toBeCloseTo(150-fuel,8);
  expect(r.deliveredDeltaVms).toBeCloseTo(1500*g0*Math.log(150/(150-fuel)),8);
  expect(r.samples[0].wetMassKg).toBe(150);
  expect(r.samples.at(-1)?.wetMassKg).toBeCloseTo(r.wetMassAfterKg,8);
  expect(r.phases[0].finalAccelerationMmS2).toBeGreaterThan(r.phases[0].initialAccelerationMmS2);
 });
 it('correctly distinguishes ideal Δv from finite power- and time-bounded Δv',()=>{
  const oneEngine=evaluatePropulsionBurn({initialWetMassKg:140,windowDays:5,
   powerBudgetW:250,dutyFraction:1,modes:[one]});
  const heavyEight=evaluatePropulsionBurn({initialWetMassKg:190,windowDays:5,
   powerBudgetW:250,dutyFraction:1,modes:[{...one,installedEngines:8}]});
  expect(heavyEight.idealDeltaVms).toBeLessThan(oneEngine.idealDeltaVms);
  expect(heavyEight.phases[0].activeEngines).toBe(1);
  expect(heavyEight.deliveredDeltaVms).toBeLessThan(oneEngine.deliveredDeltaVms);
  const fullyPowered=evaluatePropulsionBurn({initialWetMassKg:190,windowDays:5,
   powerBudgetW:2000,dutyFraction:1,modes:[{...one,installedEngines:8}]});
  expect(fullyPowered.phases[0].activeEngines).toBe(8);
  expect(fullyPowered.burnedPropellantKg).toBeGreaterThan(heavyEight.burnedPropellantKg);
 });
 it('does not give each sequential engine a fresh full mission time budget',()=>{
  const r=evaluatePropulsionBurn({initialWetMassKg:155,windowDays:10,
    powerBudgetW:500,dutyFraction:.85,modes:[one,{...one,id:'two'}]});
  expect(r.phases[0].elapsedCalendarDays+r.phases[1].elapsedCalendarDays).toBeLessThanOrEqual(10+1e-8);
  expect(r.burnedPropellantKg).toBeLessThanOrEqual(10);
  expect(r.wetMassAfterKg+r.burnedPropellantKg).toBeCloseTo(155);
  expect(r.idealDeltaVms).toBeGreaterThan(r.deliveredDeltaVms);
  expect(r.samples.every((v,i,a)=>i===0||v.wetMassKg<=a[i-1].wetMassKg)).toBe(true);
 });
 it('power-starved engine uses no propellant or Δv, not a fictitious fractional Isp',()=>{
  const r=evaluatePropulsionBurn({initialWetMassKg:150,windowDays:100,
    powerBudgetW:200,modes:[one]});
  expect(r.phases[0].activeEngines).toBe(0);
  expect(r.deliveredDeltaVms).toBe(0);
  expect(r.burnedPropellantKg).toBe(0);
  expect(r.remainingPropellantKg).toBe(5);
 });
});
