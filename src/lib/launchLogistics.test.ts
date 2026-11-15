import {describe,it,expect} from 'vitest';
import {INITIAL_VEHICLE} from './engineering';
import {customLeoCapacityKg,flightService,planLaunchManifest,
  planMoonShipment,moonCargoRequirement,CANADIAN_ROCKET_GENERATIONS,
  canadianProgramReadiness,ORBITAL_ASSEMBLY_UPGRADE_USD,FLEET_UPGRADES} from './launchLogistics';
const args={vehicle:INITIAL_VEHICLE,tier:1,assemblyUnlocked:false,priorFlights:0};
describe('Canadian preset rocket roadmap, launch logistics and lunar freight',()=>{
 it('manual saved Vehicle payload edits cannot change preset launch capacity or price',()=>{
  expect(customLeoCapacityKg(INITIAL_VEHICLE)).toBeGreaterThan(1000);
  const first=flightService({service:'custom',...args,tier:0});
  const fake=flightService({service:'custom',...args,tier:0,
    vehicle:{...INITIAL_VEHICLE,payloadMassKg:1e9,dryMassKg:1,propellantMassKg:1e9}});
  expect(first.capacityKg).toBe(220);
  expect(fake.capacityKg).toBe(first.capacityKg);
  expect(fake.costUsd).toBe(first.costUsd);
  expect(CANADIAN_ROCKET_GENERATIONS.map(x=>x.leoCapacityKg)).toEqual([220,1100,6000,10000]);
 });
 it('requires multiple actual charged rockets and docking when mass exceeds a generation',()=>{
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
 it('only completed Canadian flights reduce domestic prices and accelerate maturity',()=>{
  const old=flightService({service:'custom',vehicle:INITIAL_VEHICLE,tier:0,priorFlights:0,canadianSuccesses:0});
  const successful=flightService({service:'custom',vehicle:INITIAL_VEHICLE,tier:0,priorFlights:7,canadianSuccesses:4});
  expect(successful.costUsd).toBeLessThan(old.costUsd);
  expect(successful.capacityKg).toBe(old.capacityKg);
  const bigger=flightService({service:'custom',vehicle:INITIAL_VEHICLE,tier:2,priorFlights:7,canadianSuccesses:4});
  expect(bigger.capacityKg).toBeGreaterThan(old.capacityKg);
  const spaceX=flightService({service:'falcon9',vehicle:INITIAL_VEHICLE,tier:0,priorFlights:0,canadianSuccesses:0});
  const spaceXAfter=flightService({service:'falcon9',vehicle:INITIAL_VEHICLE,tier:3,priorFlights:100,canadianSuccesses:50});
  expect(spaceXAfter.costUsd).toBe(spaceX.costUsd);
  expect(spaceXAfter.capacityKg).toBe(spaceX.capacityKg);
  expect(FLEET_UPGRADES).toHaveLength(3);
  expect(flightService({service:'starship',vehicle:INITIAL_VEHICLE,tier:0,priorFlights:0}).available).toBe(true);
 });
 it('rocket generations require real tech-tree branch research, calendar maturation and Canadian heritage',()=>{
  const blocked=canadianProgramReadiness({tier:0,day:1,canadianSuccesses:0,researchUnlocked:[]});
  expect(blocked.ready).toBe(false);
  expect(blocked.requiredTechnology).toBe('canadian-light-lift');
  const researched=canadianProgramReadiness({tier:0,day:1,canadianSuccesses:0,researchUnlocked:['canadian-light-lift']});
  expect(researched.ready).toBe(false);
  expect(researched.timeReady).toBe(false);
  const experienced=canadianProgramReadiness({tier:0,day:9,canadianSuccesses:1,researchUnlocked:['canadian-light-lift']});
  expect(experienced.ready).toBe(true);
  const spaceXNoCredit=canadianProgramReadiness({tier:1,day:200,canadianSuccesses:0,
    researchUnlocked:['canadian-light-lift','canadian-medium-lift']});
  expect(spaceXNoCredit.ready).toBe(false);
  expect(spaceXNoCredit.heritageReady).toBe(false);
  expect(canadianProgramReadiness({tier:1,day:1,canadianSuccesses:0,researchUnlocked:[],devMode:true}).ready).toBe(true);
 });
 it('requires an actual lunar descent system with fuel and separate rocket launches',()=>{
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
