import {parseDONKI,parseNeoFeed,readNASAMissionCache,nasaIntelCacheIsFresh,
  NASA_INTEL_CACHE_KEY,type NASAMissionSnapshot,type SpaceWeatherKind} from './nasaMissionIntelligence';
/**
 * DEV server: /nasa-api is proxied by Vite, and NASA_API_KEY stays only in the
 * Vite Node process. Static hosted builds use NASA's public DEMO_KEY directly
 * and gracefully degrade if CORS/rate limits prevent access.
 * NEVER put a private API key into VITE_* variables, React code or Git.
 */
const apiBase=import.meta.env.DEV?'/nasa-api':'https://api.nasa.gov';
const keyQuery=import.meta.env.DEV?'':'&api_key=DEMO_KEY';
const isoDate=(d:Date)=>d.toISOString().slice(0,10);
const beforeDays=(now:Date,n:number)=>new Date(now.getTime()-n*86_400_000);
const afterDays=(now:Date,n:number)=>new Date(now.getTime()+n*86_400_000);
function url(path:string,params:Record<string,string>){
 return apiBase+path+'?'+Object.entries(params).map(([k,v])=>
   encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&')+keyQuery;
}
async function fetchJson(endpoint:string,signal?:AbortSignal):Promise<unknown>{
 const response=await fetch(endpoint,{signal,headers:{Accept:'application/json'}});
 if(!response.ok){
   if(response.status===429)throw new Error('NASA API rate limit reached (429). Cached or offline data will be used.');
   throw new Error('NASA API temporarily unavailable (HTTP '+response.status+').');
 }
 return response.json() as Promise<unknown>;
}
export async function fetchNASAMissionIntelligence(now=new Date(),signal?:AbortSignal)
:Promise<NASAMissionSnapshot>{
 const past=isoDate(beforeDays(now,7)),today=isoDate(now);
 const future=isoDate(afterDays(now,7));
 const kinds:readonly SpaceWeatherKind[]=['FLR','GST','SEP'];
 const jobs=[
   ...kinds.map(kind=>fetchJson(url('/DONKI/'+kind,{startDate:past,endDate:today}),signal)),
   fetchJson(url('/neo/rest/v1/feed',{start_date:today,end_date:future}),signal),
 ];
 const results=await Promise.allSettled(jobs);
 const failed=results.flatMap((r,i)=>r.status==='rejected'?
   [(i<3?'DONKI '+kinds[i]:'NeoWs')+': '+String(r.reason instanceof Error?r.reason.message:r.reason)]:[]);
 if(failed.length===jobs.length)throw new Error('NASA sources are currently unavailable. '+failed[0]);
 const weather=kinds.flatMap((kind,i)=>results[i].status==='fulfilled'?
   parseDONKI(kind,results[i].value):[]);
 const neoResult=results[3];
 const approaches=neoResult.status==='fulfilled'?parseNeoFeed(neoResult.value):[];
 const snapshot:NASAMissionSnapshot={fetchedAt:now.toISOString(),windowStart:past,
   windowEnd:future,weather:weather.sort((a,b)=>b.observedAt.localeCompare(a.observedAt)),
   approaches,source:'NASA API',partial:failed.length>0,warnings:failed};
 try{localStorage.setItem(NASA_INTEL_CACHE_KEY,JSON.stringify(snapshot));}catch{/* storage disabled */}
 return snapshot;
}
export async function loadNASAMissionIntelligence(
 options:{force?:boolean;now?:Date;signal?:AbortSignal}={}
):Promise<NASAMissionSnapshot>{
 const cache=readNASAMissionCache();
 if(!options.force&&nasaIntelCacheIsFresh(cache,options.now?.getTime()??Date.now()))
   return cache!;
 try{return await fetchNASAMissionIntelligence(options.now??new Date(),options.signal)}
 catch(e){
   if(cache)return {...cache,partial:true,
     warnings:[...(cache.warnings??[]),'Cached data shown: '+(e instanceof Error?e.message:String(e))]};
   throw e;
 }
}
