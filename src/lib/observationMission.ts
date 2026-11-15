import { calculateVehicleMetrics, ENGINES, type Vehicle } from './engineering';
import {planLaunchManifest,type LauncherId,type LaunchManifest} from './launchLogistics';
import { STANDARD_GRAVITY_MS2, EARTH } from './nasaData';
import { sizeSubsystemDesign, type SubsystemDesign, type SystemResults } from './subsystemDesign';
import { BATTERY_PACKS } from './spacecraftTechnology';
import { SCIENCE_INSTRUMENTS } from './instrumentCatalog';
import { spacecraftHardwareEconomics, type HardwareEconomics } from './missionEconomics';
import { missionRiskSummary } from './technologyTree';
import { POWER_SYSTEMS } from './powerSources';

/**
 * Earth Observation One: a deterministic seven-day educational campaign.
 * NASA/JPL Earth gravity/radius and surveyed spacecraft component figures are
 * used where noted in the existing model. Instrument, ground-access, radio,
 * manufacturing/pricing and scoring numbers BELOW are GAME ASSUMPTIONS.
 * The model does not perform ground-target visibility / link budget analysis.
 */
export const OBSERVATION_DAYS = 7;
export const SCIENCE_GOAL = 90;
export const OBSERVATION_BUDGET_USD = 125_000_000;
export const OBSERVATION_PAYOUT_USD = 155_000_000;
const GROUND_EFFICIENCY = 0.78;
const BATTERY_DOD = 0.8;
const BATTERY_EFF = 0.9;
const RADIATOR_KGM2 = 4;
const EXTRA_RADIATOR_USDM2 = 600_000;
const EXTRA_BATTERY_USDWH = 450;
const MIN_TWR = 1.15;

/** All player instruments use the shared spacecraft instrument catalog. */
export const INSTRUMENTS={
  compact:{...SCIENCE_INSTRUMENTS.compact,detail:'Low mass / modest images'},
  multispectral:{...SCIENCE_INSTRUMENTS.multispectral,detail:'Balanced science / data volume'},
  hyperspectral:{...SCIENCE_INSTRUMENTS.hyperspectral,detail:'High-value / high-bandwidth payload'},
  thermal:{...SCIENCE_INSTRUMENTS.thermal,detail:'Thermal surface monitoring'},
} as const;
export const RADIOS = {
  uhf: {name:'Basic UHF downlink',massKg:4,powerW:16,rateMbps:0.09,costUsd:1_800_000},
  sband: {name:'S-band communications',massKg:9,powerW:35,rateMbps:1.2,costUsd:6_000_000},
  xband: {name:'X-band high-rate link',massKg:18,powerW:65,rateMbps:5,costUsd:15_000_000},
} as const;
export const STORAGE = {
  '4gb': {name:'4 GB recorder',massKg:1.2,capacityMb:32_000,costUsd:750_000},
  '16gb': {name:'16 GB recorder',massKg:2.5,capacityMb:128_000,costUsd:1_800_000},
  '64gb': {name:'64 GB recorder',massKg:5,capacityMb:512_000,costUsd:5_000_000},
} as const;

