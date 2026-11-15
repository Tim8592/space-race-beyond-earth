/**
 * Commercial constellation game economics & actual spacecraft delivery chain.
 * All cash rates, hardware weights/costs, capacities, demand are GAME ASSUMPTIONS.
 * Real examples: Galaxia Onyx Edge, VSaS, OSPREY / Halifax Class and Kepler relay.
 */
import {planLaunchManifest,type LauncherId,type LaunchManifest} from './launchLogistics';
import {spacecraftHardwareEconomics} from './missionEconomics';
import {sizeSubsystemDesign,type SubsystemDesign} from './subsystemDesign';
import {ORBITAL_SERVICE_MODULES} from './orbitalServiceModules';
import {hasTechnology,type TechnologyId} from './technologyTree';
import type {Vehicle} from './engineering';

export type OrbitalNetworkKind='compute'|'relay';
export type OrbitalNetworkLevels=Record<OrbitalNetworkKind,number>;
export const EMPTY_ORBITAL_NETWORKS:OrbitalNetworkLevels={compute:0,relay:0};
export type OrbitalNetworkStage={
  level:number;kind:OrbitalNetworkKind;name:string;additionalSatellites:number;
  grossDailyUsd:number;operationsDailyUsd:number;groundInfrastructureUsd:number;
  servicePerSatellite:string;description:string;
};
export const ORBITAL_NETWORK_STAGES:Record<OrbitalNetworkKind,readonly OrbitalNetworkStage[]>={
 compute:[
  {level:1,kind:'compute',name:'Edge Compute Pathfinder',additionalSatellites:1,
   grossDailyUsd:550000,operationsDailyUsd:200000,groundInfrastructureUsd:16e6,
   servicePerSatellite:'35 Mb/s · optical data/AI workloads',
   description:'A deployed satellite hosts a separate command core and modular edge compute blades. Subscription income begins only after delivery and commissioning.'},
  {level:2,kind:'compute',name:'Canadian Orbital Compute Cluster',additionalSatellites:2,
   grossDailyUsd:1350000,operationsDailyUsd:450000,groundInfrastructureUsd:35e6,
   servicePerSatellite:'Distributed inference and science data processing',
   description:'Add two identical power and radiator-qualified orbital processors and ground-market capacity.'},
  {level:3,kind:'compute',name:'Space Cloud Marketplace',additionalSatellites:5,
   grossDailyUsd:2800000,operationsDailyUsd:950000,groundInfrastructureUsd:72e6,
   servicePerSatellite:'Fictional public orbital compute tenancy',
   description:'A multi-node hosted compute service for paying customers. Inspired by the concept of Galaxia VSaS, not an actual forecast of demand.'},
 ],
 relay:[
  {level:1,kind:'relay',name:'Canadian Arctic Relay Trial',additionalSatellites:2,
   grossDailyUsd:950000,operationsDailyUsd:250000,groundInfrastructureUsd:20e6,
   servicePerSatellite:'300 Mb/s · hypothetical RF/optical hybrid link',
   description:'First two nodes enable a demonstration relay service focused on northern customers, not continuous national coverage.'},
  {level:2,kind:'relay',name:'Sovereign Hybrid Data Network',additionalSatellites:4,
   grossDailyUsd:2100000,operationsDailyUsd:520000,groundInfrastructureUsd:52e6,
   servicePerSatellite:'Inter-satellite relay plus ground gateway',
   description:'Four additional spacecraft increase game customer demand and service capacity, while coverage gaps remain unmodeled.'},
  {level:3,kind:'relay',name:'Canadian LEO Network Constellation',additionalSatellites:8,
   grossDailyUsd:4200000,operationsDailyUsd:1180000,groundInfrastructureUsd:115e6,
   servicePerSatellite:'Commercial Canadian network subscriptions',
   description:'Fourteen total game satellites operate a Canadian-owned network. This is NOT a verified Starlink-equivalent global coverage constellation.'},
 ],
};
export const networkSatellites=(kind:OrbitalNetworkKind,level:number)=>{
 if(!Number.isInteger(level)||level<0||level>3)throw new RangeError('Invalid orbital network level');
 return ORBITAL_NETWORK_STAGES[kind].slice(0,level).reduce((a,s)=>a+s.additionalSatellites,0);
};
export function networkEconomics(levels:OrbitalNetworkLevels){
 if(!levels||!(['compute','relay'] as const).every(k=>Number.isInteger(levels[k])&&levels[k]>=0&&levels[k]<=3))
   throw new RangeError('Invalid orbital networks');
 const stages=(['compute','relay'] as const).flatMap(k=>ORBITAL_NETWORK_STAGES[k].slice(0,levels[k]));
 return {
   grossDailyUsd:stages.reduce((s,stage)=>s+stage.grossDailyUsd,0),
   expensesDailyUsd:stages.reduce((s,stage)=>s+stage.operationsDailyUsd,0),
   operationalSatellites:networkSatellites('compute',levels.compute)+
     networkSatellites('relay',levels.relay),
 };
}
export type NetworkDeploymentReview={
 stage:OrbitalNetworkStage;unitMassKg:number;totalWetKg:number;
 powerAvailableW:number;powerNeededW:number;thermalCapacityW:number;heatProducedW:number;
 unitHardwareUsd:number;groundInfrastructureUsd:number;
 hardwareUsd:number;totalCostUsd:number;
 manifest:LaunchManifest;feasible:boolean;
 checks:{name:string;passed:boolean;description:string}[];
 estimatedDailyNetUsd:number;simplePaybackDays:number;
};
export type NetworkDeploymentRun={
 id:string;kind:OrbitalNetworkKind;stageIndex:number;title:string;
 launchedDay:number;departureDate:string;startedAtMs:number;viewerDurationMs:number;
 durationDays:number;target:'ellipse';route:{flightDays:number};
 costUsd:number;launchCount:number;launchService:LauncherId;
 satelliteCount:number;totalWetKg:number;moduleId:OrbitalNetworkKind;
};
export function planNetworkDeployment(args:{
 kind:OrbitalNetworkKind;levels:OrbitalNetworkLevels;design:SubsystemDesign;
 launcher:Vehicle;service:LauncherId;tier:number;assemblyUnlocked:boolean;
 priorServiceFlights:number;canadianSuccesses:number;productionDiscount?:number;
 researched?:readonly TechnologyId[];devMode?:boolean;
}):NetworkDeploymentReview|null{
 const level=args.levels[args.kind];
 const stage=ORBITAL_NETWORK_STAGES[args.kind][level];
 if(!stage)return null;
 const module=ORBITAL_SERVICE_MODULES[args.kind];
 const design={...args.design,distanceAu:1};
 const system=sizeSubsystemDesign(design);
 const totalWetKg=system.modeledWetMassKg*stage.additionalSatellites;
 const manifest=planLaunchManifest({
   totalWetKg,service:args.service,vehicle:args.launcher,tier:args.tier,
   assemblyUnlocked:args.assemblyUnlocked,priorFlights:args.priorServiceFlights,
   canadianSuccesses:args.canadianSuccesses,
 });
 const unitHardwareUsd=spacecraftHardwareEconomics(design,args.productionDiscount??0).afterDiscountUsd+
   // Additional integration, acceptance tests, shipping, launch adapter and wiring.
   2500000;
 const hardwareUsd=stage.additionalSatellites*unitHardwareUsd;
 const totalCostUsd=hardwareUsd+manifest.launchCostUsd+
   manifest.assemblyCostUsd+stage.groundInfrastructureUsd;
 const requiredTech=args.kind==='compute'?'orbital-edge-compute':'canadian-optical-relay';
 const checks=[
  {name:'Infrastructure R&D funded with capital and RP',
    passed:hasTechnology(requiredTech,args.researched??[],args.devMode??false),
    description:'Research '+requiredTech+' in Research & Roadmap → Infrastructure to qualify this orbital service payload.'},
  {name:'Correct installed orbital-service module',passed:design.orbitalServiceModuleId===args.kind,
   description:'Install '+module.name+' in Engineering Lab → Payload and services before deployment. The hardware changes spacecraft mass and power/heat ledgers.'},
  {name:'Operating electric power + bus reserve',passed:system.totalAvailablePowerW>=system.housekeepingPowerW+45,
   description:Math.round(system.totalAvailablePowerW)+' W available vs '+Math.round(system.housekeepingPowerW+45)+' W nominal operations + 45 W station-keeping/communications allowance.'},
  {name:'Installed radiator dissipates operating heat',passed:system.thermalMarginW>=0,
   description:Math.round(system.radiatorCapacityW)+' W thermal disposal vs '+Math.round(system.thermalLoadW)+' W worst installed bus/propulsion heat. Module alone releases '+module.heatDissipationW+' W.'},
  {name:'Eclipse battery reserve',passed:design.eclipseHours>=.5&&system.batteryMassKg>0,
   description:'Required >=0.5 h stored-energy margin; automatically increases battery mass and launch wet mass.'},
  {name:'Engine mounts and bus physically fit',passed:system.engineMountsFit,
   description:'Scale structural frame to resolve collisions; additional structure increases wet mass.'},
  {name:'Paid launcher capacity and orbital assembly',passed:manifest.feasible,
   description:manifest.issue??manifest.flightsRequired+' separately invoiced delivery flight(s), with docking if needed.'},
 ];
 const net=stage.grossDailyUsd-stage.operationsDailyUsd;
 return {stage,unitMassKg:system.modeledWetMassKg,totalWetKg,
   powerAvailableW:system.totalAvailablePowerW,powerNeededW:system.housekeepingPowerW+45,
   thermalCapacityW:system.radiatorCapacityW,heatProducedW:system.thermalLoadW,
   unitHardwareUsd,groundInfrastructureUsd:stage.groundInfrastructureUsd,
   hardwareUsd,totalCostUsd,manifest,
   feasible:checks.every(c=>c.passed),
   checks,estimatedDailyNetUsd:net,
   simplePaybackDays:net>0?Math.ceil(totalCostUsd/net):Number.POSITIVE_INFINITY};
}
