/**
 * Transportation/manifests for an educational tycoon game.
 * Falcon 9 $74m standard GTO service and 22t MAX expendable LEO capability
 * are published SpaceX references, not a guaranteed simultaneous offer.
 * Other commercial services, recovery margins, costs, and Starship game
 * launch price/capacity are gameplay assumptions, NOT vendor quotes.
 * https://www.spacex.com/assets/media/Capabilities%26Services.pdf
 * https://new.spacex.com/vehicles/starship
 */
import {ENGINES,estimateBuildCostUsd,type Vehicle} from './engineering';
import {STANDARD_GRAVITY_MS2} from './nasaData';
export type LauncherId='custom'|'falcon9'|'falconHeavy'|'starship';
export type LauncherSpec={id:LauncherId;name:string;leoCapacityKg:number;baseCostUsd:number;
  unlockTier:number;description:string;source:'reference'|'game assumption'};
export const LAUNCHERS:Readonly<Record<Exclude<LauncherId,'custom'>,LauncherSpec>>={
 falcon9:{id:'falcon9',name:'Falcon 9 · dedicated',leoCapacityKg:15500,baseCostUsd:74e6,
  unlockTier:0,description:'Conservative recoverable LEO game allocation. Public $74M GTO standard price is only a reference.',source:'reference'},
 falconHeavy:{id:'falconHeavy',name:'Falcon Heavy · dedicated',leoCapacityKg:36000,baseCostUsd:112e6,
  unlockTier:1,description:'Illustrative reusable payload and service price, not a quoted Falcon Heavy contract.',source:'game assumption'},
 starship:{id:'starship',name:'Starship · future cargo',leoCapacityKg:100000,baseCostUsd:180e6,
  unlockTier:3,description:'Scenario capability and entirely illustrative per-launch price, not a quoted or available dedicated service.',source:'game assumption'},
};
export const FLEET_UPGRADES=[
 {level:1,name:'Recovery and flight integration',costUsd:42e6,
  costFactor:.94,capacityFactor:1.0,description:'Reusable hardware practices and campaign integration; unlocks Falcon Heavy scenario.'},
 {level:2,name:'Reusable booster fleet',costUsd:95e6,
  costFactor:.83,capacityFactor:1.08,description:'Ground processing, multiple recovered boosters and reduced per-flight refurbishment.'},
 {level:3,name:'Heavy reusable architecture',costUsd:175e6,
  costFactor:.7,capacityFactor:1.15,description:'Advanced fleet integration and notional heavy-lift Starship-class access.'},
] as const;
export const ORBITAL_ASSEMBLY_UPGRADE_USD=34e6;
export const ORBITAL_JOIN_HARDWARE_KG=65;
export const ORBITAL_JOIN_COST_USD=7e6;
export type LaunchBatch={flight:number;massKg:number;capacityKg:number;serviceCostUsd:number};
export type LaunchManifest={
  service:LauncherId;vehicleLabel:string;requiredWetKg:number;manifestWetKg:number;
  capacityKg:number;flightsRequired:number;flights:LaunchBatch[];
  launchCostUsd:number;assemblyCostUsd:number;assemblyHardwareKg:number;
  feasible:boolean;canAssemble:boolean;issue:string|null;
  programCostFactor:number;actualCostPerKgUsd:number;
};
export function customLeoCapacityKg(vehicle:Vehicle):number{
 const rocket=ENGINES[vehicle.engineId];
 if(!rocket)return 0;
 const exp=Math.expm1(9300/(rocket.ispSeconds*STANDARD_GRAVITY_MS2));
 const byFuel=vehicle.propellantMassKg/exp-vehicle.dryMassKg;
 const byThrust=rocket.thrustNewtons/(1.15*STANDARD_GRAVITY_MS2)-
    vehicle.dryMassKg-vehicle.propellantMassKg;
 return Math.max(0,Math.min(vehicle.payloadMassKg,byFuel,byThrust));
}
export function flightService(args:{
 service:LauncherId;vehicle:Vehicle;tier:number;priorFlights:number;
}):{capacityKg:number;costUsd:number;label:string;available:boolean;costFactor:number}{
 const {service,vehicle,tier,priorFlights}=args;
 if(!Number.isInteger(tier)||tier<0||tier>3||
    !Number.isInteger(priorFlights)||priorFlights<0)throw new RangeError('Invalid rocket program level or flight count');
 const spec=service==='custom'?null:LAUNCHERS[service];
 const upgradeDiscount=tier===0?1:FLEET_UPGRADES[tier-1].costFactor;
 const reuseDiscount=Math.max(.78,1-Math.min(40,priorFlights)*.0125);
 const factor=upgradeDiscount*reuseDiscount;
 const capacity=(spec?spec.leoCapacityKg:customLeoCapacityKg(vehicle))*
   (tier<2?1:FLEET_UPGRADES[tier-1].capacityFactor);
 const cost=spec?spec.baseCostUsd:estimateBuildCostUsd(vehicle,priorFlights);
 return {capacityKg:capacity,costUsd:Math.round(cost*factor),label:spec?.name??vehicle.name+' · custom builder',
   available:!spec||tier>=spec.unlockTier,costFactor:factor};
}
export function planLaunchManifest(args:{
 totalWetKg:number;service:LauncherId;vehicle:Vehicle;tier:number;
 assemblyUnlocked:boolean;priorFlights:number;
}):LaunchManifest{
 const {totalWetKg,service,vehicle,tier,assemblyUnlocked,priorFlights}=args;
 if(!Number.isFinite(totalWetKg)||totalWetKg<=0)throw new RangeError('Manifest requires positive mass');
 const reference=flightService({service,vehicle,tier,priorFlights});
 const capacity=reference.capacityKg;
 const maxFlights=12;
 if(!reference.available)return {service,vehicleLabel:reference.label,requiredWetKg:totalWetKg,
   manifestWetKg:totalWetKg,capacityKg:capacity,flightsRequired:0,flights:[],
   launchCostUsd:0,assemblyCostUsd:0,assemblyHardwareKg:0,feasible:false,
   canAssemble:assemblyUnlocked,issue:'Launch service is not unlocked in Rocket Fleet.',
   programCostFactor:reference.costFactor,actualCostPerKgUsd:0};
 if(capacity<=0)return {service,vehicleLabel:reference.label,requiredWetKg:totalWetKg,
   manifestWetKg:totalWetKg,capacityKg:0,flightsRequired:0,flights:[],
   launchCostUsd:0,assemblyCostUsd:0,assemblyHardwareKg:0,feasible:false,
   canAssemble:assemblyUnlocked,issue:'Rocket cannot reach the modeled LEO payload requirement. Increase rocket performance or select a stronger service.',
   programCostFactor:reference.costFactor,actualCostPerKgUsd:0};
 // Each additional flight requires an independently launched docking/join kit.
 let n=Math.max(1,Math.ceil(totalWetKg/capacity));
 for(let i=0;i<maxFlights;i++){
  const updated=Math.max(1,Math.ceil((totalWetKg+(n-1)*ORBITAL_JOIN_HARDWARE_KG)/capacity));
  if(updated===n)break;
  n=updated;
 }
 const assemblyHardwareKg=(n-1)*ORBITAL_JOIN_HARDWARE_KG;
 const manifestWetKg=totalWetKg+assemblyHardwareKg;
 const batches:LaunchBatch[]=[];
 let remaining=manifestWetKg,launchCostUsd=0;
 for(let i=0;i<Math.min(n,maxFlights);i++){
  const serviceForFlight=flightService({service,vehicle,tier,priorFlights:priorFlights+i});
  const massKg=Math.min(capacity,remaining);
  const serviceCostUsd=serviceForFlight.costUsd;
  batches.push({flight:i+1,massKg,capacityKg:capacity,serviceCostUsd});
  remaining=Math.max(0,remaining-massKg);
  launchCostUsd+=serviceCostUsd;
 }
 const assemblyCostUsd=(n-1)*ORBITAL_JOIN_COST_USD;
 const feasible=n<=maxFlights&&(n===1||assemblyUnlocked)&&remaining<=.01;
 const issue=n>maxFlights?'More than 12 launches: use a larger rocket architecture.':
   n>1&&!assemblyUnlocked?'Orbital assembly capability required to connect multiple launches.':
   remaining>.01?'Launch capacity insufficient.':null;
 return {service,vehicleLabel:reference.label,requiredWetKg:totalWetKg,manifestWetKg,
   capacityKg:capacity,flightsRequired:n,flights:batches,
   launchCostUsd,assemblyCostUsd,assemblyHardwareKg,
   feasible,canAssemble:assemblyUnlocked,issue,programCostFactor:reference.costFactor,
   actualCostPerKgUsd:(launchCostUsd+assemblyCostUsd)/totalWetKg};
}
export const MOON_CARGO_BLUEPRINTS=[
 {name:'Survey outpost delivery package',components:[
    {name:'Survey and communications relay',massKg:150},{name:'Solar array and power control',massKg:135},
    {name:'Battery and cabling',massKg:105},{name:'Deployment structure',massKg:60}],
  hardwareCostUsd:15e6},
 {name:'Logistics hub delivery package',components:[
    {name:'Landing deck and guidance beacons',massKg:700},{name:'Power and storage module',massKg:440},
    {name:'Cargo-handling robotics',massKg:260},{name:'Surface network',massKg:200}],
  hardwareCostUsd:47e6},
 {name:'Industrial campus delivery package',components:[
    {name:'Processing machinery',massKg:2500},{name:'Thermal, shielding and power',massKg:1200},
    {name:'Communications and robotics',massKg:600},{name:'Structural modules',massKg:700}],
  hardwareCostUsd:112e6},
] as const;
export const MOON_TRANSFER_DELTA_V_MS=5550; // game single equivalent stage: TLI, LOI, descent & margin
export const MOON_LANDER_ISP_S=345; // assumed chemical upper stage
export function moonCargoRequirement(stageIndex:number){
 if(!Number.isInteger(stageIndex)||stageIndex<0||stageIndex>=MOON_CARGO_BLUEPRINTS.length)
  throw new RangeError('Invalid lunar cargo stage');
 const blueprint=MOON_CARGO_BLUEPRINTS[stageIndex];
 const payloadKg=blueprint.components.reduce((s,c)=>s+c.massKg,0);
 const landerDryKg=245+payloadKg*.14;
 const finalMassKg=payloadKg+landerDryKg;
 const propellantKg=finalMassKg*Math.expm1(MOON_TRANSFER_DELTA_V_MS/
   (MOON_LANDER_ISP_S*STANDARD_GRAVITY_MS2));
 return {blueprint,payloadKg,landerDryKg,propellantKg,
  leoManifestKg:finalMassKg+propellantKg,
  fuelFraction:propellantKg/(finalMassKg+propellantKg)};
}
export function planMoonShipment(args:{
 stageIndex:number;service:LauncherId;vehicle:Vehicle;tier:number;
 assemblyUnlocked:boolean;priorFlights:number;
}){
 const req=moonCargoRequirement(args.stageIndex);
 const manifest=planLaunchManifest({totalWetKg:req.leoManifestKg,
    service:args.service,vehicle:args.vehicle,tier:args.tier,
    assemblyUnlocked:args.assemblyUnlocked,priorFlights:args.priorFlights});
 return {...req,manifest,totalCostUsd:manifest.launchCostUsd+
   manifest.assemblyCostUsd+req.blueprint.hardwareCostUsd};
}
