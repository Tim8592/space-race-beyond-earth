/**
 * Physical flight-viewer geometry, separate from accelerated visual playback.
 * - Earth parking/elliptical orbit: Earth-centered Kepler two-body propagation.
 * - Lunar: Earth-centered injection conic from 400 km to mean lunar radius,
 *   timed to its first apogee. Moon is an APPROXIMATE circular phase-target.
 * - Interplanetary fallback: Sun-centered Hohmann Kepler ellipse from real
 *   departure Earth position. It is NOT a solved planetary intercept.
 * Sources: JPL GM https://ssd.jpl.nasa.gov/astro_par.html,
 * planetary mean elements https://ssd.jpl.nasa.gov/planets/approx_pos.html.
 */
import {EARTH} from './nasaData';
import {earthOrbitAtTime,planetAtDate,solveKepler,type PlanetId} from './orbitalMechanics';

export type PhysicalPoint=[number,number,number];
export type PhysicalTrack={
  points:PhysicalPoint[];
  centralBody:'earth'|'sun';
  model:'earth-kepler'|'lunar-kepler'|'hohmann-kepler';
  modeledFlightDays:number;
  orbitPeriodMinutes?:number;
  destinationRadius:number;
  departureSpeedKmS:number;
  arrivalSpeedKmS:number;
  caveat:string;
};
const DAY_SECONDS=86400;
const AU_KM=149597870.7;
const MU_SUN_KM3S2=132712440018;
const MEAN_LUNAR_DISTANCE_KM=384400;
const MOON_SIDEREAL_PERIOD_DAYS=27.321661;
const BASE_MOON_LONGITUDE_DEG=218.316;
const J2000=Date.UTC(2000,0,1,12,0,0);
const TAU=2*Math.PI;
const finite=(numbers:number[])=>numbers.every(Number.isFinite);
const rotate=(x:number,y:number,angle:number):PhysicalPoint=>
  [x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle),0];
