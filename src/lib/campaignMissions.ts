import {planetAtDate,earthOrbitAtTime,type PlanetId} from './orbitalMechanics';
import {EARTH,STANDARD_GRAVITY_MS2} from './nasaData';
import {type Vehicle} from './engineering';
import {planLaunchManifest,type LaunchManifest,type LauncherId} from './launchLogistics';
import {type SubsystemDesign,sizeSubsystemDesign} from './subsystemDesign';
import {SCIENCE_INSTRUMENTS,type ScienceInstrumentId} from './instrumentCatalog';
import {spacecraftHardwareEconomics} from './missionEconomics';
import {POWER_SYSTEMS} from './powerSources';
import {evaluatePropulsionBurn} from './propulsionBurn';

const DAY_MS=86_400_000;
const EPOCH=Date.UTC(2026,10,14,12);
const MU_SUN=1.32712440018e11; // km³/s² — JPL solar GM
const AU_KM=149597870.7;
const MU_MARS=42828.375214;
const R_MARS=3396.19;
const R_JUPITER=71492;
export const dayToDate=(day:number)=>new Date(EPOCH+(day-1)*DAY_MS);
export const dateForGameDay=(day:number)=>dayToDate(day).toISOString().slice(0,10);

export type CampaignMissionId='lunar'|'asteroid'|'mars'|'jupiter';
export type OrbitTarget='lunar'|'asteroid'|'mars'|'jupiter'|'ellipse';
export type BoosterId='none'|'storable'|'cryogenic';
export type MissionOptions={
  booster:BoosterId;
  highGain:boolean;
  radiationShield:boolean;
  reserveBattery:boolean;
  perigeeKm:number;
  eccentricity:number;
  cubesatUnits:0|1|3;
};
export const DEFAULT_MISSION_OPTIONS:MissionOptions={
  booster:'storable',highGain:true,radiationShield:false,
  reserveBattery:false,perigeeKm:400,eccentricity:.58,cubesatUnits:0,
};
export type CampaignDefinition={
  id:string;title:string;summary:string;
  location:string;target:OrbitTarget;stage:number;
  durationDays:number;payoutUsd:number;requiredScienceKg:number;
  minElectricW:number;requiresHighGain:boolean;requiresShield:boolean;
  acceptedInstruments:readonly ScienceInstrumentId[];
  windowStartDay?:number;windowEndDay?:number;
  ellipticalApogeeKm?:number;
  special?:boolean;
  requiredCubeSatUnits?:1|3;
};
export const STORY_MISSIONS:readonly CampaignDefinition[]=[
  {id:'lunar',title:'Lunar Relay Pathfinder',summary:'Deliver a communications spacecraft beyond Earth orbit and operate a reliable relay. Check Earth-departure energy, electrical reserves and a real manifest mass.',
    location:'Moon',target:'lunar',stage:1,durationDays:8,payoutUsd:205e6,
    requiredScienceKg:12,minElectricW:160,requiresHighGain:true,requiresShield:false,acceptedInstruments:[]},
  {id:'asteroid',title:'Asteroid Prospecting',summary:'Rendezvous with a fictional 1.35 AU circular-orbit survey target; characterize its magnetic field or mineralogy using instrument science.',
    location:'Synthetic 1.35 AU survey target',target:'asteroid',stage:2,durationDays:220,payoutUsd:320e6,
    requiredScienceKg:35,minElectricW:180,requiresHighGain:true,requiresShield:false,
    acceptedInstruments:['magnetometer','irMapper','lidar']},
  {id:'mars',title:'Mars Orbiter',summary:'Use an Earth→Mars transfer opportunity, fit a science payload and high-gain link, and reserve Δv for orbital capture.',
    location:'Mars',target:'mars',stage:3,durationDays:270,payoutUsd:505e6,
    requiredScienceKg:55,minElectricW:230,requiresHighGain:true,requiresShield:false,
    acceptedInstruments:['thermal','hyperspectral','irMapper','lidar']},
  {id:'jupiter',title:'Jovian Flyby Survey',summary:'Fly by the Jupiter system with science equipment, radiation hardening, deep-space communications and power that still works far from the Sun. Not a Jupiter capture or icy-moon orbit tour.',
    location:'Jupiter flyby',target:'jupiter',stage:4,durationDays:1050,payoutUsd:850e6,
    requiredScienceKg:100,minElectricW:260,requiresHighGain:true,requiresShield:true,
    acceptedInstruments:['magnetometer','gammaNeutron','irMapper']},
];
type SpecialVariant={
  name:string;summary:string;apogeeKm:number;scienceKg:number;
  powerW:number;highGain:boolean;shield:boolean;minStage:number;
  requiredCubeSatUnits?:1|3;
};
const SPECIAL_VARIANTS:readonly SpecialVariant[]=[
  {name:'High-Apogee Communications Test',summary:'A customer needs a high-gain relay in a highly elliptical Earth orbit before the contract expires.',
    apogeeKm:21000,scienceKg:40,powerW:150,highGain:true,shield:false,minStage:1},
  {name:'Radiation-Belt Survey',summary:'A short-lived research opportunity needs radiation protection and an energetic elliptical orbit.',
    apogeeKm:29500,scienceKg:65,powerW:170,highGain:false,shield:true,minStage:1},
  {name:'Fast Elliptical Relay Deployment',summary:'Deploy extra relay hardware into a high-apogee orbit during a limited bidding period.',
    apogeeKm:14500,scienceKg:75,powerW:210,highGain:true,shield:false,minStage:1},
  {name:'NASA CubeSat 101 · 3U Rideshare',summary:'Manifest a 3U nanosatellite with a compatible dispenser. NASA CubeSat 101 gives the 3U exterior as 10 × 10 × 34 cm. Game avionics, procurement and mission cost remain estimates.',
    apogeeKm:26000,scienceKg:85,powerW:230,highGain:true,shield:false,minStage:2,requiredCubeSatUnits:3},
  {name:'Heavy-Payload High-Energy Injection',summary:'A demanding payload requires high-apogee insertion, substantial electric power and a larger launch-capable spacecraft.',
    apogeeKm:42500,scienceKg:120,powerW:290,highGain:true,shield:true,minStage:3}
];
export function nextSpecialOffer(day:number,stageUnlocked:number):CampaignDefinition|null {
  if(!Number.isInteger(day)||day<1||stageUnlocked<1)return null;
  const cycle=Math.max(0,Math.floor((day-8)/32));
  const hash=(Math.imul(cycle+7,1103515245)+12345)>>>0;
  const available=SPECIAL_VARIANTS.filter(v=>v.minStage<=stageUnlocked);
  const index=hash%available.length;
  const template=available[index];
  const start=8+32*cycle;
  const deadline=start+21;
  const difficulty=Math.max(0,stageUnlocked-1);
  return {id:'special-'+cycle+'-'+index,title:template.name,
    summary:template.summary,location:'Earth · elliptical orbit',target:'ellipse',
    stage:1,special:true,durationDays:4,
    payoutUsd:Math.round((112e6+Math.min(4,stageUnlocked)*18e6+cycle*3e6)/1e6)*1e6,
    requiredScienceKg:template.scienceKg+12*difficulty,
    minElectricW:template.powerW+25*difficulty,
    requiresHighGain:template.highGain,requiresShield:template.shield,
    acceptedInstruments:[],ellipticalApogeeKm:template.apogeeKm+1500*difficulty,
    windowStartDay:start,windowEndDay:deadline,
    requiredCubeSatUnits:template.requiredCubeSatUnits};
}
export function specialOfferStatus(offer:CampaignDefinition,day:number):'upcoming'|'open'|'expired'{
  if(day<(offer.windowStartDay??0))return 'upcoming';
  return day<=(offer.windowEndDay??Number.POSITIVE_INFINITY)?'open':'expired';
}
export function unlockedStage(completed:readonly string[],devMode:boolean){
  if(devMode)return 4;
  let count=0;
  if(!completed.includes('observation'))return 0;
  for(const mission of STORY_MISSIONS) {
    if(mission.stage!==count+1)break;
    if(!completed.includes(mission.id))break;
    count++;
  }
  return Math.min(4,count+1);
}
export type OrbitalRoute={
  departureDeltaVms:number;
  arrivalDeltaVms:number;
  totalDeltaVms:number;
  phaseErrorDeg:number|null;
  flightDays:number;
  eccentricity:number;
  perigeeKm:number|null;
  apogeeKm:number|null;
  source:'two-body elliptical Earth'|'Hohmann approximation'|'lunar Earth ellipse'|'Orekit Lambert';
  warning:string;
};
export type SolvedCampaignTransfer={
  target:'mars'|'jupiter';departureDate:string;flightDays:number;
  departureVInfinityKmS:number;arrivalVInfinityKmS:number;
  eccentricity:number;
};
const escapeDeparture=(vInfKmS:number)=>{
  const r=EARTH.equatorialRadiusKm+400;
  const vpark=Math.sqrt(EARTH.gravitationalParameterKm3PerS2/r);
  return (Math.sqrt(vInfKmS*vInfKmS+2*EARTH.gravitationalParameterKm3PerS2/r)-vpark)*1000;
};
const planetCapture=(vInf:number,mu:number,r:number)=>{
  return (Math.sqrt(vInf*vInf+2*mu/r)-Math.sqrt(mu/r))*1000;
};
const phaseWrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
export function orbitalRoute(target:OrbitTarget,day:number,options:MissionOptions,
  solved?:SolvedCampaignTransfer|null):OrbitalRoute {
  if(!Number.isInteger(day)||day<1||!Number.isFinite(options.eccentricity)||
    options.eccentricity<0||options.eccentricity>=.95)throw new RangeError('Invalid mission orbit input');
  if(target==='ellipse'){
    const state=earthOrbitAtTime(options.perigeeKm,options.eccentricity,0);
    const rp=EARTH.equatorialRadiusKm+options.perigeeKm;
    const vpark=Math.sqrt(EARTH.gravitationalParameterKm3PerS2/rp);
    const dv=Math.max(0,(state.speedKmS-vpark)*1000);
    return {departureDeltaVms:dv,arrivalDeltaVms:0,totalDeltaVms:dv,phaseErrorDeg:null,
      flightDays:4,eccentricity:options.eccentricity,perigeeKm:options.perigeeKm,
      apogeeKm:state.apogeeAltitudeKm,
      source:'two-body elliptical Earth',
      warning:'Exact two-body vis-viva injection from circular parking orbit at the selected perigee; plane changes, finite burn, J2 and target ground coverage omitted.'};
  }
  if(target==='lunar'){
    const rp=EARTH.equatorialRadiusKm+400,ra=384400;
    const a=(rp+ra)/2,mu=EARTH.gravitationalParameterKm3PerS2;
    const vperi=Math.sqrt(mu*(2/rp-1/a));
    const vinj=(vperi-Math.sqrt(mu/rp))*1000;
    return {departureDeltaVms:vinj,arrivalDeltaVms:850,totalDeltaVms:vinj+850,
      phaseErrorDeg:null,flightDays:5,eccentricity:(ra-rp)/(ra+rp),
      perigeeKm:400,apogeeKm:ra-EARTH.equatorialRadiusKm,source:'lunar Earth ellipse',
      warning:'Elliptical Earth-to-Moon-distance estimate; 850 m/s lunar insertion/correction is a GAME allowance, not patched-conic lunar capture or actual Moon ephemeris.'};
  }
  const r1=AU_KM;
  const r2=AU_KM*(target==='asteroid'?1.35:target==='mars'?1.5237:5.2029);
  const transferA=(r1+r2)/2;
  const circularEarth=Math.sqrt(MU_SUN/r1);
  const transDep=Math.sqrt(MU_SUN*(2/r1-1/transferA));
  const circularTarget=Math.sqrt(MU_SUN/r2);
  const transArr=Math.sqrt(MU_SUN*(2/r2-1/transferA));
  const vInfDep=Math.abs(transDep-circularEarth);
  const vInfArrival=Math.abs(transArr-circularTarget);
  const hohmannDays=Math.PI*Math.sqrt(transferA**3/MU_SUN)/86400;
  if(solved&&(target==='mars'||target==='jupiter') &&
    solved.target===target&&solved.departureDate===dateForGameDay(day)&&
    solved.flightDays>1&&Number.isFinite(solved.departureVInfinityKmS)&&
    Number.isFinite(solved.arrivalVInfinityKmS)&&solved.departureVInfinityKmS>=0&&
    solved.arrivalVInfinityKmS>=0){
    const departure=escapeDeparture(solved.departureVInfinityKmS);
    const arrival=target==='mars'?
      planetCapture(solved.arrivalVInfinityKmS,MU_MARS,R_MARS+300):0;
    return {departureDeltaVms:departure,arrivalDeltaVms:arrival,totalDeltaVms:departure+arrival,
      phaseErrorDeg:null,flightDays:solved.flightDays,eccentricity:solved.eccentricity,
      perigeeKm:null,apogeeKm:null,source:'Orekit Lambert',
      warning:'Orekit two-body impulsive transfer departure/arrival v∞ (from Orbital Map) at THIS game departure date. Arrival capture uses simplified 300 km Mars circular orbit; Jupiter scenario is flyby only. Finite electric thrust and gravity assists NOT simulated.'};
  }
  let phaseErrorDeg:null|number=null;
  if(target==='mars'||target==='jupiter'){
    const date=dayToDate(day);
    const earth=planetAtDate('earth',date),planet=planetAtDate(target as PlanetId,date);
    const actual=phaseWrap(Math.atan2(planet.yAu,planet.xAu)-Math.atan2(earth.yAu,earth.xAu));
    const nPlanet=Math.sqrt(MU_SUN/r2**3);
    const targetPhase=phaseWrap(Math.PI-nPlanet*hohmannDays*86400);
    phaseErrorDeg=Math.abs(phaseWrap(actual-targetPhase))*180/Math.PI;
  }
  const departure=escapeDeparture(vInfDep);
  const arrival=target==='mars'?planetCapture(vInfArrival,MU_MARS,R_MARS+300):
    target==='jupiter'?0: vInfArrival*1000;
  // A simple strategic-energy surcharge illustrates the cost of missing an
  // alignment, NOT an optimized Lambert solution. It cannot predict a real
  // off-window trajectory.
  const alignmentSurcharge=phaseErrorDeg===null?0:
    Math.min(2000,Math.max(0,phaseErrorDeg-28)*12);
  const dv=departure+arrival+alignmentSurcharge;
  return {departureDeltaVms:departure+alignmentSurcharge,arrivalDeltaVms:arrival,
    totalDeltaVms:dv,phaseErrorDeg,flightDays:Math.round(hohmannDays),
    eccentricity:Math.abs(r2-r1)/(r2+r1),perigeeKm:null,apogeeKm:null,source:'Hohmann approximation',
    warning:'Approximate coplanar circular-orbit Hohmann transfer. Elliptical JPL planet positions only inform a rough phase-angle penalty; it is NOT a Lambert solution, a real launch-window prediction, or a low-thrust trajectory. Run Orbital Map → Orekit optimizer for actual date/duration geometry.'};
}
export const BOOSTERS={
  none:{name:'No external kick stage',dryKg:0,propKg:0,ispS:0,costUsd:0},
  storable:{name:'Storable high-energy kick stage',dryKg:42,propKg:530,ispS:345,costUsd:31e6},
  cryogenic:{name:'Large cryogenic injection stage',dryKg:110,propKg:1100,ispS:440,costUsd:78e6},
} as const;
/**
 * Actual historical dimensions and 1U reference mass from NASA CubeSat 101
 * (2017), §1.1. A 3U mass of 3 × 1.33 kg is a gameplay approximation
 * extrapolated from NASA's 1U reference, NOT a current dispenser standard.
 * https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf
 */
