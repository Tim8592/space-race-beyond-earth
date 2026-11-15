/**
 * NASA Mission Intelligence: real observed events + close approaches, never a
 * forecast of future real-world events or a verified asteroid intercept orbit.
 * https://api.nasa.gov/ (DONKI FLR / GST / SEP; NeoWs feed)
 * NASA CCMC: https://ccmc.gsfc.nasa.gov/tools/DONKI/
 */
import type {CampaignDefinition} from './campaignMissions';
export const NASA_INTEL_CACHE_KEY='space-race-nasa-mission-intel-v1';
export const NASA_INTEL_CACHE_TTL_MS=4*60*60*1000;
export type SpaceWeatherKind='FLR'|'GST'|'SEP';
export type SpaceWeatherEvent={
 id:string;kind:SpaceWeatherKind;observedAt:string;
 level:'notice'|'elevated'|'high';reading:string;summary:string;sourceUrl:string;
};
export type NearEarthApproach={
 id:string;name:string;date:string;missDistanceKm:number;
 velocityKmS:number;diameterM:number;potentiallyHazardous:boolean;
 sourceUrl:string;
};
export type NASAMissionSnapshot={
 fetchedAt:string;windowStart:string;windowEnd:string;weather:SpaceWeatherEvent[];
 approaches:NearEarthApproach[];source:'NASA API';partial:boolean;
 warnings:string[];
};
export type WeatherOperationalBrief={
 risk:'normal'|'elevated'|'high';recentEventCount:number;reserveHours:number;
 applicable:boolean;message:string;latestEvent:string|null;
};
const finite=(x:unknown):number|null=>{
 const n=Number(x);return Number.isFinite(n)&&n>=0?n:null;
};
const string=(x:unknown):string=>typeof x==='string'?x:'';
const validDate=(d:string):boolean=>/^\d{4}-\d{2}-\d{2}/.test(d)&&
 Number.isFinite(Date.parse(d));
const entries=(data:unknown):Record<string,unknown>[]=>Array.isArray(data)?
 data.filter((x):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)):[];
export function parseDONKI(kind:SpaceWeatherKind,data:unknown):SpaceWeatherEvent[]{
 return entries(data).flatMap((item,index)=>{
   const observedAt=string(kind==='FLR'?item.peakTime??item.beginTime:
     kind==='GST'?item.startTime:item.eventTime);
   if(!validDate(observedAt))return [];
   const link=string(item.link);
   const sourceUrl=link.startsWith('https://')&&
     (link.includes('nasa.gov')||link.includes('gsfc.nasa.gov'))?link:
     'https://ccmc.gsfc.nasa.gov/tools/DONKI/';
   const id=string(item.flrID??item.gstID??item.sepID)||
     kind+'-'+observedAt+'-'+index;
   let level:SpaceWeatherEvent['level']='notice',reading='',summary='';
   if(kind==='FLR'){
     const cls=string(item.classType).toUpperCase();
     const letter=cls.charAt(0);
     const strength=Number(cls.slice(1))||0;
     level=letter==='X'?'high':letter==='M'&&strength>=5?'elevated':'notice';
     reading=cls||'Unclassified solar flare';
     summary='Solar flare recorded by NASA DONKI (not a solar-particle radiation forecast)';
   }else if(kind==='GST'){
     const kp=Math.max(0,...entries(item.allKpIndex).map(kp=>Number(kp.kpIndex)||0));
     level=kp>=7?'high':kp>=5?'elevated':'notice';
     reading=Number.isFinite(kp)?'Kp '+kp.toFixed(1):'Kp unreported';
     summary='Observed geomagnetic conditions near Earth';
   }else{
     level='elevated';reading='SEP event';
     summary='Solar energetic particle event observed; monitor radiation-sensitive operations';
   }
   return [{id,kind,observedAt,level,reading,summary,sourceUrl}];
 }).sort((a,b)=>b.observedAt.localeCompare(a.observedAt)).slice(0,35);
}
export function parseNeoFeed(data:unknown):NearEarthApproach[]{
 if(!data||typeof data!=='object'||Array.isArray(data))return [];
 const all=(data as {near_earth_objects?:unknown}).near_earth_objects;
 if(!all||typeof all!=='object'||Array.isArray(all))return [];
 const neos=Object.values(all).flatMap(entries);
 return neos.flatMap(item=>{
   const approaches=entries(item.close_approach_data);
   const earth=approaches.find(a=>string(a.orbiting_body)==='Earth')??approaches[0];
   if(!earth)return [];
   const date=string(earth.close_approach_date);
   const miss=finite((earth.miss_distance as Record<string,unknown>|undefined)?.kilometers);
   const speed=finite((earth.relative_velocity as Record<string,unknown>|undefined)?.kilometers_per_second);
   const est=(item.estimated_diameter as Record<string,unknown>|undefined)?.meters as Record<string,unknown>|undefined;
   const diameterMin=finite((est?.estimated_diameter_min));
   const diameterMax=finite((est?.estimated_diameter_max));
   if(!validDate(date)||miss===null||speed===null||diameterMin===null||diameterMax===null)return [];
   const neoId=string(item.id),name=string(item.name);
   if(!neoId||!name)return [];
   const link=string(item.nasa_jpl_url);
   return [{id:neoId,name,date,missDistanceKm:miss,velocityKmS:speed,
     diameterM:(diameterMin+diameterMax)/2,
     potentiallyHazardous:item.is_potentially_hazardous_asteroid===true,
     sourceUrl:link.startsWith('https://')&&link.includes('nasa.gov')?
       link:'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html'}];
 }).sort((a,b)=>a.date.localeCompare(b.date)||a.missDistanceKm-b.missDistanceKm)
 .slice(0,24);
}
export function nasaWeatherBrief(snapshot:NASAMissionSnapshot|null,gameDate:string,
 nowUtc=new Date()):WeatherOperationalBrief{
 const neutral:WeatherOperationalBrief={risk:'normal',recentEventCount:0,
   reserveHours:0,applicable:false,latestEvent:null,
   message:'No verified NASA space-weather operational restriction applied.'};
 if(!snapshot||!validDate(gameDate))return neutral;
 const gameTime=Date.parse(gameDate+'T12:00:00Z');
 const now=nowUtc.getTime();
 // Real observations cannot honestly predict an accelerated campaign's future.
 if(Math.abs(gameTime-now)>3*86_400_000)return {...neutral,
   message:'Campaign date differs from real UTC by over 3 days. NASA observations are reference-only, not a future forecast.'};
 const recent=snapshot.weather.filter(event=>{
   const time=Date.parse(event.observedAt);
   return Number.isFinite(time)&&time<=now+60_000&&now-time<=72*3_600_000;
 });
 const risk=recent.some(x=>x.level==='high')?'high':
   recent.some(x=>x.level==='elevated')?'elevated':'normal';
 // Game assumption: increase energy reserve during exposed mission operations,
 // not a scientific prediction of dose or storm duration.
 return {risk,recentEventCount:recent.length,
   reserveHours:risk==='high'?2:risk==='elevated'?1:0,
   applicable:risk!=='normal',
   latestEvent:recent[0]?.observedAt??null,
   message:risk==='normal'?'No elevated NASA DONKI events detected in last 72 hours. This does NOT guarantee quiet space weather.':
     'Recent NASA DONKI events: game adds '+(risk==='high'?2:1)+
     ' hour(s) of contingency power for near-Earth/lunar campaigns. Observational research data; not a NOAA forecast.'};
}
export type NeoObservationOffer={id:string;sourceNeo:NearEarthApproach;
 launchDay:number;mission:CampaignDefinition};
