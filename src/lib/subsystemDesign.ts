import {
  BATTERY_PACKS, IN_SPACE_THRUSTERS, SOLAR_CELLS, THERMAL_SURFACES,
} from './spacecraftTechnology';
import { getPowerOutput, POWER_SYSTEMS, type PowerSourceId } from './powerSources';
import { getInstrument, type InstrumentSelection } from './instrumentCatalog';
import { estimatePropellantTank, type TankReport, type PropellantKind } from './propellantTanks';
import {
  idealDeltaVms, idealBurnDurationSeconds, solarArrayPowerW, batteryMassForEclipseKg,
} from './spacecraftSystems';

export type ThrusterId =
  'mono-reference'|'busek-bht100'|'busek-bht200'|'busek-bit3'|
  'nstar'|'next-c'|'t6'|'spt-140';
export type SubsystemDesign = {
  thrusterId:ThrusterId;
  thrusterCount:number;
  /** Optional second, independent propulsion subsystem and propellant supply. */
  secondaryThrusterId:'none'|ThrusterId;
  secondaryThrusterCount:number;
  secondaryPropellantMassKg:number;
  burnOrder:'primary-first'|'secondary-first';
  solarWingCount:number;
  radiatorPanelCount:number;
  installedRadiatorAreaM2:number;
  solarCellId:string;
  batteryPackId:string;
  coatingId:string;
  powerSourceId:PowerSourceId;
  powerSourceCount:number;
  missionYears:number;
  distanceAu:number;
  cellAreaM2:number;
  propellantMassKg:number;
  busDryMassKg:number;
  /** Additional cargo/instrument accommodation beyond selected catalogue instrument. */
  payloadMassKg:number;
  payloadInstrumentId:InstrumentSelection;
  /** Base housekeeping avionics; selected instrument/control/wiring loads are automatic. */
  busElectricalPowerW:number;
  eclipseHours:number;
  liquidDensityKgM3:number; // legacy advanced field, no longer overrides chemical propellant identity
  tankPressureBar:number;
  xenonStoragePressureBar:number;
  tankAllowableStressMpa:number;
  tankMetalDensityKgM3:number;
  tankType:'diaphragm'|'bellows'|'capillary';
  infraredEmissivity:number;
  radiatorTemperatureK:number;
  radiatorSunIncidence:number;
};

export const DEFAULT_SUBSYSTEM_DESIGN:SubsystemDesign={
  thrusterId:'busek-bht200',
  thrusterCount:1,
  secondaryThrusterId:'none',
  secondaryThrusterCount:1,
  secondaryPropellantMassKg:1,
  burnOrder:'primary-first',
  solarWingCount:2,
  radiatorPanelCount:2,
  installedRadiatorAreaM2:.45,
  solarCellId:'azur-3g30',
  batteryPackId:'aac-optimus',
  coatingId:'gsfc-silver',
  powerSourceId:'solar',
  powerSourceCount:1,
  missionYears:0,
  distanceAu:1,
  cellAreaM2:4,
  propellantMassKg:5,
  busDryMassKg:100,
  payloadMassKg:20,
  payloadInstrumentId:'none',
  busElectricalPowerW:90,
  eclipseHours:.6,
  liquidDensityKgM3:1000,
  tankPressureBar:20,
  xenonStoragePressureBar:180,
  tankAllowableStressMpa:150,
  tankMetalDensityKgM3:2700,
  tankType:'diaphragm',
  infraredEmissivity:.85,
  radiatorTemperatureK:300,
  radiatorSunIncidence:.2,
};

export const DESTINATIONS=[
  {name:'Earth region',distanceAu:1},
  {name:'Mars region',distanceAu:1.52},
  {name:'Main asteroid belt',distanceAu:2.7},
  {name:'Jupiter region',distanceAu:5.2},
  {name:'Pluto region',distanceAu:39.5},
] as const;

export type EngineMode={
  id:ThrusterId;
  name:string;
  count:number;
  kind:PropellantKind;
  propellantKg:number;
  thrustN:number;
  ispSeconds:number;
  thrusterInputW:number;
  completePropulsionPowerW:number;
  feedTank:TankReport;
  nominalBurnDays:number;
  canPowerAtRatedPoint:boolean;
  sourceUrl:string;
};

