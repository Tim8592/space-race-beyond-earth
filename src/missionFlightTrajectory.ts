import {planetAtDate,type PlanetId} from './lib/orbitalMechanics';
/**
 * Optional local Orekit 13.1.9 service: same endpoint and approximate JPL
 * departure/arrival planet states as TransferPlanner. No remote telemetry.
 * This service models an impulsive Sun-centred Lambert conic, NOT finite
 * low-thrust spacecraft dynamics or an Earth-Moon trajectory.
 */
const ENDPOINT='http://127.0.0.1:8787';
const DAY=86_400_000;
export type FlightPathResult={trajectoryAu:number[][];model:'Orekit Lambert'};
const velocity=(id:PlanetId,date:Date):number[]=>{
 const before=planetAtDate(id,new Date(date.getTime()-DAY));
 const after=planetAtDate(id,new Date(date.getTime()+DAY));
 return [(after.xAu-before.xAu)/2,(after.yAu-before.yAu)/2,(after.zAu-before.zAu)/2];
};
export function makeFlightLambertRequest(date:string,target:'mars'|'jupiter',flightDays:number){
 const departure=new Date(date+'T12:00:00Z');
 const arrival=new Date(departure.getTime()+flightDays*DAY);
 if(!Number.isFinite(departure.getTime())||!Number.isFinite(flightDays)||
   flightDays<3||flightDays>3000||arrival.getUTCFullYear()>=2050)
   throw new RangeError('Flight dates outside the supported Orekit model');
 const from=planetAtDate('earth',departure),to=planetAtDate(target,arrival);
 return {departurePositionAu:[from.xAu,from.yAu,from.zAu],
   arrivalPositionAu:[to.xAu,to.yAu,to.zAu],
   departureVelocityAuPerDay:velocity('earth',departure),
   arrivalVelocityAuPerDay:velocity(target,arrival),
   flightDays,prograde:true,samples:160};
}
export async function tryOrekitFlightPath(date:string,target:'mars'|'jupiter',
 flightDays:number,signal?:AbortSignal):Promise<FlightPathResult|null>{
 try{
   const health=await fetch(ENDPOINT+'/health',{signal});
   if(!health.ok)return null;
   const req=makeFlightLambertRequest(date,target,flightDays);
   const response=await fetch(ENDPOINT+'/api/lambert',{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify(req),signal,
   });
   if(!response.ok)return null;
   const data=await response.json() as {trajectoryAu?:number[][]};
   const path=data.trajectoryAu;
   if(!Array.isArray(path)||path.length<8||
     !path.every(p=>Array.isArray(p)&&p.length>=2&&p.slice(0,2).every(Number.isFinite)))return null;
   return {trajectoryAu:path,model:'Orekit Lambert'};
 }catch{return null;}
}


/** Optional local Orekit Earth-centered two-body Keplerian propagator.
 * The endpoint accepts real orbital elements and returns sampled kilometers.
 * No static site / local Java server => the same Kepler physics is computed
 * using the existing browser orbital-mechanics module. */
export type EarthOrekitOrbit={
  trajectoryKm:number[][];
  periodMinutes:number;
  propagatedMinutes:number;
  perigeeRadiusKm:number;
  apogeeRadiusKm:number;
  perigeeSpeedKmS:number;
  apogeeSpeedKmS:number;
};
export async function tryOrekitEarthOrbitPath(args:{
 perigeeAltitudeKm:number;
 eccentricity:number;
 argumentPeriapsisDeg?:number;
 inclinationDeg?:number;
 halfOrbit?:boolean;
 samples?:number;
},signal?:AbortSignal):Promise<EarthOrekitOrbit|null>{
 try{
   const res=await fetch(ENDPOINT+'/api/earth-orbit',{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({...args,samples:args.samples??181}),signal,
   });
   if(!res.ok)return null;
   const data=await res.json() as EarthOrekitOrbit;
   if(!Array.isArray(data.trajectoryKm)||data.trajectoryKm.length<20||
      data.trajectoryKm.length>500||!data.trajectoryKm.every(p=>
        Array.isArray(p)&&p.length===3&&p.every(n=>
          Number.isFinite(n)&&Math.abs(n)<1_000_000))||
      !Number.isFinite(data.periodMinutes)||data.periodMinutes<=0||
      !Number.isFinite(data.propagatedMinutes)||data.propagatedMinutes<=0)return null;
   return data;
 }catch{return null;}
}
