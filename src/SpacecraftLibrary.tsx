import {useMemo,useState} from 'react';
import {sizeSubsystemDesign,type SubsystemDesign} from './lib/subsystemDesign';
import {ORBITAL_SERVICE_MODULES} from './lib/orbitalServiceModules';
import type {SpacecraftBlueprint} from './lib/spacecraftBlueprints';
type Props={
 designs:readonly SpacecraftBlueprint[];working:SubsystemDesign;
 onSave:(name:string,description:string)=>void;onNew:()=>void;
 onLoad:(id:string)=>void;onDuplicate:(id:string)=>void;
 onRename:(id:string,name:string)=>void;onRemove:(id:string)=>void;
 onOpenEngineering:()=>void;onOpenCampaign:()=>void;
};
const fmt=(n:number,unit:string,digits=1)=>Number.isFinite(n)?
 n.toLocaleString('en-US',{maximumFractionDigits:digits})+' '+unit:'—';
export default function SpacecraftLibrary(p:Props){
 const [name,setName]=useState('New spacecraft configuration');
 const [description,setDescription]=useState('');
 const [selection,setSelection]=useState<string|null>(null);
 const [renameText,setRenameText]=useState('');
 const working=useMemo(()=>{try{return sizeSubsystemDesign(p.working)}catch{return null}},[p.working]);
 const selected=p.designs.find(x=>x.id===selection)??null;
 const selectedStats=useMemo(()=>{
  if(!selected)return null;try{return sizeSubsystemDesign(selected.design)}catch{return null}
 },[selected]);
 return <section className="spacecraft-library-page" aria-label="Reusable spacecraft design blueprints">
   <div className="panel spacecraft-library-hero">
     <div className="eyebrow">ENGINEERING / SAVED CONFIGURATIONS & FLIGHT HERITAGE</div>
     <h2>Spacecraft Blueprint Library</h2>
     <p>Every saved design is an independent snapshot of the spacecraft's propulsion,
       tanks, solar panels, energy storage, radiators, scientific instruments,
       and orbital compute/communications modules.
       <strong> Duplicate a blueprint like an Excel workbook:</strong> the
       original stays unchanged while you load and edit the new copy.
       Launched designs are archived automatically with their mission history.</p>
   </div>
   <div className="spacecraft-library-columns">
     <div className="panel spacecraft-library-workbench">
       <div className="eyebrow">WORKING SPACECRAFT DESIGN · UNSAVED EDITS</div>
       <h3>Active engineering configuration</h3>
       {working?<div className="spacecraft-library-metrics">
         <div><small>WET MASS</small><strong>{fmt(working.modeledWetMassKg,'kg')}</strong></div>
         <div><small>INSTANTANEOUS POWER</small><strong>{fmt(working.totalElectricalDemandW,'W',0)}</strong></div>
         <div><small>RADIATOR MARGIN</small><strong>{fmt(working.thermalMarginW,'W',0)}</strong></div>
         <div><small>PAYLOAD MODULE</small><strong>{ORBITAL_SERVICE_MODULES[p.working.orbitalServiceModuleId].name}</strong></div>
       </div>:<p>The current working design has invalid values. Fix it in Engineering Lab before saving.</p>}
       <label className="sys-field">Save new blueprint as
         <input type="text" value={name} maxLength={80} onChange={e=>setName(e.target.value)}
           placeholder="Example: NEOSSAT observer Mk II"/>
       </label>
       <label className="sys-field">Notes / what changed
         <textarea rows={3} value={description} maxLength={300}
           onChange={e=>setDescription(e.target.value)}
           placeholder="Bus revision, payload upgrades, mission notes"/>
       </label>
       <div className="spacecraft-library-actions">
         <button className="launch-button" type="button"
           disabled={!working||!name.trim()} onClick={()=>p.onSave(name,description)}>
           Save independent snapshot ↗</button>
         <button className="secondary-button" type="button" onClick={p.onNew}>
           + New blank spacecraft</button>
         <button className="secondary-button" type="button" onClick={p.onOpenEngineering}>
           Edit current design in Engineering Lab ↗</button>
       </div>
       <p className="rocket-fleet-disclaimer">The working configuration is autosaved separately.
          Saving a named blueprint never overwrites an old revision. Loading a
          blueprint changes the working copy only.</p>
     </div>
     <div className="panel spacecraft-library-list">
       <div className="eyebrow">SPACECRAFT FLEET / VERSIONED CONFIGURATIONS</div>
       <h3>{p.designs.length} saved blueprint{p.designs.length===1?'':'s'}</h3>
       {p.designs.length===0?<p className="spacecraft-library-empty">No saved spacecraft yet.
          Start with the working design, save it, then duplicate and evolve that
          configuration for other missions. Flown designs will appear here automatically.</p>:
         <div className="spacecraft-library-cards">
           {p.designs.map(b=><button key={b.id} type="button"
              className={'spacecraft-library-card '+(b.id===selection?'selected':'')}
              aria-pressed={b.id===selection} onClick={()=>{setSelection(b.id);setRenameText(b.name)}}>
              <span className="eyebrow">{b.source==='mission'?'AUTO-ARCHIVED FLIGHT CONFIGURATION':'USER SAVED'}</span>
              <strong>{b.name}</strong>
              <small>Created Day {b.createdDay} · {b.usedOnMissions.length?
                'Flown on '+b.usedOnMissions.join(', '):'Not yet flown'}</small>
              <small>{b.description||'No revision notes'}</small>
           </button>)}
         </div>}
     </div>
   </div>
   {selected&&<div className="panel spacecraft-library-detail">
     <div className="eyebrow">SELECTED SAVED REVISION · NEVER MODIFIED BY LOADING</div>
     <h3>{selected.name}</h3>
     <p>{selected.description||'Saved snapshot of a complete spacecraft configuration.'}</p>
     <div className="spacecraft-library-metrics">
       <div><small>WET MASS</small><strong>{fmt(selectedStats?.modeledWetMassKg??NaN,'kg')}</strong></div>
       <div><small>GENERATED ELECTRICAL POWER</small>
         <strong>{fmt(selectedStats?.totalAvailablePowerW??NaN,'W',0)}</strong></div>
       <div><small>THERMAL MARGIN</small>
         <strong>{fmt(selectedStats?.thermalMarginW??NaN,'W',0)}</strong></div>
       <div><small>LAST MISSION USE</small><strong>{selected.lastUsedDay?'Day '+selected.lastUsedDay:'Not yet flown'}</strong></div>
     </div>
     <div className="spacecraft-library-actions">
       <button className="launch-button" type="button"
         onClick={()=>p.onLoad(selected.id)}>Load working copy for editing ↗</button>
       <button className="secondary-button" type="button"
         onClick={()=>p.onDuplicate(selected.id)}>Duplicate independent workbook ↗</button>
       <button className="secondary-button" type="button"
         onClick={p.onOpenCampaign}>Use in current mission ↗</button>
     </div>
     <div className="spacecraft-library-maintenance">
       <label>Rename saved revision <input type="text" maxLength={80}
         value={renameText} onChange={e=>setRenameText(e.target.value)}/></label>
       <button className="secondary-button" type="button" disabled={!renameText.trim()}
         onClick={()=>p.onRename(selected.id,renameText)}>Rename</button>
       <button className="secondary-button" type="button" onClick={()=>{
         if(window.confirm('Delete this saved blueprint? This will not change the working spacecraft or past mission results.')){
           p.onRemove(selected.id);setSelection(null);
         }
       }}>Delete saved revision</button>
     </div>
   </div>}
 </section>;
}