export type ObservationChoices = {
  instrument: keyof typeof INSTRUMENTS;
  radio: keyof typeof RADIOS;
  storage: keyof typeof STORAGE;
  dutyFraction: number;
  orbitAltitudeKm: 400 | 700;
  launchSlotKg: 140 | 220 | 500;
  radiatorExtraAreaM2: number;
  batteryExtraWh: number;
};
export const DEFAULT_OBSERVATION: ObservationChoices = {
  instrument:'multispectral',radio:'sband',storage:'16gb',dutyFraction:0.5,
  orbitAltitudeKm:400,launchSlotKg:220,radiatorExtraAreaM2:0.6,batteryExtraWh:200,
};
export type ObservationConfig = {
  choices: ObservationChoices;
  spacecraft: SubsystemDesign;
  launcher: Vehicle;
  completedWithEngine: number;
  technologyDiscount?: number;
  launchService?:LauncherId;
  rocketProgramLevel?:number;
  orbitalAssemblyUnlocked?:boolean;
  priorServiceFlights?:number;
  canadianSuccesses?:number;
  weatherReserveHours?:number;
};
export type Capacity = {name:string;used:number;limit:number;unit:string;context:string;hard:boolean};
export type DayReport = {
  day:number;activeHours:number;generatedMb:number;deliveredMb:number;
  lostMb:number;bufferedMb:number;returnedScience:number;generatedScience:number;
};
export type ObservationPreview = {
  missionResult:SystemResults;
  massKg:number;
  launcherDeltaVMs:number;
  launcherTwr:number;
  launchCapacityKg:number;
  requiredLaunchDeltaVMs:number;
  launchReady:boolean;
  missionCostUsd:number;
  launchManifest:LaunchManifest;
  spacecraftProcurement:HardwareEconomics;
  riskReview:ReturnType<typeof missionRiskSummary>;
  powerLoadW:number;
  powerCapacityW:number;
  thermalLoadW:number;
  thermalCapacityW:number;
  eclipseRequiredWh:number;
  batteryUsableWh:number;
  eclipseDurationHours:number;
  downlinkMbPerDay:number;
  dataMbPerDay:number;
  bufferMb:number;
  scienceGeneratedPotential:number;
  dutyFactor:number;
  effectPower:number;
  effectThermal:number;
  effectEclipse:number;
  scienceRatePerMb:number;
  capacities:Capacity[];
  warnings:string[];
};