export const NASA_CUBESAT_REFERENCE={
  1:{label:'1U · 10 × 10 × 11 cm',referenceMaxMassKg:1.33,
    massKg:1.33,dispenserDryKg:3,dispenserCostUsd:2e6,dispenserPowerW:2},
  3:{label:'3U · 10 × 10 × 34 cm',referenceMaxMassKg:3*1.33,
    massKg:3*1.33,dispenserDryKg:8,dispenserCostUsd:6e6,dispenserPowerW:4},
} as const;
export const EXTERNAL_MODULES={
  highGain:{name:'Deployable high-gain communication unit',massKg:38,powerW:65,costUsd:9e6},
  radiationShield:{name:'Radiation shielding / dosimeter bus',massKg:95,powerW:12,costUsd:18e6},
  reserveBattery:{name:'Extended-duration energy module',massKg:35,powerW:4,costUsd:4e6},
} as const;
export type MissionReview={
  route:OrbitalRoute;
  hardwareWetKg:number;
  launchCapacityKg:number;
  launchManifest:LaunchManifest;
  spacecraftProcurementUsd:number;
  launchServicesUsd:number;
  boosterDeltaVms:number;
  busDeltaVms:number;
  busPropellantBurnedKg:number;
  busPropellantRemainingKg:number;
  busBurnWindowDays:number;
  totalDeltaVms:number;
  requiredDeltaVms:number;
  powerAvailableW:number;
  powerDemandW:number;
  backupUsableWh:number;
  backupRequiredWh:number;
  thermalCapacityW:number;
  heatDemandW:number;
  scienceMassKg:number;
  costUsd:number;
  rewardUsd:number;
  feasible:boolean;
  checks:{label:string;actual:string;needed:string;passed:boolean;detail:string}[];
  findings:string[];
};
function format(n:number|null,unit:string,decimals=0):string {
  return n!==null&&Number.isFinite(n)?
    n.toLocaleString('en-US',{maximumFractionDigits:decimals})+' '+unit:'unknown';
}
export function reviewCampaignMission(args:{
  definition:CampaignDefinition;day:number;options:MissionOptions;
  spacecraft:SubsystemDesign;launcher:Vehicle;capitalUsd:number;
  productionDiscount:number;completedWithLauncherEngine?:number;
  solvedTransfer?:SolvedCampaignTransfer|null;
  launchService?:LauncherId;
  rocketProgramLevel?:number;
  orbitalAssemblyUnlocked?:boolean;
  priorServiceFlights?:number;
}):MissionReview{
  const {definition:d,day,options:o,spacecraft,launcher,capitalUsd}=args;
  const destinationAu=d.target==='jupiter'?5.2029:d.target==='mars'?1.5237:
    d.target==='asteroid'?1.35:1;
  const design={...spacecraft,distanceAu:destinationAu};
  const system=sizeSubsystemDesign(design);
  const route=orbitalRoute(d.target,day,o,args.solvedTransfer);
  const booster=BOOSTERS[o.booster];
  const extraModules=[
    ...(o.highGain?[EXTERNAL_MODULES.highGain]:[]),
    ...(o.radiationShield?[EXTERNAL_MODULES.radiationShield]:[]),
    ...(o.reserveBattery?[EXTERNAL_MODULES.reserveBattery]:[]),
  ];
  const cubesat=o.cubesatUnits?NASA_CUBESAT_REFERENCE[o.cubesatUnits]:null;
  const cubesatInstalledKg=cubesat?cubesat.massKg+cubesat.dispenserDryKg:0;
  const cubesatCostUsd=cubesat?.dispenserCostUsd??0;
  const modulesKg=extraModules.reduce((s,m)=>s+m.massKg,0)+cubesatInstalledKg;
  const modulePower=extraModules.reduce((s,m)=>s+m.powerW,0)+(cubesat?.dispenserPowerW??0);
  const busWet=system.modeledWetMassKg+modulesKg;
  const hardwareWetKg=busWet+booster.dryKg+booster.propKg;
  const boosterDeltaVms=booster.propKg>0?
    booster.ispS*STANDARD_GRAVITY_MS2*Math.log((hardwareWetKg)/
      (hardwareWetKg-booster.propKg)):0;
  const available=system.totalAvailablePowerW;
  const powerDemandW=system.housekeepingPowerW+modulePower;
  // An instrument/relay must tolerate a defined temporary loss of solar
  // generation, or rely on non-solar baseload. This is a GAME contingency
  // duration, not a computed orbital-eclipse geometry.
  const interruptionHours=d.target==='lunar'?3:d.target==='asteroid'?2:
    d.target==='mars'?2.5:d.target==='jupiter'?5:1.5;
  const backupUsableWh=(system.storedBatteryEnergyWh+(o.reserveBattery?6000:0))*.8*.9;
  const backupRequiredWh=Math.max(0,powerDemandW-system.generatorElectricPowerW)*interruptionHours;
  // Sequential, finite-fuel rocket-equation burn: at most one propulsion
  // family runs at a time, sharing the TOTAL mission-time budget.
  // Electric power permits only a whole number of rated thrusters;
  // unburned fuel stays in the mass denominator.
  const modes=design.burnOrder==='secondary-first'&&system.secondaryMode?
    [system.secondaryMode,system.primaryMode]:[
      system.primaryMode,...(system.secondaryMode?[system.secondaryMode]:[])
    ];
  const busBurn=evaluatePropulsionBurn({
    initialWetMassKg:busWet,windowDays:d.durationDays,
    dutyFraction:design.propulsionDutyFraction,
    powerBudgetW:Math.max(0,available-powerDemandW),
    modes:modes.map(m=>({
      id:m.id,name:m.name,installedEngines:m.count,
      thrustPerEngineN:m.thrustN/m.count,ispSeconds:m.ispSeconds,
      propellantKg:m.propellantKg,
      busPowerPerEngineW:m.completePropulsionPowerW/m.count,
    })),
  });
  const busDeltaVms=busBurn.deliveredDeltaVms;
  const totalDeltaVms=boosterDeltaVms+busDeltaVms;
  const requiredDeltaVms=route.totalDeltaVms*1.05; // 5% gameplay energy margin
  const radiatorCapacityW=system.radiatorCapacityW;
  const heatDemandW=system.thermalLoadW+modulePower;
  const instrument=design.payloadInstrumentId==='none'?null:SCIENCE_INSTRUMENTS[design.payloadInstrumentId];
  const scienceMassKg=(instrument?.massKg??0)+design.payloadMassKg+
    extraModules.reduce((sum,m)=>sum+m.massKg,0)+(cubesat?.massKg??0);
  // The *spacecraft* is procured once; transport is a separate cost
  // for EACH real launcher in the mass-constrained manifest. Large designs
  // require multiple launches and paid docking/integration hardware.
  const launchManifest=planLaunchManifest({
    totalWetKg:hardwareWetKg,service:args.launchService??'custom',
    vehicle:launcher,tier:args.rocketProgramLevel??0,
    assemblyUnlocked:args.orbitalAssemblyUnlocked??false,
    priorFlights:args.priorServiceFlights??args.completedWithLauncherEngine??0,
  });
  const launchCapacityKg=launchManifest.capacityKg;
  const spacecraftProcurementUsd=hardware.afterDiscountUsd+booster.costUsd+
    extraModules.reduce((s,m)=>s+m.costUsd,0)+cubesatCostUsd+
    (instrument?.costUsd??0);
  const launchServicesUsd=launchManifest.launchCostUsd+launchManifest.assemblyCostUsd;
  const costUsd=spacecraftProcurementUsd+launchServicesUsd;
  const needsInstrument=d.acceptedInstruments.length>0;
  const flightPositive=route.flightDays<=d.durationDays+100||
    route.source==='Orekit Lambert';
  const checks=[
    {label:'Rocket launch manifest / orbital assembly',
      actual:launchManifest.flightsRequired+' flights · '+format(launchManifest.manifestWetKg,'kg',1),
      needed:launchManifest.feasible?'Within per-launch capacity':(launchManifest.issue??'Valid launcher'),
      passed:launchManifest.feasible,
      detail:'Installed spacecraft, mission propulsion, full transfer-stage wet mass and integration hardware are actually divided among '+launchManifest.flightsRequired+
        ' separately paid launches. Each flight must fit '+format(launchCapacityKg,'kg',1)+
        '. Multiple flights require purchased docking/assembly capability.'},
    {label:'Transfer energy / onboard Δv',actual:format(totalDeltaVms,'m/s'),needed:format(requiredDeltaVms,'m/s'),passed:totalDeltaVms>=requiredDeltaVms,
      detail:'Vis-viva/Hohmann or Orekit impulsive demand versus staged kick-stage + time-limited bus propulsion. Five percent design allowance included'},
    {label:'Power at destination',actual:format(available,'W'),needed:format(Math.max(powerDemandW,d.minElectricW),'W'),passed:available>=Math.max(powerDemandW,d.minElectricW),
      detail:'Solar power decreases with inverse-square Sun distance; power generators and science/module loads included'},
    {label:'Power interruption reserve',
      actual:format(backupUsableWh,'Wh'),needed:format(backupRequiredWh,'Wh'),
      passed:backupUsableWh>=backupRequiredWh,
      detail:'Game contingency: '+interruptionHours+' hours of load during solar generation outage; installed pack + optional 6 kWh module at 80% DoD and 90% discharge efficiency'},
    {label:'Bus heat rejection',actual:format(radiatorCapacityW,'W'),needed:format(heatDemandW,'W'),passed:radiatorCapacityW>=heatDemandW,
      detail:'Installed radiator area and selected solar absorptivity, not magically sized to the demand'},
    {label:'Payload / science mass',actual:format(scienceMassKg,'kg'),needed:format(d.requiredScienceKg,'kg'),passed:scienceMassKg>=d.requiredScienceKg,
      detail:'Actually installed scientific instruments, cargo and external mission modules, not arbitrary launch allowance'},
    {label:'Required science instrument',actual:instrument?.name??'No instrument',needed:needsInstrument?'Compatible instrument':'No special sensor required',
      passed:!needsInstrument||d.acceptedInstruments.includes(design.payloadInstrumentId as ScienceInstrumentId),
      detail:'Different mission objectives need a compatible sensor'},
    {label:'High-gain communications',actual:o.highGain?'Installed':'Not installed',needed:d.requiresHighGain?'Required':'Optional',
      passed:!d.requiresHighGain||o.highGain,detail:'External radio mass, peak power and procurement are included'},
    {label:'Radiation protection',actual:o.radiationShield?'Installed':'Not installed',needed:d.requiresShield?'Required':'Optional',
      passed:!d.requiresShield||o.radiationShield,detail:'Radiation-hardened bus adds mass/power/cost; no dose transport is solved'},
    {label:'Generator and reactor heat',actual:format(system.reactorThermalMarginW,'W'),needed:'Non-negative, known',
      passed:POWER_SYSTEMS[design.powerSourceId].class!=='fission'||
        (system.reactorThermalMarginW!==null&&system.reactorThermalMarginW>=0&&system.powerSystemMassKg!==null),
      detail:'Fission generators require known radiator heat and installed remote coolant hardware'},
    {label:'Mission budget available',actual:format(capitalUsd,'USD'),needed:format(costUsd,'USD'),passed:capitalUsd>=costUsd,
      detail:'Spend launch plus explicit mission hardware procurement before departure'},
    {label:'Flight-time envelope',actual:format(route.flightDays,'days'),needed:format(d.durationDays+100,'days'),
      passed:flightPositive,detail:'An impulsive transfer is not a finite-thrust propagation; conservative game cruise-time gate'},
  ];
  if(d.special){
    if(d.requiredCubeSatUnits)checks.push({
      label:'NASA CubeSat 101 · dispenser interface',
      actual:cubesat?.label??'No CubeSat dispenser selected',
      needed:NASA_CUBESAT_REFERENCE[d.requiredCubeSatUnits].label,
      passed:o.cubesatUnits===d.requiredCubeSatUnits,
      detail:'NASA CubeSat 101 (2017), §1.1: 1U = 10×10×11 cm and ≈1–1.33 kg, 3U = 10×10×34 cm. 3U mass is a game extrapolation; dispenser mass/cost are invented.'
    });
    if(d.windowStartDay!==undefined&&d.windowEndDay!==undefined)checks.push({label:'Special contract deadline',actual:'Day '+day,
      needed:'Days '+d.windowStartDay+'–'+d.windowEndDay,
      passed:specialOfferStatus(d,day)==='open',
      detail:'Must start the launch while the in-game procurement/mission window is open, not complete the entire flight inside it'});
  }
  if(d.ellipticalApogeeKm){
    checks.push({label:'Elliptical target apogee',actual:format(route.apogeeKm??0,'km'),
      needed:'At least '+format(d.ellipticalApogeeKm,'km'),
      passed:(route.apogeeKm??0)>=d.ellipticalApogeeKm,
      detail:'Perigee + eccentricity propagate through the same Keplerian Earth orbit model as the Orbital Map'});
  }
  if(!system.engineMountsFit)checks.push({
    label:'Engine mount clearance',actual:design.structureScale.toFixed(2)+'×',
    needed:'At least '+system.requiredStructureScale.toFixed(2)+'×',
    passed:false,detail:'The selected installed engine count needs a wider structural frame. Resize the bus structure in Engineering Lab; the added structural mass affects launch and delta-V.'
  });
  const findings=checks.filter(c=>!c.passed).map(c=>c.label+': '+c.detail);
  if(busBurn.remainingPropellantKg>1e-5)findings.push(
    'Within '+d.durationDays+' mission days, only '+busBurn.burnedPropellantKg.toFixed(2)+
    ' kg of '+system.totalPropellantKg.toFixed(2)+' kg can burn at the selected rated Isp / electricity budget. Unused fuel still adds mass.'
  );
  if(route.source==='Hohmann approximation'&&route.phaseErrorDeg!==null&&route.phaseErrorDeg>30)
    findings.push('Orbital alignment is unfavorable for the simple Hohmann geometry; examine the date in Orbital Map and evaluate an Orekit Lambert solution.');
  if(system.massEstimateIncomplete)findings.push('Engineering mass has incomplete flight hardware allowances. This is a campaign-grade feasibility screen only, not flight qualification.');
  return {route,hardwareWetKg,launchCapacityKg,launchManifest,spacecraftProcurementUsd,launchServicesUsd,boosterDeltaVms,busDeltaVms,
    busPropellantBurnedKg:busBurn.burnedPropellantKg,
    busPropellantRemainingKg:busBurn.remainingPropellantKg,
    busBurnWindowDays:d.durationDays,
    totalDeltaVms,requiredDeltaVms,powerAvailableW:available,powerDemandW,
    backupUsableWh,backupRequiredWh,
    thermalCapacityW:radiatorCapacityW,heatDemandW,scienceMassKg,
    costUsd,rewardUsd:d.payoutUsd,
    feasible:checks.every(c=>c.passed),checks,findings};
}