/** Real asteroid NAME and flyby date, fictional Earth-orbit imaging mission.
 * We do NOT insert the actual asteroid into the synthetic 1.35 AU game orbit. */
export function makeNeoObservationOffer(neo:NearEarthApproach,day:number):NeoObservationOffer{
 if(!Number.isInteger(day)||day<1)throw new RangeError('Invalid NASA scenario day');
 return {id:'nasa-neo-'+neo.id+'-'+neo.date,sourceNeo:neo,launchDay:day,
   mission:{id:'nasa-neo-'+neo.id+'-'+neo.date,
     title:'Asteroid Watch · '+neo.name,
     summary:'NASA NeoWs reports an Earth close approach on '+neo.date+
       '. Launch a fictional EARTH-ORBIT optical observation spacecraft to monitor '+neo.name+
       '; this does not intercept or orbit the named asteroid. NASA close-approach date, miss distance and estimated size are real source data; the contract budget and energy requirements are game assumptions.',
     location:'Earth orbit · optical NEO tracking',target:'ellipse',stage:1,special:true,
     durationDays:5,payoutUsd:92e6,
     requiredScienceKg:18,minElectricW:145,requiresHighGain:true,
     requiresShield:false,acceptedInstruments:[],
     windowStartDay:day,windowEndDay:day+8,
   }};
}
export const nasaIntelCacheIsFresh=(snapshot:NASAMissionSnapshot|null,now=Date.now())=>
  !!snapshot&&Number.isFinite(Date.parse(snapshot.fetchedAt))&&
  now-Date.parse(snapshot.fetchedAt)>=0&&now-Date.parse(snapshot.fetchedAt)<NASA_INTEL_CACHE_TTL_MS;
export function readNASAMissionCache():NASAMissionSnapshot|null{
 try{
   const raw=localStorage.getItem(NASA_INTEL_CACHE_KEY);
   if(!raw)return null;
   const data=JSON.parse(raw) as NASAMissionSnapshot;
   return Array.isArray(data.weather)&&Array.isArray(data.approaches)&&
     validDate(data.fetchedAt)?data:null;
 }catch{return null;}
}
