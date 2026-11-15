/**
 * Departure-date comparison for an unchanged spacecraft and flight duration.
 * Offline preview: campaign's published approximate Hohmann/phase game heuristic.
 * Online: genuine Orekit Sun-centered Lambert arcs at each sampled date,
 * ideal patched-conic injection and (Mars) circular capture energy only.
 */
import {dateForGameDay,orbitalRoute,type MissionOptions,
  type OrbitTarget} from './campaignMissions';
import {makeFlightLambertRequest} from '../missionFlightTrajectory';
export type WindowPoint={day:number;date:string;requiredDeltaVms:number;
  phaseErrorDeg:number|null;source:'Hohmann approximation'|'Orekit Lambert'};
export type WindowForecast={points:WindowPoint[];source:WindowPoint['source'];
  flightDays:number;best:WindowPoint;current:WindowPoint};
export const LAUNCH_WINDOW_SAMPLES=32;
export const LAUNCH_WINDOW_STEP_DAYS=28;
export function approximateDepartureWindows(target:OrbitTarget,day:number,
 options:MissionOptions):WindowForecast|null{
 if(target!=='mars'&&target!=='jupiter')return null;
 if(!Number.isInteger(day)||day<1)throw new RangeError('Invalid campaign start day');
 const points:WindowPoint[]=[];
 for(let i=0;i<LAUNCH_WINDOW_SAMPLES;i++){
   const futureDay=day+i*LAUNCH_WINDOW_STEP_DAYS;
   try{
     const route=orbitalRoute(target,futureDay,options);
     points.push({day:futureDay,date:dateForGameDay(futureDay),
       requiredDeltaVms:1.05*route.totalDeltaVms,
       phaseErrorDeg:route.phaseErrorDeg,source:'Hohmann approximation'});
   }catch{break}
 }
 if(points.length<2)return null;
 const route=orbitalRoute(target,day,options);
 return {points,source:'Hohmann approximation',
   flightDays:route.flightDays,current:points[0],
   best:points.reduce((best,p)=>p.requiredDeltaVms<best.requiredDeltaVms?p:best)};
}
export async function tryOrekitDepartureWindows(target:'mars'|'jupiter',initialDay:number,
 options:MissionOptions,flightDays:number,signal?:AbortSignal):Promise<WindowForecast|null>{
 const approximation=approximateDepartureWindows(target,initialDay,options);
 if(!approximation)return null;
 try{
   const trials=approximation.points.map(point=>({
     departureDate:point.date,
     transfer:makeFlightLambertRequest(point.date,target,Math.round(flightDays)),
   }));
   const res=await fetch('http://127.0.0.1:8787/api/departure-window',{
     method:'POST',headers:{'Content-Type':'application/json'},signal,
     body:JSON.stringify({target,earthParkingAltitudeKm:options.perigeeKm,
       targetParkingAltitudeKm:300,trials}),
   });
   if(!res.ok)return null;
   const parsed=await res.json() as {
     points?:Array<{departureDate:string;requiredDeltaVms:number}>};
   const valid=parsed.points??[];
   const mapped=valid.flatMap(result=>{
     const old=approximation.points.find(p=>p.date===result.departureDate);
     if(!old||!Number.isFinite(result.requiredDeltaVms)||
       result.requiredDeltaVms<0||result.requiredDeltaVms>200000)return [];
     return [{...old,source:'Orekit Lambert' as const,
       requiredDeltaVms:result.requiredDeltaVms,phaseErrorDeg:null}];
   }).sort((a,b)=>a.day-b.day);
   // Require an Orekit result for TODAY as well as enough future dates;
   // never mix an Orekit future curve with an unrelated current baseline.
   if(mapped.length<5||mapped[0].day!==initialDay)return null;
   return {source:'Orekit Lambert',points:mapped,
     current:mapped[0],flightDays,
     best:mapped.reduce((best,p)=>p.requiredDeltaVms<best.requiredDeltaVms?p:best)};
 }catch{return null}
}
