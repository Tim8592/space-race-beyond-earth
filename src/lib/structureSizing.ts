/**
 * Parametric GAME spacecraft frame and engine packing, not flight CAD.
 * Baseline structure exists in busDryMassKg. Increasing the structural
 * width/height requires extra shell, brackets and mounting mass.
 */
export const STRUCTURE_FRAME_BASE_WIDTH=1.75;
export const STRUCTURE_FRAME_PITCH=.69;
export const STRUCTURE_ENGINE_RADIUS=.27;
export const STRUCTURE_FRAME_CLEARANCE=.16;
export const EXTRA_FRAME_AREAL_MASS_KG=18;
export type EngineMount={id:string;family:'primary'|'secondary';x:number;y:number};
export function engineMounts(primary:number,secondary=0):EngineMount[]{
  if(![primary,secondary].every(n=>Number.isInteger(n)&&n>=0&&n<=8))
    throw new RangeError('Invalid engine mount count');
  const count=primary+secondary;
  if(count===0)return [];
  const cols=Math.min(4,Math.ceil(Math.sqrt(count)));
  const rows=Math.ceil(count/cols);
  return Array.from({length:count},(_,i)=>{
    const row=Math.floor(i/cols),column=i%cols;
    const inRow=Math.min(cols,count-row*cols);
    return {id:String(i),family:i<primary?'primary' as const:'secondary' as const,
      x:(column-(inRow-1)/2)*STRUCTURE_FRAME_PITCH,
      y:((rows-1)/2-row)*STRUCTURE_FRAME_PITCH};
  });
}
export function minimumStructureScale(primary:number,secondary=0):number{
  const mounts=engineMounts(primary,secondary);
  if(mounts.length===0)return 1;
  const reach=Math.max(...mounts.map(m=>Math.max(Math.abs(m.x),Math.abs(m.y))))+
    STRUCTURE_ENGINE_RADIUS+STRUCTURE_FRAME_CLEARANCE;
  return Math.max(1,Math.ceil(100*(2*reach/STRUCTURE_FRAME_BASE_WIDTH))/100);
}
export function extraFrameMassKg(scale:number):number{
  if(!Number.isFinite(scale)||scale<1||scale>3)throw new RangeError('Invalid spacecraft structure scale');
  return EXTRA_FRAME_AREAL_MASS_KG*(scale*scale-1);
}