export type SystemResults={
  isElectric:boolean;
  engineName:string;
  engineSourceUrl:string;
  engineSpecificImpulseS:number;
  engineThrustN:number;
  nominalThrusterPowerW:number;
  totalElectricalDemandW:number;
  sunlightPowerW:number;
  generatorElectricPowerW:number;
  powerSystemMassKg:number|null;
  powerSystemWasteHeatW:number|null;
  powerSystemHeritage:string;
  totalAvailablePowerW:number;
  totalPowerMarginW:number;
  sunlightMarginW:number;
  canPowerThruster:boolean;
  batteryMassKg:number;
  storedBatteryEnergyWh:number;
  thermalLoadW:number;
  radiatorAreaM2:number|null;
  installedRadiatorAreaM2:number;
  radiatorCapacityW:number;
  thermalMarginW:number;
  radiatorMassKg:number|null;
  absorbedSolarFluxWm2:number;
  radiatorNetFluxWm2:number;
  tankShellMassKg:number|null;
  tankInternalVolumeL:number|null;
  tankRadiusM:number|null;
  tankWallMm:number|null;
  tankTypeAllowanceKg:number;
  tankThinWallSuitable:boolean|null;
  modeledDryMassKg:number;
  modeledWetMassKg:number;
  idealDeltaVms:number;
  idealBurnDays:number;
  lowThrustAccelerationMmS2:number;
  massEstimateIncomplete:boolean;
  warnings:string[];
  /** New automatic, traceable systems ledger. */
  primaryMode:EngineMode;
  secondaryMode:EngineMode|null;
  tankReports:TankReport[];
  totalPropellantKg:number;
  arrayMassKg:number;
  radiatorMountMassKg:number;
  instrumentMassKg:number;
  instrumentPowerW:number;
  baseBusPowerW:number;
  wingControlPowerW:number;
  radiatorControlPowerW:number;
  harnessLossW:number;
  housekeepingPowerW:number;
  propulsionPeakPowerW:number;
  instrumentName:string;
  engineHardwareMassKg:number;
  totalTankHardwareMassKg:number;
  massBreakdown:{label:string;massKg:number}[];
};

const BOL_ARRAY_DERATE=.75;
const DOD=.8;
const DISCHARGE_EFFICIENCY=.9;
const ARRAY_AREAL_MASS_KGM2=2.5;
const RADIATOR_AREAL_MASS_KGM2=4;
const PPU_EFFICIENCY=.88;
const ELECTRIC_SYSTEM_ALLOWANCE_KG=6;
const CHEMICAL_COMPONENT_MASS_KG=3;
const CHEMICAL_VALVE_POWER_W=8;
const STEFAN_BOLTZMANN=5.670374419e-8;
const SOLAR_IRRADIANCE=1361.6;
const HARNESS_EFFICIENCY=.94;
const WING_CONTROL_W=1.5;
const RADIATOR_SENSOR_W=.65;

function thruster(id:ThrusterId){
  if(id==='mono-reference')return {
    name:'Illustrative 1 N hydrazine-class monopropellant',
    kind:'hydrazine' as PropellantKind,
    isp:230,thrust:1,watts:0,massKg:CHEMICAL_COMPONENT_MASS_KG,
    isElectric:false,powerAlreadyIncludesPPU:false,
    source:'https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/',
    reportedMass:false,
  };
  const data=IN_SPACE_THRUSTERS.find(t=>t.id===id);
  if(!data)throw new Error('Unknown spacecraft thruster selected');
  return {
    name:data.name,kind:(data.propellant==='Iodine'?'iodine':'xenon') as PropellantKind,
    isp:data.nominalSpecificImpulseSeconds,thrust:data.nominalThrustN,
    watts:data.nominalThrusterPowerW,
    massKg:data.massScope==='thruster-only'?data.reportedMassKg??0:0,
    isElectric:true,powerAlreadyIncludesPPU:data.powerScope==='ppu-input',
    source:data.source.url,reportedMass:data.massScope==='thruster-only',
  };
}

