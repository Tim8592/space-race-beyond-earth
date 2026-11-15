/** Player-owned spacecraft design snapshots; independent of old legacy rocket saves.
 * All values are deep-copied to make "Duplicate" genuinely non-destructive.
 */
import {DEFAULT_SUBSYSTEM_DESIGN,sizeSubsystemDesign,type SubsystemDesign} from './subsystemDesign';
export type SpacecraftBlueprint={
 id:string;name:string;description:string;
 design:SubsystemDesign;createdDay:number;lastUsedDay:number|null;
 usedOnMissions:string[];source:'manual'|'mission';
};
export const MAX_SPACECRAFT_BLUEPRINTS=75;
export function cloneSpacecraftDesign(design:SubsystemDesign):SubsystemDesign{
 return {...DEFAULT_SUBSYSTEM_DESIGN,...design};
}
export function safeBlueprints(raw:unknown):SpacecraftBlueprint[]{
 if(!Array.isArray(raw))return [];
 return raw.slice(0,MAX_SPACECRAFT_BLUEPRINTS).flatMap(item=>{
  if(!item||typeof item!=='object'||typeof item.id!=='string'||
     typeof item.name!=='string'||!item.design||typeof item.design!=='object')
   return [];
  const design=cloneSpacecraftDesign(item.design);
  try{sizeSubsystemDesign(design)}catch{return []}
  return [{id:String(item.id).slice(0,100),name:item.name.slice(0,80),
   description:typeof item.description==='string'?item.description.slice(0,300):'',
   design,createdDay:Number.isFinite(item.createdDay)?item.createdDay:1,
   lastUsedDay:Number.isFinite(item.lastUsedDay)?item.lastUsedDay:null,
   usedOnMissions:Array.isArray(item.usedOnMissions)?
     item.usedOnMissions.filter((m:unknown)=>typeof m==='string').slice(0,30):[],
   source:item.source==='mission'?'mission':'manual'} as SpacecraftBlueprint];
 });
}
const newId=(existing:readonly SpacecraftBlueprint[],day:number)=>{
 let suffix=existing.length+1;
 const prefix='craft-'+day+'-';
 while(existing.some(x=>x.id===prefix+suffix))suffix++;
 return prefix+suffix;
};
export function saveSpacecraftBlueprint(existing:readonly SpacecraftBlueprint[],
 name:string,design:SubsystemDesign,day:number,description='',source:'manual'|'mission'='manual')
:SpacecraftBlueprint[]{
 if(existing.length>=MAX_SPACECRAFT_BLUEPRINTS)throw new Error('Blueprint library is full');
 if(!name.trim())throw new Error('Enter a spacecraft name');
 const copy=cloneSpacecraftDesign(design);
 sizeSubsystemDesign(copy); // refuse corrupt designs
 const entry:SpacecraftBlueprint={
   id:newId(existing,day),name:name.trim().slice(0,80),
   description:description.trim().slice(0,300),createdDay:day,lastUsedDay:null,
   usedOnMissions:[],source,design:copy,
 };
 return [entry,...existing];
}
export function duplicateSpacecraftBlueprint(existing:readonly SpacecraftBlueprint[],id:string,day:number){
 const from=existing.find(x=>x.id===id);
 if(!from)throw new Error('Blueprint not found');
 return saveSpacecraftBlueprint(existing,from.name+' · Copy',from.design,day,
   'Independent duplicate of '+from.name,'manual');
}
export function markSpacecraftDeployed(existing:readonly SpacecraftBlueprint[],name:string,
 design:SubsystemDesign,mission:string,day:number):SpacecraftBlueprint[]{
 const signature=JSON.stringify(cloneSpacecraftDesign(design));
 const matched=existing.find(x=>JSON.stringify(x.design)===signature);
 if(matched)return existing.map(x=>x.id!==matched.id?x:{
   ...x,lastUsedDay:day,usedOnMissions:[...new Set([...x.usedOnMissions,mission])].slice(-30)});
 if(existing.length>=MAX_SPACECRAFT_BLUEPRINTS)return [...existing];
 const saved=saveSpacecraftBlueprint(existing,name,design,day,
   'Automatically archived spacecraft configuration flown on '+mission,'mission');
 return [{...saved[0],lastUsedDay:day,usedOnMissions:[mission]},...saved.slice(1)];
}