export function observationPreview(config:ObservationConfig):ObservationPreview {
  const {choices,spacecraft,launcher}=config;
  const instrument=INSTRUMENTS[choices.instrument],radio=RADIOS[choices.radio],storage=STORAGE[choices.storage];
  if(!instrument||!radio||!storage || ![0.25,0.5,0.75,1].includes(choices.dutyFraction) ||
     ![400,700].includes(choices.orbitAltitudeKm) || ![140,220,500].includes(choices.launchSlotKg) ||
     !Number.isFinite(choices.radiatorExtraAreaM2)||choices.radiatorExtraAreaM2<0||choices.radiatorExtraAreaM2>5||
     !Number.isFinite(choices.batteryExtraWh)||choices.batteryExtraWh<0||choices.batteryExtraWh>3000) {
    throw new Error('Invalid Earth observation options');
  }
  // The lab's generic science payload mass slot is REPLACED by the chosen
  // instrument. Earth orbit is at ~1 AU regardless of lab's heliocentric preset.
  const missionDesign={...spacecraft,payloadMassKg:0,
    payloadInstrumentId:choices.instrument,distanceAu:1};
  const missionResult=sizeSubsystemDesign(missionDesign);
  const pack=BATTERY_PACKS.find(b=>b.id===spacecraft.batteryPackId);
  if(!pack)throw new Error('Unknown battery pack');
  const auxiliaryMassKg=radio.massKg+storage.massKg+
    choices.radiatorExtraAreaM2*RADIATOR_KGM2+choices.batteryExtraWh/pack.specificEnergyWhKg;
  const massKg=missionResult.modeledWetMassKg+auxiliaryMassKg;
  const requiredLaunchDeltaVMs=choices.orbitAltitudeKm===400?9350:9500; // game allowance
  const rated=ENGINES[launcher.engineId];
  const exponent=Math.expm1(requiredLaunchDeltaVMs/(rated.ispSeconds*STANDARD_GRAVITY_MS2));
  const deltaVPayloadKg=Math.max(0,launcher.propellantMassKg/exponent-launcher.dryMassKg);
  const twrPayloadKg=Math.max(0,rated.thrustNewtons/(STANDARD_GRAVITY_MS2*MIN_TWR)-
    launcher.dryMassKg-launcher.propellantMassKg);
  // Every observed satellite rides an actual paid rocket service in the same
  // reusable Rocket Fleet as other missions. The guided mission has a limited
  // reserved satellite slot; provider quotes don't imply a whole 22t bay is
  // purchased for a 200kg satellite.
  const launchService=config.launchService??'custom';
  const manifest=planLaunchManifest({
    totalWetKg:massKg,service:launchService,vehicle:launcher,
    tier:config.rocketProgramLevel??0,
    assemblyUnlocked:config.orbitalAssemblyUnlocked??false,
    priorFlights:config.priorServiceFlights??config.completedWithEngine,
    canadianSuccesses:config.canadianSuccesses??0,
  });
  const custom=launchService==='custom';
  const launchCapacityKg=Math.max(0,Math.min(
    choices.launchSlotKg,manifest.capacityKg,
    custom?deltaVPayloadKg:Infinity,custom?twrPayloadKg:Infinity,
  ));
  const liftoff=calculateVehicleMetrics({...launcher,payloadMassKg:massKg});
  const launcherDeltaVMs=custom?liftoff.deltaVms:requiredLaunchDeltaVMs;
  const launcherTwr=custom?liftoff.liftoffTwr:1.2; // service-level assumption, no Falcon ascent propagation
  const fissionDesign=POWER_SYSTEMS[spacecraft.powerSourceId].class==='fission';
  const unverifiedReactorCooling=fissionDesign&&(
    missionResult.powerSystemMassKg===null||
    missionResult.reactorThermalMarginW===null||
    missionResult.reactorThermalMarginW<0);
  const launchReady=massKg<=launchCapacityKg &&manifest.feasible&&
    (custom?(launcherDeltaVMs>=requiredLaunchDeltaVMs&&launcherTwr>=MIN_TWR):true)&&
    !unverifiedReactorCooling;

  const orbitRadiusKm=EARTH.equatorialRadiusKm+choices.orbitAltitudeKm;
  const orbitPeriodHours=2*Math.PI*Math.sqrt(orbitRadiusKm**3/EARTH.gravitationalParameterKm3PerS2)/3600;
  // Circular orbit, worst-case solar beta=0; shadow is an illustrative
  // cylindrical Earth eclipse. Earth axis tilt / season are ignored.
  const eclipseFraction=Math.asin(EARTH.equatorialRadiusKm/orbitRadiusKm)/Math.PI;
  const sunlitFraction=1-eclipseFraction;
  const eclipseDurationHours=orbitPeriodHours*eclipseFraction;
  // No instrument activity during eclipse in this first-order mission.
  const instrumentWithHarnessW=instrument.powerW/0.94;
  const baseHousekeepingW=missionResult.housekeepingPowerW-instrumentWithHarnessW;
  const nasaReserveHours=Math.max(0,Math.min(2,
    Number.isFinite(config.weatherReserveHours)?config.weatherReserveHours??0:0));
  const eclipseRequiredWh=Math.max(0,baseHousekeepingW-
    missionResult.generatorElectricPowerW)*(eclipseDurationHours+nasaReserveHours);
  const batteryUsableWh=(missionResult.storedBatteryEnergyWh+choices.batteryExtraWh)*BATTERY_DOD*BATTERY_EFF;
  // Thrusters do not fire during routine Earth imaging. Their physical mass
  // remains in the launcher payload, but their rated electric power is not
  // continuously charged to imaging/communications.
  const powerCapacityW=missionResult.totalAvailablePowerW;
  const heatBase=baseHousekeepingW+radio.powerW/0.94;
  const powerLoadW=heatBase+instrumentWithHarnessW;
  const thermalLoadW=powerLoadW;
  const thermalCapacityW=Math.max(0,missionResult.radiatorNetFluxWm2)*
    (missionResult.installedRadiatorAreaM2+choices.radiatorExtraAreaM2);
  const effectPower=Math.min(1,Math.max(0,(powerCapacityW-heatBase)/instrumentWithHarnessW));
  const effectThermal=Math.min(1,Math.max(0,(thermalCapacityW-heatBase)/instrumentWithHarnessW));
  const effectEclipse=eclipseRequiredWh<=0?1:
    Math.min(1,batteryUsableWh/eclipseRequiredWh);
  const dutyFactor=effectPower*effectThermal*effectEclipse;
  const availableSunHours=24*sunlitFraction*choices.dutyFraction;
  const activeHours=availableSunHours*dutyFactor;
  const dataMbPerDay=activeHours*instrument.dataMbps*3600;
  const accessHoursPerDay=choices.orbitAltitudeKm===400?1.3:1.85; // simplified single station
  const radioPowerFactor=powerCapacityW>=heatBase?1:0;
  const downlinkMbPerDay=radio.rateMbps*accessHoursPerDay*3600*GROUND_EFFICIENCY*radioPowerFactor;
  const scienceRatePerMb=instrument.sciencePerHour/(instrument.dataMbps*3600);
  const scienceGeneratedPotential=availableSunHours*instrument.sciencePerHour*OBSERVATION_DAYS;
  const spacecraftProcurement=spacecraftHardwareEconomics(spacecraft,config.technologyDiscount??0);
  const missionCostUsd=manifest.launchCostUsd+manifest.assemblyCostUsd+
    spacecraftProcurement.afterDiscountUsd+
    instrument.costUsd+radio.costUsd+storage.costUsd+
    choices.radiatorExtraAreaM2*EXTRA_RADIATOR_USDM2+choices.batteryExtraWh*EXTRA_BATTERY_USDWH+
    choices.launchSlotKg*1500;
  const capacities:Capacity[]=[
    {name:'Launch payload',used:massKg,limit:launchCapacityKg,unit:'kg',hard:true,
      context:'Actual wet spacecraft mass vs reserved slot and rocket capability'},
    {name:'Sunlit electrical demand',used:powerLoadW,limit:powerCapacityW,unit:'W',hard:false,
      context:'Automatic avionics, wing/radiator controls, wiring, radio and instrument; thrusters idle'},
    {name:'Radiator heat rejection',used:thermalLoadW,limit:thermalCapacityW,unit:'W',hard:false,
      context:'Peak electronics heat vs modeled radiative rejection'},
    {name:'Eclipse energy',used:eclipseRequiredWh,limit:batteryUsableWh,unit:'Wh',hard:false,
      context:'Required no-sunlight bus energy vs usable battery reserve'+
        (nasaReserveHours?' · +'+nasaReserveHours+'h game NASA DONKI contingency from recent observations':'')},
    {name:'Daily science downlink',used:dataMbPerDay,limit:downlinkMbPerDay,unit:'Mb/day',hard:false,
      context:'Generated images vs assumed daily ground-contact throughput'},
    {name:'Seven-day mission cost',used:missionCostUsd/1e6,limit:OBSERVATION_BUDGET_USD/1e6,unit:'$M',hard:true,
      context:'Launcher + instrument + communications + storage + upgrades'},
  ];
  const riskReview=missionRiskSummary({
    powerMarginW:powerCapacityW-powerLoadW,
    thermalMarginW:thermalCapacityW-thermalLoadW,
    massMarginKg:launchCapacityKg-massKg,
    moneyMarginUsd:OBSERVATION_BUDGET_USD-missionCostUsd,
    generatorClass:POWER_SYSTEMS[spacecraft.powerSourceId].class,
    hasConceptTech:POWER_SYSTEMS[spacecraft.powerSourceId].heritage==='concept-only',
  });
  const warnings:string[]=[];
  if(missionResult.massEstimateIncomplete)warnings.push('Spacecraft wet mass is a PARTIAL estimate; electric propellant storage and some reactor equipment may be missing.');
  if(!launchReady)warnings.push('Launch is blocked by selected flight service, payload bay allocation, custom rocket performance or unverified reactor cooling. Review mass, Δv, TWR and nuclear heat rejection.');
  if(!custom)warnings.push('The selected external launch service uses an advertised/notional capacity allocation. The ascent vehicle trajectory and liftoff TWR are not computed from the custom rocket equation.');
  if(unverifiedReactorCooling)warnings.push('Fission reactor mass/thermal margin is incomplete or heat rejection is below demand. Add a verified thermal architecture before committing this spacecraft.');
  if(powerLoadW>powerCapacityW)warnings.push('Sunlit power deficit throttles instrument operations. Increase solar area or reduce loads.');
  if(thermalLoadW>thermalCapacityW)warnings.push('Insufficient modeled radiator heat rejection reduces camera duty cycle.');
  if(eclipseRequiredWh>batteryUsableWh)warnings.push('Battery cannot cover the worst-case eclipse. Some observation time is lost to recovery.');
  if(dataMbPerDay>downlinkMbPerDay)warnings.push('Data generation exceeds daily contact capacity; stored images can accumulate.');
  if(missionCostUsd>OBSERVATION_BUDGET_USD)warnings.push('Mission exceeds the program brief budget.');
  if(missionResult.powerSystemWasteHeatW!==null&&missionResult.powerSystemWasteHeatW>0)
    warnings.push(fissionDesign
      ?'Fission waste heat is assigned to the separate conceptual high-temperature radiator branch; real shield, coolant and coupling physics remain unqualified.'
      :'Radioisotope waste heat is not allocated to the bus radiator; isolated source cooling remains to be engineered.');
  return {missionResult,massKg,launcherDeltaVMs,launcherTwr,launchCapacityKg,requiredLaunchDeltaVMs,
    launchReady,missionCostUsd,launchManifest:manifest,spacecraftProcurement,riskReview,
    powerLoadW,powerCapacityW,thermalLoadW,thermalCapacityW,
    eclipseRequiredWh,batteryUsableWh,eclipseDurationHours,downlinkMbPerDay,dataMbPerDay,
    bufferMb:storage.capacityMb,scienceGeneratedPotential,dutyFactor,effectPower,effectThermal,
    effectEclipse,scienceRatePerMb,capacities,warnings};
}

