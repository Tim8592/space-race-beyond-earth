/** Accelerated flight playback (2 minutes). Real timestamp persists across tab changes. */
export const DEFAULT_FLIGHT_VIEWER_MS=105_000;
export type FlightProgress={fraction:number;remainingMs:number;ready:boolean;elapsedMs:number};
export function flightProgress(startedAtMs:number,nowMs:number,durationMs=DEFAULT_FLIGHT_VIEWER_MS):FlightProgress{
  if(!Number.isFinite(startedAtMs)||!Number.isFinite(nowMs)||
    !Number.isFinite(durationMs)||durationMs<=0)throw new RangeError('Invalid flight progress input');
  const elapsedMs=Math.max(0,nowMs-startedAtMs);
  const fraction=Math.min(1,elapsedMs/durationMs);
  return {fraction,remainingMs:Math.max(0,durationMs-elapsedMs),ready:fraction>=1,elapsedMs};
}
export const flightEta=(remainingMs:number):string=>{
  const seconds=Math.max(0,Math.ceil(remainingMs/1000));
  return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
};
