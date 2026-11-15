/**
 * Game launch services and historical development analogues.
 * REAL companies / announced development targets, NOT commercially available
 * 2026 Canadian orbital launch services. Quoted game prices are fabricated.
 * Reaction Dynamics: https://www.reactiondynamics.space/en/news/reaction-dynamics-unveils-borealis
 * NordSpace: https://www.nordspace.com/
 * Canada sovereign launch awards: https://www.canada.ca/en/department-national-defence/news/2026/03/minister-mcguinty-announces-strategic-investments-in-sovereign-space-launch.html
 * Maritime Launch is a SPACEPORT operator, not a launch-vehicle manufacturer:
 * https://maritimelaunch.com/launch/spaceport-nova-scotia
 */
import {ENGINES,type Vehicle} from './engineering';
import {STANDARD_GRAVITY_MS2} from './nasaData';
import type {TechnologyId} from './technologyTree';
export type LauncherId='custom'|'falcon9'|'falconHeavy'|'starship';
export type CanadianRocketGeneration={
 level:number;name:string;company:string;leoCapacityKg:number;baseCostUsd:number;
 reference:string;programDescription:string;sourceUrl:string;
};
export const CANADIAN_ROCKET_GENERATIONS:readonly CanadianRocketGeneration[]=[
 {level:0,name:'Aurora · early orbital scenario',company:'Reaction Dynamics (Québec)',
  leoCapacityKg:220,baseCostUsd:36e6,
  reference:'Aurora smallsat target was ~200 kg LEO; the announced liquid-propulsion redesign may change it.',
  programDescription:'Canadian small orbital-class rocket development. In-game launches are hypothetical future flights, not operations available in November 2026.',
  sourceUrl:'https://www.reactiondynamics.space/en/launch'},
 {level:1,name:'Tundra · light orbital scenario',company:'NordSpace (Ontario / Newfoundland)',
  leoCapacityKg:1100,baseCostUsd:29e6,
  reference:'NordSpace currently describes Tundra as a planned 1,100 kg LEO rocket.',
  programDescription:'Made-in-Canada liquid launch infrastructure and light-lift engineering. Fictional per-launch fee.',
  sourceUrl:'https://www.nordspace.com/'},
 {level:2,name:'Borealis · medium-lift scenario',company:'Reaction Dynamics (Québec)',
  leoCapacityKg:6000,baseCostUsd:51e6,
  reference:'Reaction Dynamics announced a planned 6-tonne LEO Borealis vehicle, targeting 2031.',
  programDescription:'Medium-lift engine manufacturing, stage testing, and increased launcher throughput. Game commissioning is time-accelerated.',
  sourceUrl:'https://www.reactiondynamics.space/en/news/reaction-dynamics-unveils-borealis'},
 {level:3,name:'Tempest · advanced Canadian lift scenario',company:'NordSpace (Ontario / Newfoundland)',
  leoCapacityKg:10000,baseCostUsd:69e6,
  reference:'NordSpace describes Tempest as a designed 10,000+ kg orbital launcher.',
  programDescription:'Future medium-lift Canadian fleet. All service dates and per-launch economics are modeled assumptions.',
  sourceUrl:'https://www.nordspace.com/'},
] as const;
export type LauncherSpec={id:LauncherId;name:string;leoCapacityKg:number;baseCostUsd:number;
 unlockTier:number;description:string;source:'reference'|'game assumption'};
export const LAUNCHERS:Readonly<Record<Exclude<LauncherId,'custom'>,LauncherSpec>>={
 falcon9:{id:'falcon9',name:'Falcon 9 · dedicated',leoCapacityKg:15500,baseCostUsd:74e6,
  unlockTier:0,description:'Fictional reusable LEO allocation. Public $74M price is for a standard GTO mission, not a quoted LEO booking.',source:'reference'},
 falconHeavy:{id:'falconHeavy',name:'Falcon Heavy · dedicated',leoCapacityKg:36000,baseCostUsd:112e6,
  unlockTier:0,description:'Illustrative dedicated service and price: commercial access does not advance your Canadian manufacturing program.',source:'game assumption'},
 starship:{id:'starship',name:'Starship · future cargo scenario',leoCapacityKg:100000,baseCostUsd:180e6,
  unlockTier:0,description:'Speculative future heavy-lift scenario. This is NOT a verified current Starship customer price or service.',source:'game assumption'},
};
/** Each technology is researched with RP and cash in the separate tech-tree; after
 * R&D, the rocket program still needs infrastructure investment and readiness.
 * Flight heritage accelerates the calendar gate; SpaceX missions do not.
 */
