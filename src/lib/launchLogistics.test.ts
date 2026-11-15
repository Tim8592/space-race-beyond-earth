import {describe,it,expect} from 'vitest';
import {INITIAL_VEHICLE} from './engineering';
import {customLeoCapacityKg,flightService,planLaunchManifest,
  planMoonShipment,moonCargoRequirement,ORBITAL_ASSEMBLY_UPGRADE_USD,FLEET_UPGRADES} from './launchLogistics';
const args={vehicle:INITIAL_VEHICLE,tier:0,assemblyUnlocked:false,priorFlights:0};
describe('Launch logistics and actual orbit-to-Moon delivery',()=>{
 it('launch service is physically constrained by mass/rocket, not an arbitrary checkout box',()=>{
  expect(customLeoCapacityKg(INITIAL_VEHICLE)).toBeGreaterThan(1000);
  const mass=3500;
  const plan=planLaunchManifest({...args,service:'custom',totalWetKg:mass});
  expect(plan.flightsRequired).toBeGreaterThan(1);
  expect(plan.feasible).toBe(false);
  expect(plan.issue).toContain('Orbital assembly');
  expect(plan.manifestWetKg).toBeGreaterThan(mass);
  const fixed=planLaunchManifest({...args,service:'custom',totalWetKg:mass,assemblyUnlocked:true});
  expect(fixed.feasible).toBe(true);
  expect(fixed.flights.reduce((s,v)=>s+v.massKg,0)).toBeCloseTo(fixed.manifestWetKg);
  expect(fixed.flights.every(f=>f.massKg<=f.capacityKg+1e-6)).toBe(true);
  expect(fixed.launchCostUsd).toBeGreaterThan(fixed.flights[0].serviceCostUsd);
  expect(fixed.assemblyCostUsd).toBeGreaterThan(0);
  expect(ORBITAL_ASSEMBLY_UPGRADE_USD).toBeGreaterThan(0);
 });
 it('fleet upgrades and repeated launches reduce real launch spending without changing spacecraft mass',()=>{
  const old=flightService({service:'falcon9',vehicle:INITIAL_VEHICLE,tier:0,priorFlights:0});
  const better=flightService({service:'falcon9',vehicle:INITIAL_VEHICLE,tier:2,priorFlights:7});
  expect(better.costUsd).toBeLessThan(old.costUsd);
  expect(better.capacityKg).toBeGreaterThan(old.capacityKg);
  expect(FLEET_UPGRADES).toHaveLength(3);
  expect(flightService({service:'starship',vehicle:INITIAL_VEHICLE,tier:0,priorFlights:0}).available).toBe(false);
  expect(flightService({service:'starship',vehicle:INITIAL_VEHICLE,tier:3,priorFlights:0}).available).toBe(true);
 });
 it('requires an actual lunar descent system with fuel mass for each surface payload',()=>{
  const req=moonCargoRequirement(0);
  expect(req.payloadKg).toBe(450);
  expect(req.propellantKg).toBeGreaterThan(req.payloadKg);
  expect(req.leoManifestKg).toBeGreaterThan(req.propellantKg+req.payloadKg);
  const noDock=planMoonShipment({...args,stageIndex:0,service:'custom'});
  expect(noDock.manifest.feasible).toBe(false);
  const withDock=planMoonShipment({...args,stageIndex:0,service:'custom',assemblyUnlocked:true});
  expect(withDock.manifest.feasible).toBe(true);
  expect(withDock.totalCostUsd).toBeGreaterThan(withDock.manifest.launchCostUsd);
  expect(planMoonShipment({...args,stageIndex:2,service:'starship',tier:3}).manifest.flightsRequired).toBe(1);
 });
});
