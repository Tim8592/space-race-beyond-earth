/**
 * Constant nominal thrust / Isp propulsion ledger with finite propellant and time.
 * All installed hardware and unburned fuel remain aboard. A burn decreases mass
 * continuously through mdot = F/(g0 Isp), and integrates exactly via the
 * Tsiolkovsky logarithm. This is NOT a finite-thrust trajectory integrator.
 * 
 * Electric thrusters cannot be assumed to throttle to arbitrary power at fixed
 * Isp; the budget permits only an integer number of rated engines at a time.
 * Mode families fire sequentially. The duty fraction represents deliberate
 * unavailable/coasting time, not an efficiency bonus.
 */
import {STANDARD_GRAVITY_MS2} from './nasaData';
import {idealDeltaVms,massFlowKgPerSecond} from './spacecraftSystems';

export const DEFAULT_BURN_DUTY_FRACTION=.85;
const SECONDS_PER_DAY=86_400;

export type PropulsionBurnMode={
  id:string;name:string;installedEngines:number;thrustPerEngineN:number;
  ispSeconds:number;propellantKg:number;busPowerPerEngineW:number;
};
export type PropulsionBurnPhase={
  id:string;name:string;installedEngines:number;activeEngines:number;
  nominalThrustN:number;activeThrustN:number;nominalMassFlowKgS:number;
  activeMassFlowKgS:number;availablePowerW:number;nominalPowerW:number;
  propellantStartKg:number;propellantBurnedKg:number;propellantRemainingKg:number;
  burnStartDays:number;elapsedCalendarDays:number;activeBurnDays:number;
  fullTankCalendarDays:number;startMassKg:number;endMassKg:number;
  deltaVms:number;initialAccelerationMmS2:number;finalAccelerationMmS2:number;
};
export type BurnSample={
  day:number;wetMassKg:number;propellantRemainingKg:number;
  deltaVms:number;
};
export type PropulsionBurnResult={
  idealDeltaVms:number;deliveredDeltaVms:number;burnedPropellantKg:number;
  remainingPropellantKg:number;wetMassAfterKg:number;windowDays:number;
  dutyFraction:number;phases:PropulsionBurnPhase[];samples:BurnSample[];
};
export function evaluatePropulsionBurn(args:{
  initialWetMassKg:number;windowDays:number;powerBudgetW:number;
  modes:readonly PropulsionBurnMode[];dutyFraction?:number;
}):PropulsionBurnResult{
  const {initialWetMassKg,windowDays,powerBudgetW,modes}=args;
  const dutyFraction=args.dutyFraction??DEFAULT_BURN_DUTY_FRACTION;
  if(!Number.isFinite(initialWetMassKg)||initialWetMassKg<=0||
    !Number.isFinite(windowDays)||windowDays<0||windowDays>50_000||
    !Number.isFinite(powerBudgetW)||powerBudgetW<0||
    !Number.isFinite(dutyFraction)||dutyFraction<=0||dutyFraction>1)
    throw new RangeError('Invalid propulsion burn window, mass, power or duty fraction');
  if(modes.some(m=>!Number.isInteger(m.installedEngines)||m.installedEngines<1||
    !Number.isFinite(m.thrustPerEngineN)||m.thrustPerEngineN<=0||
    !Number.isFinite(m.ispSeconds)||m.ispSeconds<=0||
    !Number.isFinite(m.propellantKg)||m.propellantKg<0||
    !Number.isFinite(m.busPowerPerEngineW)||m.busPowerPerEngineW<0))
    throw new RangeError('Invalid thruster operating point');
  const startingPropellant=modes.reduce((s,m)=>s+m.propellantKg,0);
  if(initialWetMassKg<=startingPropellant)throw new RangeError('Wet mass must include nonzero dry mass');

  let idealMass=initialWetMassKg, idealDeltaV=0;
  for(const m of modes){
    if(m.propellantKg>0){
      idealDeltaV+=idealDeltaVms(idealMass,idealMass-m.propellantKg,m.ispSeconds);
      idealMass-=m.propellantKg;
    }
  }
  let currentMass=initialWetMassKg, remainingDays=windowDays,totalDeltaV=0;
  const phases:PropulsionBurnPhase[]=[];
  let elapsed=0;
  for(const mode of modes){
    const count=mode.busPowerPerEngineW===0?mode.installedEngines:
      Math.min(mode.installedEngines,Math.floor((powerBudgetW+1e-9)/mode.busPowerPerEngineW));
    const activeEngines=Math.max(0,count);
    const thrustN=activeEngines*mode.thrustPerEngineN;
    const nominalThrustN=mode.installedEngines*mode.thrustPerEngineN;
    const nominalFlow=massFlowKgPerSecond(nominalThrustN,mode.ispSeconds);
    const activeFlow=massFlowKgPerSecond(thrustN,mode.ispSeconds);
    const fullDays=activeFlow>0?mode.propellantKg/(activeFlow*dutyFraction*SECONDS_PER_DAY):
      Number.POSITIVE_INFINITY;
    const calendarDays=activeFlow>0?Math.min(remainingDays,fullDays):0;
    const burned=Math.min(mode.propellantKg,activeFlow*dutyFraction*calendarDays*SECONDS_PER_DAY);
    const afterMass=currentMass-burned;
    const dv=burned>0?idealDeltaVms(currentMass,afterMass,mode.ispSeconds):0;
    phases.push({
      id:mode.id,name:mode.name,installedEngines:mode.installedEngines,activeEngines,
      nominalThrustN,activeThrustN:thrustN,nominalMassFlowKgS:nominalFlow,
      activeMassFlowKgS:activeFlow,availablePowerW:powerBudgetW,
      nominalPowerW:mode.busPowerPerEngineW*mode.installedEngines,
      propellantStartKg:mode.propellantKg,propellantBurnedKg:burned,
      propellantRemainingKg:Math.max(0,mode.propellantKg-burned),
      burnStartDays:elapsed,elapsedCalendarDays:calendarDays,
      activeBurnDays:calendarDays*dutyFraction,fullTankCalendarDays:fullDays,
      startMassKg:currentMass,endMassKg:afterMass,deltaVms:dv,
      initialAccelerationMmS2:thrustN/currentMass*1000,
      finalAccelerationMmS2:thrustN/afterMass*1000,
    });
    elapsed+=calendarDays;
    remainingDays=Math.max(0,remainingDays-calendarDays);
    totalDeltaV+=dv;
    currentMass=afterMass;
  }
  const totalBurned=initialWetMassKg-currentMass;
  const samples=Array.from({length:6},(_,i)=>{
    const day=windowDays*i/5;
    let mass=initialWetMassKg, dv=0;
    for(const phase of phases){
      const fractionDays=Math.max(0,Math.min(phase.elapsedCalendarDays,day-phase.burnStartDays));
      const fuelUsed=Math.min(phase.propellantStartKg,
        phase.activeMassFlowKgS*dutyFraction*fractionDays*SECONDS_PER_DAY);
      if(fuelUsed>0){dv+=idealDeltaVms(mass,mass-fuelUsed,
        modes.find(m=>m.id===phase.id)!.ispSeconds);mass-=fuelUsed;}
    }
    return {day,wetMassKg:mass,
      propellantRemainingKg:startingPropellant-(initialWetMassKg-mass),deltaVms:dv};
  });
  return {idealDeltaVms:idealDeltaV,deliveredDeltaVms:totalDeltaV,
    burnedPropellantKg:totalBurned,
    remainingPropellantKg:startingPropellant-totalBurned,
    wetMassAfterKg:currentMass,windowDays,dutyFraction,phases,samples};
}