export const FLEET_UPGRADES=[
 {level:1,name:'Tundra flight-qualification program',costUsd:45e6,
  requiredResearch:'canadian-light-lift' as TechnologyId,
  requiredDays:17,minCanadianMissions:0,acceleratedDaysPerSuccess:13,
  description:'Pay to commission an illustrative Tundra-generation fleet after domestic flight-test research and/or time to mature.'},
 {level:2,name:'Borealis liquid medium-lift program',costUsd:118e6,
  requiredResearch:'canadian-medium-lift' as TechnologyId,
  requiredDays:76,minCanadianMissions:1,acceleratedDaysPerSuccess:19,
  description:'Funding plus Canadian successes or later calendar dates unlock much larger payloads.'},
 {level:3,name:'Tempest heavy reusable architecture',costUsd:175e6,
  requiredResearch:'canadian-heavy-lift' as TechnologyId,
  requiredDays:210,minCanadianMissions:3,acceleratedDaysPerSuccess:24,
  description:'Advanced Canadian medium lift needs previous commercial heritage, mission-driven learning and a new industrial investment.'},
] as const;
export function canadianProgramReadiness(args:{
 tier:number;day:number;canadianSuccesses:number;researchUnlocked:readonly TechnologyId[];
 devMode?:boolean;
}):{ready:boolean;researchReady:boolean;timeReady:boolean;heritageReady:boolean;daysUntilReady:number;
 requiredTechnology:TechnologyId|null}{
 const {tier,day,canadianSuccesses,researchUnlocked,devMode=false}=args;
 if(!Number.isInteger(tier)||tier<0||tier>3)throw new RangeError('Invalid Canadian rocket generation');
 const next=FLEET_UPGRADES[tier];
 if(!next)return {ready:false,researchReady:false,timeReady:false,heritageReady:false,
  daysUntilReady:0,requiredTechnology:null};
 const researchReady=devMode||researchUnlocked.includes(next.requiredResearch);
 const requiredDay=Math.max(1,next.requiredDays-next.acceleratedDaysPerSuccess*canadianSuccesses);
 const daysUntilReady=Math.max(0,requiredDay-day);
 const timeReady=devMode||daysUntilReady===0;
 const heritageReady=devMode||canadianSuccesses>=next.minCanadianMissions;
 return {ready:researchReady&&timeReady&&heritageReady,
  researchReady,timeReady,heritageReady,daysUntilReady,
  requiredTechnology:next.requiredResearch};
}
export const CANADIAN_PROGRESS_CREDIT_PER_SUCCESS=1;
export const CANADIAN_RESEARCH_BONUS_RP=2;
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
/** The player's rocket profile is a PRESET generation. Vehicle is retained
 * in the legacy API only to preserve campaign save structures; manually edited
 * old dry/propellant/payload fields never change the actual launch manifest. */
export function flightService(args:{
 service:LauncherId;vehicle:Vehicle;tier:number;priorFlights:number;canadianSuccesses?:number;
}):{capacityKg:number;costUsd:number;label:string;available:boolean;costFactor:number;domestic:boolean}{
 const {service,tier,priorFlights,canadianSuccesses=0}=args;
 if(!Number.isInteger(tier)||tier<0||tier>3||
   !Number.isInteger(priorFlights)||priorFlights<0||
   !Number.isInteger(canadianSuccesses)||canadianSuccesses<0)
   throw new RangeError('Invalid rocket fleet generation or heritage count');
 const domestic=service==='custom';
 const rocket=CANADIAN_ROCKET_GENERATIONS[tier];
 const commercial=domestic?null:LAUNCHERS[service];
 if(!rocket||(service!=='custom'&&!commercial))
   throw new RangeError('Unknown launcher provider');
 // Mission completion discounts ONLY domestically produced launchers.
 // Booked SpaceX flights do NOT magically develop a Canadian booster.
 const missionFactor=domestic?Math.max(.6,1-canadianSuccesses*.045):1;
 const repeatedProduction=domestic?Math.max(.9,1-priorFlights*.006):1;
 const costFactor=missionFactor*repeatedProduction;
 const capacityKg=domestic?rocket.leoCapacityKg:commercial!.leoCapacityKg;
 const baseCostUsd=domestic?rocket.baseCostUsd:commercial!.baseCostUsd;
 return {capacityKg,costUsd:Math.round(baseCostUsd*costFactor),
  label:domestic?rocket.name:commercial!.name,available:true,costFactor,domestic};
}
export function planLaunchManifest(args:{
 totalWetKg:number;service:LauncherId;vehicle:Vehicle;tier:number;
 assemblyUnlocked:boolean;priorFlights:number;canadianSuccesses?:number;
}):LaunchManifest{
 const {totalWetKg,service,vehicle,tier,assemblyUnlocked,priorFlights}=args;
 if(!Number.isFinite(totalWetKg)||totalWetKg<=0)throw new RangeError('Manifest requires positive mass');
 const reference=flightService({service,vehicle,tier,priorFlights,canadianSuccesses:args.canadianSuccesses});
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
  const serviceForFlight=flightService({service,vehicle,tier,priorFlights:priorFlights+i,canadianSuccesses:args.canadianSuccesses});
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
 assemblyUnlocked:boolean;priorFlights:number;canadianSuccesses?:number;
}){
 const req=moonCargoRequirement(args.stageIndex);
 const manifest=planLaunchManifest({totalWetKg:req.leoManifestKg,
    service:args.service,vehicle:args.vehicle,tier:args.tier,
    assemblyUnlocked:args.assemblyUnlocked,priorFlights:args.priorFlights,
    canadianSuccesses:args.canadianSuccesses});
 return {...req,manifest,totalCostUsd:manifest.launchCostUsd+
   manifest.assemblyCostUsd+req.blueprint.hardwareCostUsd};
}

/** A surface shipment is a genuine outbound mission, not an instant tech-tree purchase. */
export type MoonCargoRun={
 id:string;title:string;stageIndex:number;target:'lunar';durationDays:number;
 launchedDay:number;departureDate:string;startedAtMs:number;viewerDurationMs:number;
 route:{flightDays:number};service:LauncherId;flightsRequired:number;
 costUsd:number;payloadKg:number;landerPropellantKg:number;leoManifestKg:number;
};