export function moonMeanPositionKm(date:Date):PhysicalPoint{
 const ms=date.getTime();
 if(!Number.isFinite(ms))throw new RangeError('Invalid Moon epoch');
 const days=(ms-J2000)/(DAY_SECONDS*1000);
 const lon=(BASE_MOON_LONGITUDE_DEG*Math.PI/180+
   TAU*days/MOON_SIDEREAL_PERIOD_DAYS);
 return [MEAN_LUNAR_DISTANCE_KM*Math.cos(lon),
   MEAN_LUNAR_DISTANCE_KM*Math.sin(lon),0];
}
export function earthKeplerTrack(options:{
 perigeeAltitudeKm:number;eccentricity:number;samples?:number;argumentPeriapsisDeg?:number;
}):PhysicalTrack{
 const {perigeeAltitudeKm,eccentricity,argumentPeriapsisDeg=0,samples=181}=options;
 if(!Number.isInteger(samples)||samples<20||samples>600)throw new RangeError('Invalid orbit sample count');
 const first=earthOrbitAtTime(perigeeAltitudeKm,eccentricity,0,argumentPeriapsisDeg);
 const points=Array.from({length:samples},(_,i)=>{
   const p=earthOrbitAtTime(perigeeAltitudeKm,eccentricity,
     first.periodMinutes*i/(samples-1),argumentPeriapsisDeg);
   return [p.xKm,p.yKm,0] as PhysicalPoint;
 });
 const apo=earthOrbitAtTime(perigeeAltitudeKm,eccentricity,first.periodMinutes/2,argumentPeriapsisDeg);
 return {points,centralBody:'earth',model:'earth-kepler',
   modeledFlightDays:first.periodMinutes/1440,orbitPeriodMinutes:first.periodMinutes,
   destinationRadius:EARTH.equatorialRadiusKm+first.apogeeAltitudeKm,
   departureSpeedKmS:first.speedKmS,arrivalSpeedKmS:apo.speedKmS,
   caveat:'Two-body Earth gravity only: no J2, atmosphere, station-keeping, thrust, eclipse or orbital plane targeting.'};
}
export function lunarKeplerTrack(departure:Date,samples=181):PhysicalTrack{
 if(!Number.isFinite(departure.getTime()))throw new RangeError('Invalid departure date');
 const perigeeAltitudeKm=400,perigee=EARTH.equatorialRadiusKm+perigeeAltitudeKm;
 const apogee=MEAN_LUNAR_DISTANCE_KM;
 const eccentricity=(apogee-perigee)/(apogee+perigee);
 const a=(apogee+perigee)/2;
 const halfPeriodMinutes=Math.PI*Math.sqrt(a*a*a/EARTH.gravitationalParameterKm3PerS2)/60;
 const arrival=new Date(departure.getTime()+halfPeriodMinutes*60_000);
 const moonAtArrival=moonMeanPositionKm(arrival);
 const argPeriapsisDeg=Math.atan2(moonAtArrival[1],moonAtArrival[0])*180/Math.PI-180;
 if(!Number.isInteger(samples)||samples<20||samples>600)throw new RangeError('Invalid lunar sample count');
 const points=Array.from({length:samples},(_,i)=>{
   const p=earthOrbitAtTime(perigeeAltitudeKm,eccentricity,
     halfPeriodMinutes*i/(samples-1),argPeriapsisDeg);
   return [p.xKm,p.yKm,0] as PhysicalPoint;
 });
 const first=earthOrbitAtTime(perigeeAltitudeKm,eccentricity,0,argPeriapsisDeg);
 const last=earthOrbitAtTime(perigeeAltitudeKm,eccentricity,halfPeriodMinutes,argPeriapsisDeg);
 return {points,centralBody:'earth',model:'lunar-kepler',
   modeledFlightDays:halfPeriodMinutes/1440,orbitPeriodMinutes:2*halfPeriodMinutes,
   destinationRadius:apogee,departureSpeedKmS:first.speedKmS,arrivalSpeedKmS:last.speedKmS,
   caveat:'An Earth-centered patched-conic injection coast to lunar distance, phase-aimed at a mean circular Moon orbit. No three-body encounter, lunar orbit insertion, descent or landing solution.'};
}
export function hohmannTrack(departure:Date,target:'mars'|'jupiter'|'asteroid',samples=181):PhysicalTrack{
 if(!Number.isFinite(departure.getTime())||!Number.isInteger(samples)||samples<20||samples>600)
   throw new RangeError('Invalid Sun-centered transfer inputs');
 const earth=planetAtDate('earth',departure);
 const rp=Math.hypot(earth.xAu,earth.yAu);
 const ra=target==='asteroid'?1.35:target==='mars'?1.52371034:5.202887;
 const a=(rp+ra)/2,e=(ra-rp)/(ra+rp);
 if(e<0||e>=1)throw new RangeError('Hohmann target must be beyond Earth');
 const speed=Math.sqrt(MU_SUN_KM3S2/AU_KM**3)*DAY_SECONDS;
 const meanMotionDay=speed/Math.sqrt(a**3);
 const tDays=Math.PI/meanMotionDay;
 const arg=Math.atan2(earth.yAu,earth.xAu);
 const points=Array.from({length:samples},(_,i)=>{
   const E=solveKepler(Math.PI*i/(samples-1),e);
   const x=a*(Math.cos(E)-e);
   const y=a*Math.sqrt(1-e*e)*Math.sin(E);
   return rotate(x,y,arg);
 });
 const v1=Math.sqrt(MU_SUN_KM3S2*(2/(rp*AU_KM)-1/(a*AU_KM)));
 const v2=Math.sqrt(MU_SUN_KM3S2*(2/(ra*AU_KM)-1/(a*AU_KM)));
 return {points,centralBody:'sun',model:'hohmann-kepler',
   modeledFlightDays:tDays,destinationRadius:ra,
   departureSpeedKmS:v1,arrivalSpeedKmS:v2,
   caveat:'True two-body Sun-centered minimum-energy Hohmann conic oriented from JPL approximate Earth position. It does not solve for the moving target planet or spacecraft capture; the planet may be elsewhere at arrival.'};
}
export function pointAtFraction(points:readonly PhysicalPoint[],fraction:number):PhysicalPoint{
 if(points.length===0||!Number.isFinite(fraction))throw new RangeError('Invalid track sampling');
 const f=Math.max(0,Math.min(1,fraction))*(points.length-1),i=Math.floor(f);
 const k=f-i,p=points[i],q=points[Math.min(points.length-1,i+1)];
 return [p[0]*(1-k)+q[0]*k,p[1]*(1-k)+q[1]*k,p[2]*(1-k)+q[2]*k];
}
export function earthOrbitInstant(options:{
 perigeeAltitudeKm:number;eccentricity:number;elapsedMinutes:number;argumentPeriapsisDeg?:number;
}):PhysicalPoint{
 const p=earthOrbitAtTime(options.perigeeAltitudeKm,options.eccentricity,
   options.elapsedMinutes,options.argumentPeriapsisDeg??0);
 return [p.xKm,p.yKm,0];
}
export function planetPositionAtFlightDay(departure:Date,target:PlanetId,day:number):PhysicalPoint{
 if(!finite([departure.getTime(),day]))throw new RangeError('Invalid planet position time');
 const state=planetAtDate(target,new Date(departure.getTime()+day*DAY_SECONDS*1000));
 return [state.xAu,state.yAu,state.zAu];
}