export function simulateObservation(config:ObservationConfig):{
  preview:ObservationPreview;days:DayReport[];scienceReturned:number;
  totalDataLostMb:number;totalDeliveredMb:number;successful:boolean;reasons:string[];
} {
  const preview=observationPreview(config);
  const days:DayReport[]=[];
  let queueMb=0,totalDataLostMb=0,totalDeliveredMb=0,scienceReturned=0;
  for(let day=1;day<=OBSERVATION_DAYS;day++){
    const generatedMb=preview.dataMbPerDay;
    const beforeDownlink=queueMb+generatedMb;
    const lostMb=Math.max(0,beforeDownlink-preview.bufferMb);
    queueMb=Math.min(preview.bufferMb,beforeDownlink);
    const deliveredMb=Math.min(queueMb,preview.downlinkMbPerDay);
    queueMb-=deliveredMb;
    const returnedScience=deliveredMb*preview.scienceRatePerMb*
      (config.choices.orbitAltitudeKm===400?1:0.86);
    days.push({day,activeHours:preview.dataMbPerDay/
      (INSTRUMENTS[config.choices.instrument].dataMbps*3600),
      generatedMb,deliveredMb,lostMb,bufferedMb:queueMb,returnedScience,
      generatedScience:generatedMb*preview.scienceRatePerMb});
    totalDataLostMb+=lostMb;totalDeliveredMb+=deliveredMb;scienceReturned+=returnedScience;
  }
  const reasons=[...preview.warnings];
  if(scienceReturned<SCIENCE_GOAL)
    reasons.push('Only '+scienceReturned.toFixed(1)+' of '+SCIENCE_GOAL+' required science points returned to Earth. Upgrade instruments, radiators, power, data storage or radio.');
  if(totalDataLostMb>0)reasons.push((totalDataLostMb/8000).toFixed(2)+' GB of observations were discarded because onboard storage overflowed.');
  const successful=preview.launchReady&&preview.missionCostUsd<=OBSERVATION_BUDGET_USD&&
    scienceReturned>=SCIENCE_GOAL;
  return {preview,days,scienceReturned,totalDataLostMb,totalDeliveredMb,successful,reasons};
}
