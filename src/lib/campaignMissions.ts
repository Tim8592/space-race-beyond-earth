import {planetAtDate,earthOrbitAtTime,type PlanetId} from './orbitalMechanics';
import {EARTH,STANDARD_GRAVITY_MS2} from './nasaData';
import {ENGINES,type Vehicle} from './engineering';
import {type SubsystemDesign,sizeSubsystemDesign} from './subsystemDesign';
import {SCIENCE_INSTRUMENTS,type ScienceInstrumentId} from './instrumentCatalog';
import {spacecraftHardwareEconomics} from './missionEconomics';
import {POWER_SYSTEMS} from './powerSources';

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
};
export const DEFAULT_MISSION_OPTIONS:MissionOptions={
  booster:'storable',highGain:true,radiationShield:false,
  reserveBattery:false,perigeeKm:400,eccentricity:.58,
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
const SPECIAL_VARIANTS=[
  {name:'High-Apogee Communications Test',summary:'A customer urgently needs a high-gain relay in a highly elliptical Earth orbit before the contract expires.',
    apogeeKm:21000,scienceKg:40,powerW:150,highGain:true,shield:false},
  {name:'Radiation-Belt Survey',summary:'A short-lived research opportunity needs radiation protection and an energetic elliptical orbit.',
    apogeeKm:29500,scienceKg:65,powerW:170,highGain:false,shield:true},
  {name:'Fast Elliptical Relay Deployment',summary:'Deploy extra relay hardware into a high-apogee orbit during a limited bidding period.',
    apogeeKm:14500,scienceKg:75,powerW:210,highGain:true,shield:false},
] as const;

export function nextSpecialOffer(day:number,stageUnlocked:number):CampaignDefinition|null {
  if(!Number.isInteger(day)||day<1||stageUnlocked<1)return null;
  const cycle=Math.max(0,Math.floor((day-8)/32));
  const index=(Math.imul(cycle+7,1103515245)+12345>>>0)%SPECIAL_VARIANTS.length;
  const template=SPECIAL_VARIANTS[index];
  const start=8+32*cycle;
  const deadline=start+21;
  return {id:'special-'+cycle+'-'+index,title:template.name,
    summary:template.summary,location:'Earth · elliptical orbit',target:'ellipse',
    stage:1,special:true,durationDays:4,
    payoutUsd:Math.round((112e6+Math.min(4,stageUnlocked)*18e6+cycle*3e6)/1e6)*1e6,
    requiredScienceKg:template.scienceKg,minElectricW:template.powerW,
    requiresHighGain:template.highGain,requiresShield:template.shield,
    acceptedInstruments:[],ellipticalApogeeKm:template.apogeeKm,
    windowStartDay:start,windowEndDay:deadline};
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
      flightDays:4,eccentricity:options.eccentricity,apogeeKm:state.apogeeAltitudeKm,
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
      apogeeKm:ra-EARTH.equatorialRadiusKm,source:'lunar Earth ellipse',
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
      apogeeKm:null,source:'Orekit Lambert',
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
    eccentricity:Math.abs(r2-r1)/(r2+r1),apogeeKm:null,source:'Hohmann approximation',
    warning:'Approximate coplanar circular-orbit Hohmann transfer. Elliptical JPL planet positions only inform a rough phase-angle penalty; it is NOT a Lambert solution, a real launch-window prediction, or a low-thrust trajectory. Run Orbital Map → Orekit optimizer for actual date/duration geometry.'};
}
export const BOOSTERS={
  none:{name:'No external kick stage',dryKg:0,propKg:0,ispS:0,costUsd:0},
  storable:{name:'Storable high-energy kick stage',dryKg:42,propKg:530,ispS:345,costUsd:31e6},
  cryogenic:{name:'Large cryogenic injection stage',dryKg:110,propKg:1100,ispS:440,costUsd:78e6},
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
  boosterDeltaVms:number;
  busDeltaVms:number;
  totalDeltaVms:number;
  requiredDeltaVms:number;
  powerAvailableW:number;
  powerDemandW:number;
  thermalCapacityW:number;
  heatDemandW:number;
  scienceMassKg:number;
  costUsd:number;
  rewardUsd:number;
  feasible:boolean;
  checks:{label:string;actual:string;needed:string;passed:boolean;detail:string}[];
  findings:string[];
};
function format(n:number,unit:string,decimals=0):string {
  return Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:decimals})+' '+unit:'unknown';
}
function busBurnDeltaV(wet:number,design:SubsystemDesign,
  result:ReturnType<typeof sizeSubsystemDesign>,maxDays:number,wattsAvailable:boolean):number{
  const p=result.primaryMode,s=result.secondaryMode;
  const burn=(mass:number,m:typeof p)=>{
    const rate=m.thrustN/(m.ispSeconds*STANDARD_GRAVITY_MS2)*86400;
    const usable=m.kind!=='hydrazine'&&!wattsAvailable?0:
      Math.min(m.propellantKg,rate*Math.max(1,maxDays)*.85);
    const delta=usable>0?m.ispSeconds*STANDARD_GRAVITY_MS2*Math.log(mass/(mass-usable)):0;
    return {delta,remaining:mass-usable};
  };
  if(s&&design.burnOrder==='secondary-first'){
    const first=burn(wet,s),second=burn(first.remaining,p);
    return first.delta+second.delta;
  }
  const first=burn(wet,p),second=s?burn(first.remaining,s):null;
  return first.delta+(second?.delta??0);
}
export function reviewCampaignMission(args:{
  definition:CampaignDefinition;day:number;options:MissionOptions;
  spacecraft:SubsystemDesign;launcher:Vehicle;capitalUsd:number;
  productionDiscount:number;solvedTransfer?:SolvedCampaignTransfer|null;
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
  const modulesKg=extraModules.reduce((s,m)=>s+m.massKg,0);
  const modulePower=extraModules.reduce((s,m)=>s+m.powerW,0);
  const busWet=system.modeledWetMassKg+modulesKg;
  const hardwareWetKg=busWet+booster.dryKg+booster.propKg;
  const boosterDeltaVms=booster.propKg>0?
    booster.ispS*STANDARD_GRAVITY_MS2*Math.log((hardwareWetKg)/
      (hardwareWetKg-booster.propKg)):0;
  const available=system.totalAvailablePowerW;
  const powerDemandW=system.housekeepingPowerW+modulePower;
  const powerMargin=available-powerDemandW;
  const poweredThrusters=system.primaryMode.canPowerAtRatedPoint&&
    (!system.secondaryMode||system.secondaryMode.canPowerAtRatedPoint);
  const busDeltaVms=busBurnDeltaV(busWet,design,system,d.durationDays,poweredThrusters);
  const totalDeltaVms=boosterDeltaVms+busDeltaVms;
  const requiredDeltaVms=route.totalDeltaVms*1.05; // 5% gameplay energy margin
  const radiatorCapacityW=system.radiatorCapacityW;
  const heatDemandW=system.thermalLoadW+modulePower;
  const instrument=design.payloadInstrumentId==='none'?null:SCIENCE_INSTRUMENTS[design.payloadInstrumentId];
  const scienceMassKg=(instrument?.massKg??0)+design.payloadMassKg+modulesKg;
  const rocket=ENGINES[launcher.engineId];
  const requiredRocketDv=9300; // educational LEO ascent requirement
  const exponent=Math.expm1(requiredRocketDv/(rocket.ispSeconds*STANDARD_GRAVITY_MS2));
  const idealPayload=launcher.propellantMassKg/exponent-launcher.dryMassKg;
  const maxTwrPayload=rocket.thrustNewtons/(1.15*STANDARD_GRAVITY_MS2)-
    launcher.dryMassKg-launcher.propellantMassKg;
  const launchCapacityKg=Math.max(0,Math.min(launcher.payloadMassKg,idealPayload,maxTwrPayload));
  const hardware=spacecraftHardwareEconomics(design,args.productionDiscount);
  const costUsd=hardware.afterDiscountUsd+booster.costUsd+
    extraModules.reduce((s,m)=>s+m.costUsd,0)+
    (instrument?.costUsd??0)+
    // Launch rocket cost; same campaign engine production count ignored here
    // for simplicity; no price discount double-counted.
    35_000_000;
  const needsInstrument=d.acceptedInstruments.length>0;
  const flightPositive=route.flightDays<=d.durationDays+100||
    route.source==='Orekit Lambert';
  const checks=[
    {label:'Rocket payload capacity',actual:format(hardwareWetKg,'kg',1),needed:format(launchCapacityKg,'kg',1),passed:hardwareWetKg<=launchCapacityKg,
      detail:'Installed bus + spacecraft propellant + external modules + kick-stage propellant/dry mass vs actual launcher payload capacity'},
    {label:'Transfer energy / onboard Δv',actual:format(totalDeltaVms,'m/s'),needed:format(requiredDeltaVms,'m/s'),passed:totalDeltaVms>=requiredDeltaVms,
      detail:'Vis-viva/Hohmann or Orekit impulsive demand versus staged kick-stage + time-limited bus propulsion. Five percent design allowance included'},
    {label:'Power at destination',actual:format(available,'W'),needed:format(Math.max(powerDemandW,d.minElectricW),'W'),passed:available>=Math.max(powerDemandW,d.minElectricW),
      detail:'Solar power decreases with inverse-square Sun distance; power generators and science/module loads included'},
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
    checks.push({label:'Special contract deadline',actual:'Day '+day,
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
  const findings=checks.filter(c=>!c.passed).map(c=>c.label+': '+c.detail);
  if(route.source==='Hohmann approximation'&&route.phaseErrorDeg!==null&&route.phaseErrorDeg>30)
    findings.push('Orbital alignment is unfavorable for the simple Hohmann geometry; examine the date in Orbital Map and evaluate an Orekit Lambert solution.');
  if(system.massEstimateIncomplete)findings.push('Engineering mass has incomplete flight hardware allowances. This is a campaign-grade feasibility screen only, not flight qualification.');
  return {route,hardwareWetKg,launchCapacityKg,boosterDeltaVms,busDeltaVms,
    totalDeltaVms,requiredDeltaVms,powerAvailableW:available,powerDemandW,
    thermalCapacityW:radiatorCapacityW,heatDemandW,scienceMassKg,
    costUsd,rewardUsd:d.payoutUsd,
    feasible:checks.every(c=>c.passed),checks,findings};
}
