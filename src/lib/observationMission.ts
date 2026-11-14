import { calculateVehicleMetrics, ENGINES, estimateBuildCostUsd, type Vehicle } from './engineering';
import { STANDARD_GRAVITY_MS2, EARTH } from './nasaData';
import { sizeSubsystemDesign, type SubsystemDesign, type SystemResults } from './subsystemDesign';
import { BATTERY_PACKS } from './spacecraftTechnology';

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

export const INSTRUMENTS = {
  compact: {name:'Compact Earth imager',massKg:8, powerW:45,dataMbps:0.025,sciencePerHour:1.2,costUsd:3_000_000,detail:'Low mass / modest images'},
  multispectral: {name:'Multispectral camera',massKg:26,powerW:110,dataMbps:0.12,sciencePerHour:2.5,costUsd:14_000_000,detail:'Balanced science / data volume'},
  hyperspectral: {name:'Hyperspectral mapper',massKg:70,powerW:240,dataMbps:0.4,sciencePerHour:4.5,costUsd:32_000_000,detail:'High-value / high-bandwidth payload'},
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
  const missionDesign={...spacecraft,payloadMassKg:instrument.massKg,distanceAu:1};
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
  // A manifest allocation must fit both the selected payload slot AND
  // physical one-stage ideal payload capacity, never the arbitrary slot alone.
  const launchCapacityKg=Math.max(0,Math.min(
    choices.launchSlotKg,launcher.payloadMassKg,deltaVPayloadKg,twrPayloadKg,
  ));
  const liftoff=calculateVehicleMetrics({...launcher,payloadMassKg:massKg});
  const launcherDeltaVMs=liftoff.deltaVms,launcherTwr=liftoff.liftoffTwr;
  const launchReady=massKg<=launchCapacityKg &&
    launcherDeltaVMs>=requiredLaunchDeltaVMs && launcherTwr>=MIN_TWR;

  const orbitRadiusKm=EARTH.equatorialRadiusKm+choices.orbitAltitudeKm;
  const orbitPeriodHours=2*Math.PI*Math.sqrt(orbitRadiusKm**3/EARTH.gravitationalParameterKm3PerS2)/3600;
  // Circular orbit, worst-case solar beta=0; shadow is an illustrative
  // cylindrical Earth eclipse. Earth axis tilt / season are ignored.
  const eclipseFraction=Math.asin(EARTH.equatorialRadiusKm/orbitRadiusKm)/Math.PI;
  const sunlitFraction=1-eclipseFraction;
  const eclipseDurationHours=orbitPeriodHours*eclipseFraction;
  const eclipseRequiredWh=Math.max(0,spacecraft.busElectricalPowerW-
    missionResult.generatorElectricPowerW)*eclipseDurationHours;
  const batteryUsableWh=(missionResult.storedBatteryEnergyWh+choices.batteryExtraWh)*BATTERY_DOD*BATTERY_EFF;
  // Thrusters do not fire during routine Earth imaging. Their physical mass
  // remains in the launcher payload, but their rated electric power is not
  // continuously charged to imaging/communications.
  const powerCapacityW=missionResult.totalAvailablePowerW;
  const powerLoadW=spacecraft.busElectricalPowerW+radio.powerW+instrument.powerW;
  const heatBase=spacecraft.busElectricalPowerW+radio.powerW;
  const thermalLoadW=heatBase+instrument.powerW;
  const thermalCapacityW=Math.max(0,missionResult.radiatorNetFluxWm2)*
    ((missionResult.radiatorAreaM2??0)+choices.radiatorExtraAreaM2);
  const effectPower=Math.min(1,Math.max(0,(powerCapacityW-
    spacecraft.busElectricalPowerW-radio.powerW)/instrument.powerW));
  const effectThermal=Math.min(1,Math.max(0,(thermalCapacityW-heatBase)/instrument.powerW));
  const effectEclipse=eclipseRequiredWh<=0?1:
    Math.min(1,batteryUsableWh/eclipseRequiredWh);
  const dutyFactor=effectPower*effectThermal*effectEclipse;
  const availableSunHours=24*sunlitFraction*choices.dutyFraction;
  const activeHours=availableSunHours*dutyFactor;
  const dataMbPerDay=activeHours*instrument.dataMbps*3600;
  const accessHoursPerDay=choices.orbitAltitudeKm===400?1.3:1.85; // simplified single station
  const radioPowerFactor=powerCapacityW>=spacecraft.busElectricalPowerW+radio.powerW?1:0;
  const downlinkMbPerDay=radio.rateMbps*accessHoursPerDay*3600*GROUND_EFFICIENCY*radioPowerFactor;
  const scienceRatePerMb=instrument.sciencePerHour/(instrument.dataMbps*3600);
  const scienceGeneratedPotential=availableSunHours*instrument.sciencePerHour*OBSERVATION_DAYS;
  const missionCostUsd=estimateBuildCostUsd(launcher,config.completedWithEngine)+
    instrument.costUsd+radio.costUsd+storage.costUsd+
    choices.radiatorExtraAreaM2*EXTRA_RADIATOR_USDM2+choices.batteryExtraWh*EXTRA_BATTERY_USDWH+
    choices.launchSlotKg*1500;
  const capacities:Capacity[]=[
    {name:'Launch payload',used:massKg,limit:launchCapacityKg,unit:'kg',hard:true,
      context:'Actual wet spacecraft mass vs reserved slot and rocket capability'},
    {name:'Sunlit electrical demand',used:powerLoadW,limit:powerCapacityW,unit:'W',hard:false,
      context:'Housekeeping + radio + instrument, excluding idle thrusters'},
    {name:'Radiator heat rejection',used:thermalLoadW,limit:thermalCapacityW,unit:'W',hard:false,
      context:'Peak electronics heat vs modeled radiative rejection'},
    {name:'Eclipse energy',used:eclipseRequiredWh,limit:batteryUsableWh,unit:'Wh',hard:false,
      context:'Required no-sunlight bus energy vs usable battery reserve'},
    {name:'Daily science downlink',used:dataMbPerDay,limit:downlinkMbPerDay,unit:'Mb/day',hard:false,
      context:'Generated images vs assumed daily ground-contact throughput'},
    {name:'Seven-day mission cost',used:missionCostUsd/1e6,limit:OBSERVATION_BUDGET_USD/1e6,unit:'$M',hard:true,
      context:'Launcher + instrument + communications + storage + upgrades'},
  ];
  const warnings:string[]=[];
  if(missionResult.massEstimateIncomplete)warnings.push('Spacecraft wet mass is a PARTIAL estimate; electric propellant storage and some reactor equipment may be missing.');
  if(!launchReady)warnings.push('Launch payload exceeds the allocation or ideal rocket performance. Increase mass allowance or redesign.');
  if(powerLoadW>powerCapacityW)warnings.push('Sunlit power deficit throttles instrument operations. Increase solar area or reduce loads.');
  if(thermalLoadW>thermalCapacityW)warnings.push('Insufficient modeled radiator heat rejection reduces camera duty cycle.');
  if(eclipseRequiredWh>batteryUsableWh)warnings.push('Battery cannot cover the worst-case eclipse. Some observation time is lost to recovery.');
  if(dataMbPerDay>downlinkMbPerDay)warnings.push('Data generation exceeds daily contact capacity; stored images can accumulate.');
  if(missionCostUsd>OBSERVATION_BUDGET_USD)warnings.push('Mission exceeds the program brief budget.');
  if(missionResult.powerSystemWasteHeatW!==null&&missionResult.powerSystemWasteHeatW>0)
    warnings.push('Radioisotope/reactor waste heat and integration are not fully captured by the bus radiator budget.');
  return {missionResult,massKg,launcherDeltaVMs,launcherTwr,launchCapacityKg,requiredLaunchDeltaVMs,
    launchReady,missionCostUsd,powerLoadW,powerCapacityW,thermalLoadW,thermalCapacityW,
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