export function sizeSubsystemDesign(design:SubsystemDesign):SystemResults {
  const cell=SOLAR_CELLS.find(c=>c.id===design.solarCellId);
  const battery=BATTERY_PACKS.find(b=>b.id===design.batteryPackId);
  const coating=THERMAL_SURFACES.find(c=>c.id===design.coatingId);
  const instrument=getInstrument(design.payloadInstrumentId);
  if(!cell||!battery||!coating||
    (design.payloadInstrumentId!=='none'&&!instrument))throw new Error('Unknown spacecraft component');

  const inputNumbers=[
    design.distanceAu,design.cellAreaM2,design.propellantMassKg,
    design.secondaryPropellantMassKg,design.thrusterCount,
    design.secondaryThrusterCount,design.solarWingCount,design.radiatorPanelCount,
    design.installedRadiatorAreaM2,
    design.busDryMassKg,design.payloadMassKg,design.busElectricalPowerW,
    design.eclipseHours,design.powerSourceCount,design.missionYears,
    design.liquidDensityKgM3,design.tankPressureBar,design.xenonStoragePressureBar,
    design.tankAllowableStressMpa,design.tankMetalDensityKgM3,
    design.infraredEmissivity,design.radiatorTemperatureK,design.radiatorSunIncidence,
  ];
  if(inputNumbers.some(n=>!Number.isFinite(n)) || design.distanceAu<=0 ||
    design.busDryMassKg<=0||design.cellAreaM2<0||
    design.installedRadiatorAreaM2<0||design.installedRadiatorAreaM2>250||
    design.propellantMassKg<=0||
    design.secondaryPropellantMassKg<=0||design.payloadMassKg<0||
    design.busElectricalPowerW<0||design.eclipseHours<0||
    design.infraredEmissivity<=0||design.infraredEmissivity>1||
    design.radiatorSunIncidence<0||design.radiatorSunIncidence>1||
    design.radiatorTemperatureK<=0||
    ![design.thrusterCount,design.secondaryThrusterCount,
      design.solarWingCount,design.radiatorPanelCount].every(n=>Number.isInteger(n)&&n>=1&&n<=8)||
    !Number.isInteger(design.powerSourceCount)||
    design.powerSourceCount<1||design.powerSourceCount>8||
    design.missionYears<0||design.missionYears>40||
    !POWER_SYSTEMS[design.powerSourceId]||
    !['none','mono-reference',...IN_SPACE_THRUSTERS.map(t=>t.id)].includes(design.secondaryThrusterId)||
    !['primary-first','secondary-first'].includes(design.burnOrder))
    throw new RangeError('Spacecraft design contains nonphysical inputs');

  const p=thruster(design.thrusterId);
  const secondaryEnabled=design.secondaryThrusterId!=='none';
  const s=secondaryEnabled?thruster(design.secondaryThrusterId as ThrusterId):null;
  const additionalFuel=secondaryEnabled?design.secondaryPropellantMassKg:0;
  const tankOptions={
    chemicalPressureBar:design.tankPressureBar,
    xenonPressureBar:design.xenonStoragePressureBar,
    allowableStressMpa:design.tankAllowableStressMpa,
    shellDensityKgM3:design.tankMetalDensityKgM3,
    tankType:design.tankType,
  };
  const pt=estimatePropellantTank({...tankOptions,kind:p.kind,propellantKg:design.propellantMassKg});
  const st=s?estimatePropellantTank({...tankOptions,kind:s.kind,propellantKg:additionalFuel}):null;
  const tankReports=[pt,...(st?[st]:[])];

  const wingControlPowerW=design.solarWingCount*WING_CONTROL_W;
  const radiatorControlPowerW=design.radiatorPanelCount*RADIATOR_SENSOR_W;
  const instrumentPowerW=instrument?.powerW??0;
  const baseBusPowerW=design.busElectricalPowerW;
  const electricalBase=baseBusPowerW+wingControlPowerW+radiatorControlPowerW+instrumentPowerW;
  const harnessLoadW=electricalBase*(1/HARNESS_EFFICIENCY-1);
  const housekeepingPowerW=electricalBase+harnessLoadW;
  // Two installed engines need not (and often cannot) operate at once.
  // In engineering analysis we assume one propulsion family fires at a time.
  function enginePower(watts:number,isElectric:boolean,count:number,busInputReported:boolean){
    if(!isElectric)return CHEMICAL_VALVE_POWER_W*count;
    // NEXT-C publishes PPU input directly; do NOT apply PPU losses twice.
    return busInputReported?watts*count:watts*count/PPU_EFFICIENCY;
  }
  const pp=enginePower(p.watts,p.isElectric,design.thrusterCount,p.powerAlreadyIncludesPPU);
  const sp=s?enginePower(s.watts,s.isElectric,design.secondaryThrusterCount,s.powerAlreadyIncludesPPU):0;
  const propulsionPeakPowerW=Math.max(pp,sp)*(1/HARNESS_EFFICIENCY);
  const totalElectricalDemandW=housekeepingPowerW+propulsionPeakPowerW;
  const harnessLossW=harnessLoadW+propulsionPeakPowerW*Math.max(0,1-HARNESS_EFFICIENCY);
  const sunlightPowerW=solarArrayPowerW({
    cellAreaM2:design.cellAreaM2,bolEfficiency:cell.efficiencyBOL,
    distanceAu:design.distanceAu,incidenceCosine:1,userDeratingFactor:BOL_ARRAY_DERATE,
  });
  const power=getPowerOutput(design.powerSourceId,design.powerSourceCount,design.missionYears);
  const generatorElectricPowerW=power.generatedElectricW;
  const totalAvailablePowerW=sunlightPowerW+generatorElectricPowerW;
  const totalPowerMarginW=totalAvailablePowerW-totalElectricalDemandW;
  const sunlightMarginW=sunlightPowerW-totalElectricalDemandW;

  const batteryMassKg=batteryMassForEclipseKg({
    eclipseLoadW:Math.max(0,housekeepingPowerW-generatorElectricPowerW),
    eclipseHours:design.eclipseHours,packSpecificEnergyWhKg:battery.specificEnergyWhKg,
    maxDepthOfDischarge:DOD,dischargeEfficiency:DISCHARGE_EFFICIENCY,
  });
  const storedBatteryEnergyWh=batteryMassKg*battery.specificEnergyWhKg;
  const propulsionHeat=(engine:ReturnType<typeof thruster>,powerW:number,count:number)=>{
    if(!engine.isElectric)return powerW;
    const dischargeW=engine.watts*count*(engine.powerAlreadyIncludesPPU?PPU_EFFICIENCY:1);
    return powerW-dischargeW+.1*dischargeW;
  };
  const propulsionHeatW=Math.max(propulsionHeat(p,pp,design.thrusterCount),
    s?propulsionHeat(s,sp,design.secondaryThrusterCount):0);
  const thermalLoadW=housekeepingPowerW+propulsionHeatW;
  const solarFluxWm2=SOLAR_IRRADIANCE/design.distanceAu**2;
  const absorbedSolarFluxWm2=solarFluxWm2*coating.solarAbsorptivityBOL*design.radiatorSunIncidence;
  const radiatorNetFluxWm2=
    design.infraredEmissivity*STEFAN_BOLTZMANN*(design.radiatorTemperatureK**4-3**4)
    -absorbedSolarFluxWm2;
  const radiatorAreaM2=radiatorNetFluxWm2>0?thermalLoadW/radiatorNetFluxWm2:null;
  // Installed radiator area is a player-design choice. Required area is a
  // target, not a magically fitted component that always satisfies capacity.
  const radiatorCapacityW=Math.max(0,radiatorNetFluxWm2)*design.installedRadiatorAreaM2;
  const thermalMarginW=radiatorCapacityW-thermalLoadW;
  const radiatorMassKg=design.installedRadiatorAreaM2*RADIATOR_AREAL_MASS_KGM2;

  const arrayMassKg=design.cellAreaM2*ARRAY_AREAL_MASS_KGM2+design.solarWingCount*.5;
  const radiatorMountMassKg=design.radiatorPanelCount*.35;
  function hwMass(v:ReturnType<typeof thruster>,count:number){
    return count*v.massKg+(v.isElectric?ELECTRIC_SYSTEM_ALLOWANCE_KG:0)*count;
  }
  const engineHardwareMassKg=hwMass(p,design.thrusterCount)+
    (s?hwMass(s,design.secondaryThrusterCount):0);
  const totalTankHardwareMassKg=tankReports.reduce((v,t)=>v+t.totalHardwareKg,0);
  const instrumentMassKg=instrument?.massKg??0;
  const modeledDryMassKg=design.busDryMassKg+design.payloadMassKg+instrumentMassKg+
    arrayMassKg+batteryMassKg+(radiatorMassKg??0)+radiatorMountMassKg+
    engineHardwareMassKg+totalTankHardwareMassKg+(power.installedGeneratorMassKg??0);
  const totalPropellantKg=design.propellantMassKg+additionalFuel;
  const modeledWetMassKg=modeledDryMassKg+totalPropellantKg;

  const dvPrimary=(startMass:number)=>
    idealDeltaVms(startMass,startMass-design.propellantMassKg,p.isp);
  const dvSecondary=(startMass:number)=>
    s?idealDeltaVms(startMass,startMass-additionalFuel,s.isp):0;
  const idealDeltaV= s && design.burnOrder==='secondary-first'
    ? dvSecondary(modeledWetMassKg)+dvPrimary(modeledWetMassKg-additionalFuel)
    : dvPrimary(modeledWetMassKg)+
      (s?dvSecondary(modeledWetMassKg-design.propellantMassKg):0);
  const idealBurnSeconds=idealBurnDurationSeconds(design.propellantMassKg,
    p.thrust*design.thrusterCount,p.isp);

  const makeMode=(id:ThrusterId,v:ReturnType<typeof thruster>,count:number,
    propellantKg:number,tank:TankReport,powerW:number):EngineMode=>({
    id,name:v.name,count,kind:v.kind,propellantKg,
    thrustN:v.thrust*count,ispSeconds:v.isp,thrusterInputW:v.watts*count,
    completePropulsionPowerW:powerW/HARNESS_EFFICIENCY,
    feedTank:tank,
    nominalBurnDays:idealBurnDurationSeconds(propellantKg,v.thrust*count,v.isp)/86400,
    canPowerAtRatedPoint:totalAvailablePowerW>=housekeepingPowerW+powerW/HARNESS_EFFICIENCY,
    sourceUrl:v.source,
  });
  const primaryMode=makeMode(design.thrusterId,p,design.thrusterCount,
    design.propellantMassKg,pt,pp);
  const secondaryMode=s&&st?makeMode(design.secondaryThrusterId as ThrusterId,s,
    design.secondaryThrusterCount,additionalFuel,st,sp):null;

  const warnings:string[]=[];
  const isElectric=p.isElectric||!!s?.isElectric;
  const massEstimateIncomplete=isElectric||radiatorMassKg===null||
    power.installedGeneratorMassKg===null||POWER_SYSTEMS[design.powerSourceId].class==='fission';
  if(isElectric)warnings.push('Dense xenon/iodine feed and power-processing hardware masses use allowances, not a validated manufacturer system mass. Treat total mass as preliminary.');
  if(design.thrusterCount>1||(s&&design.secondaryThrusterCount>1))warnings.push('Thrusters of each family are assumed to fire concurrently; duty cycle and plume interactions remain unverified.');
  if(s)warnings.push('Dual propulsion uses separate propellant stores and SEQUENTIAL idealized burns. Both engines are installed; only one family runs at any instant.');
  if(!primaryMode.canPowerAtRatedPoint||
    (secondaryMode&&!secondaryMode.canPowerAtRatedPoint))
    warnings.push('One or more propulsion modes exceed available generator output. Nominal thrust requires a lower-power throttle point or a larger power system.');
  if(design.powerSourceId!=='solar'){
    warnings.push(POWER_SYSTEMS[design.powerSourceId].note);
    warnings.push('Generator waste heat is reported separately and is NOT automatically assigned to the bus radiator. Dedicated source heat rejection, thermal coupling and mounting are not fully modeled.');
  }
  if(power.installedGeneratorMassKg===null)warnings.push('Generator hardware mass is unknown and omitted from this preliminary wet/dry roll-up.');
  if(POWER_SYSTEMS[design.powerSourceId].class==='fission')
    warnings.push('Reactor shielding, heat rejection, approval, separation distances and flight readiness are not modeled.');
  if(radiatorAreaM2===null)warnings.push('Net radiator flux is negative or zero: heat cannot be rejected under current assumptions.');
  if(thermalMarginW<0)warnings.push('Installed radiator area is insufficient for the modeled peak heat load. Increase installed thermal area or reduce active power.');
  if(design.distanceAu>=5)warnings.push('Solar power decreases with inverse-square Sun distance; revisit array area and power source.');
  for(const t of tankReports){
    if(t.validThinWall===false)warnings.push(t.label+': adopted wall is outside the thin-wall approximation.');
    warnings.push(t.note);
  }
  warnings.push('Tank spherical tmin is membrane sizing with assumed 85% joint efficiency and a manufacturing floor, NOT an ASME VIII or spacecraft pressure-vessel qualification.');

  const massBreakdown=[
    {label:'Bus and other cargo',massKg:design.busDryMassKg+design.payloadMassKg},
    {label:'Selected science instrument',massKg:instrumentMassKg},
    {label:'Solar arrays + deployable mounts',massKg:arrayMassKg},
    {label:'Eclipse battery',massKg:batteryMassKg},
    {label:'Thermal panels + mounts',massKg:(radiatorMassKg??0)+radiatorMountMassKg},
    {label:'Thruster hardware / PPU allowances',massKg:engineHardwareMassKg},
    {label:'Propellant tanks + feeds',massKg:totalTankHardwareMassKg},
    {label:'Additional power generators',massKg:power.installedGeneratorMassKg??0},
    {label:'Primary and secondary propellants',massKg:totalPropellantKg},
  ];
  return {
    isElectric,engineName:p.name+(design.thrusterCount>1?' ×'+design.thrusterCount:''),
    engineSourceUrl:p.source,engineSpecificImpulseS:p.isp,engineThrustN:primaryMode.thrustN,
    nominalThrusterPowerW:p.watts*design.thrusterCount,
    totalElectricalDemandW,sunlightPowerW,generatorElectricPowerW,
    powerSystemMassKg:power.installedGeneratorMassKg,
    powerSystemWasteHeatW:power.generatorWasteHeatW,
    powerSystemHeritage:power.heritage,totalAvailablePowerW,totalPowerMarginW,sunlightMarginW,
    canPowerThruster:primaryMode.canPowerAtRatedPoint&&(!secondaryMode||secondaryMode.canPowerAtRatedPoint),
    batteryMassKg,storedBatteryEnergyWh,thermalLoadW,radiatorAreaM2,
    installedRadiatorAreaM2:design.installedRadiatorAreaM2,radiatorCapacityW,thermalMarginW,
    radiatorMassKg,
    absorbedSolarFluxWm2,radiatorNetFluxWm2,
    tankShellMassKg:pt.kind==='iodine'?null:pt.shellMassKg,
    tankInternalVolumeL:pt.internalVolumeL,tankRadiusM:pt.radiusM,
    tankWallMm:pt.adoptedWallMm,tankTypeAllowanceKg:pt.feedHardwareKg,
    tankThinWallSuitable:pt.validThinWall,
    modeledDryMassKg,modeledWetMassKg,idealDeltaVms:idealDeltaV,
    idealBurnDays:idealBurnSeconds/86400,
    lowThrustAccelerationMmS2:primaryMode.thrustN/modeledWetMassKg*1000,
    massEstimateIncomplete,warnings,primaryMode,secondaryMode,tankReports,
    totalPropellantKg,arrayMassKg,radiatorMountMassKg,instrumentMassKg,
    instrumentPowerW,baseBusPowerW,wingControlPowerW,radiatorControlPowerW,
    harnessLossW,housekeepingPowerW,propulsionPeakPowerW,
    instrumentName:instrument?.name??'None installed',
    engineHardwareMassKg,totalTankHardwareMassKg,massBreakdown,
  };
}
