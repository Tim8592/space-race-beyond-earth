import {describe,it,expect} from 'vitest';
import {DEFAULT_SUBSYSTEM_DESIGN,sizeSubsystemDesign} from './subsystemDesign';
import {INITIAL_VEHICLE} from './engineering';
import {ORBITAL_SERVICE_MODULES} from './orbitalServiceModules';
import {EMPTY_ORBITAL_NETWORKS,ORBITAL_NETWORK_STAGES,networkEconomics,
  networkSatellites,planNetworkDeployment} from './orbitalNetworks';
import {dailyEconomics,advanceProgramDay} from './programEconomy';
const qualified={...DEFAULT_SUBSYSTEM_DESIGN,orbitalServiceModuleId:'compute' as const,
  cellAreaM2:17,installedRadiatorAreaM2:5,solarWingCount:4,eclipseHours:.7};
const base={kind:'compute' as const,levels:EMPTY_ORBITAL_NETWORKS,
 design:qualified,launcher:INITIAL_VEHICLE,service:'falcon9' as const,
 tier:0,assemblyUnlocked:false,priorServiceFlights:0,canadianSuccesses:0,
 researched:['orbital-edge-compute','canadian-optical-relay'] as const};
describe('Real orbit hardware is a prerequisite for new recurring revenues',()=>{
 it('compute board changes dry/wet launch mass and power/heat, not just UI text',()=>{
  const without=sizeSubsystemDesign({...qualified,orbitalServiceModuleId:'none'});
  const withModule=sizeSubsystemDesign(qualified);
  expect(withModule.orbitalServiceMassKg).toBe(75);
  expect(withModule.orbitalServicePowerW).toBe(550);
  expect(withModule.orbitalServiceHeatW).toBe(495);
  expect(withModule.modeledWetMassKg).toBeGreaterThan(without.modeledWetMassKg);
  expect(withModule.housekeepingPowerW).toBeGreaterThan(without.housekeepingPowerW);
  expect(withModule.thermalLoadW).toBeGreaterThan(without.thermalLoadW);
  expect(ORBITAL_SERVICE_MODULES.compute.costUsd).toBeGreaterThan(0);
 });
 it('orbital service is locked without permanent cash + research-point R&D investment',()=>{
   const blocked=planNetworkDeployment({...base,researched:[]})!;
   expect(blocked.feasible).toBe(false);
   expect(blocked.checks.find(x=>x.name.includes('Infrastructure R&D'))?.passed).toBe(false);
   expect(planNetworkDeployment({...base,researched:[],devMode:true})!
     .checks.find(x=>x.name.includes('Infrastructure R&D'))?.passed).toBe(true);
 });
 it('no matching hardware and insufficient radiator or solar generation block deployments',()=>{
  const missing=planNetworkDeployment({...base,design:{...qualified,orbitalServiceModuleId:'none'}})!;
  const hot=planNetworkDeployment({...base,design:{...qualified,installedRadiatorAreaM2:.15}})!;
  const dark=planNetworkDeployment({...base,design:{...qualified,cellAreaM2:0}})!;
  expect(missing.feasible).toBe(false);
  expect(missing.checks.find(x=>x.name.includes('Correct installed'))?.passed).toBe(false);
  expect(hot.feasible).toBe(false);
  expect(hot.checks.find(x=>x.name.includes('radiator'))?.passed).toBe(false);
  expect(dark.checks.find(x=>x.name.includes('electric'))?.passed).toBe(false);
 });
 it('fully qualified cluster has separately invoiced rockets, equipment, assembly and ground infrastructure',()=>{
  const plan=planNetworkDeployment(base)!;
  expect(plan.feasible).toBe(true);
  expect(plan.manifest.flightsRequired).toBe(1);
  expect(plan.totalWetKg).toBeCloseTo(plan.unitMassKg,3);
  expect(plan.hardwareUsd).toBeGreaterThan(ORBITAL_SERVICE_MODULES.compute.costUsd);
  expect(plan.totalCostUsd).toBeCloseTo(plan.manifest.launchCostUsd+
    plan.manifest.assemblyCostUsd+plan.hardwareUsd+plan.groundInfrastructureUsd,2);
  expect(plan.simplePaybackDays).toBeGreaterThan(30);
  expect(plan.simplePaybackDays).toBeLessThan(1000);
 });
 it('multi-satellite Canadian network requires more hardware, more launches and possibly orbital docking',()=>{
  const relay={...qualified,orbitalServiceModuleId:'relay' as const};
  const plan=planNetworkDeployment({...base,kind:'relay',design:relay,service:'custom'})!;
  expect(plan.feasible).toBe(false);
  expect(plan.manifest.flightsRequired).toBeGreaterThan(1);
  expect(plan.manifest.issue).toContain('Orbital assembly');
  const unlocked=planNetworkDeployment({...base,kind:'relay',design:relay,service:'custom',assemblyUnlocked:true})!;
  expect(unlocked.feasible).toBe(true);
  expect(unlocked.manifest.flights.every(x=>x.massKg<=x.capacityKg+1e-6)).toBe(true);
  expect(unlocked.totalCostUsd).toBeGreaterThan(unlocked.hardwareUsd);
 });
 it('two networks activate stage revenue only after completed commissioning',()=>{
  const none=networkEconomics(EMPTY_ORBITAL_NETWORKS);
  expect(none).toEqual({grossDailyUsd:0,expensesDailyUsd:0,operationalSatellites:0});
  const first=networkEconomics({compute:1,relay:1});
  expect(first.operationalSatellites).toBe(3);
  expect(first.grossDailyUsd).toBe(1500000);
  expect(first.expensesDailyUsd).toBe(450000);
  expect(networkSatellites('compute',3)).toBe(8);
  expect(networkSatellites('relay',3)).toBe(14);
  expect(ORBITAL_NETWORK_STAGES.relay).toHaveLength(3);
  const before=dailyEconomics([],0,false,EMPTY_ORBITAL_NETWORKS);
  const after=dailyEconomics([],0,false,{compute:1,relay:1});
  expect(after.netUsd-before.netUsd).toBe(first.grossDailyUsd-first.expensesDailyUsd);
  const game={day:1,cash:200e6,researchPoints:0,researchUnlocked:[],
    moonBaseLevel:0,networkLevels:{compute:1,relay:1},activeStoryRun:null,
    operatingSpentUsd:0,passiveRevenueUsd:0};
  const advanced=advanceProgramDay(game,10);
  expect(advanced.passiveRevenueUsd).toBe(first.grossDailyUsd*10);
  expect(advanced.cash).toBeCloseTo(game.cash+after.netUsd*10,3);
 });
});
