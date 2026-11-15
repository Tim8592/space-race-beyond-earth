import {useMemo,useState} from 'react';
import {dayToDate,dateForGameDay,type CampaignDefinition} from './lib/campaignMissions';
import {planetAtDate,type PlanetId} from './lib/orbitalMechanics';

type Props={
  day:number;selected:CampaignDefinition;stage:number;completed:readonly string[];
  story:readonly CampaignDefinition[];agency:readonly CampaignDefinition[];
  special:CampaignDefinition|null;onSelect:(id:string)=>void;
};
type Entry={mission:CampaignDefinition;index:string;category:'story'|'agency'|'special'};
const bodies:{id:PlanetId;a:number;label:string;color:string}[]=[
  {id:'venus',a:.723,label:'VENUS',color:'#e5b77a'},
  {id:'earth',a:1,label:'EARTH',color:'#70c4e8'},
  {id:'mars',a:1.524,label:'MARS',color:'#d98b76'},
  {id:'jupiter',a:5.203,label:'JUPITER',color:'#d8b48a'}
];
const CX=355,CY=224,BASE=188/5.35;
const rounded=(n:number)=>Math.round(n*100)/100;
export default function CampaignOrbitMap({
  day,selected,stage,completed,story,agency,special,onSelect,
}:Props){
  const [zoom,setZoom]=useState(1);
  const date=dayToDate(day);
  const frame=useMemo(()=>{
    const planets=Object.fromEntries(bodies.map(p=>[p.id,planetAtDate(p.id,date)])) as Record<PlanetId,ReturnType<typeof planetAtDate>>;
    const e=planets.earth;
    // Fictional circular 1.35 AU survey target. NOT a real asteroid ephemeris.
    const phase=Math.atan2(e.yAu,e.xAu)+.7+day/400;
    const asteroid={xAu:1.35*Math.cos(phase),yAu:1.35*Math.sin(phase)};
    return {planets,asteroid};
  },[day]);
  const scale=BASE*zoom;
  const xy=(xAu:number,yAu:number)=>({x:CX+xAu*scale,y:CY-yAu*scale});
  const earth=xy(frame.planets.earth.xAu,frame.planets.earth.yAu);
  const target=(m:CampaignDefinition)=>{
    if(m.target==='jupiter')return xy(frame.planets.jupiter.xAu,frame.planets.jupiter.yAu);
    if(m.target==='mars')return xy(frame.planets.mars.xAu,frame.planets.mars.yAu);
    if(m.target==='asteroid')return xy(frame.asteroid.xAu,frame.asteroid.yAu);
    return earth;
  };
  const entries:Entry[]=[
    ...story.map((mission,i)=>({mission,index:String(i+1).padStart(2,'0'),category:'story' as const})),
    ...agency.map((mission,i)=>({mission,index:mission.id.startsWith('csa-')?'C'+(i-3):'N'+(i+1),category:'agency' as const})),
    ...(special?[{mission:special,index:'S',category:'special' as const}]:[])
  ];
  // Locked missions have names in the directory, but no spatial or trajectory
  // information. Do not place their markers at their unrevealed destinations.
  const visibleEntries=entries.filter(e=>stage>=e.mission.stage);
  const markers=visibleEntries.map((entry,i)=>{
    const center=target(entry.mission);
    const duplicates=visibleEntries.slice(0,i).filter(e=>e.mission.target===entry.mission.target).length;
    const total=visibleEntries.filter(e=>e.mission.target===entry.mission.target).length;
    const offset=(duplicates-(total-1)/2)*33;
    return {...entry,x:center.x+offset,y:center.y-34+(duplicates%2)*8};
  });
  const focus=target(selected);
  const earthSide=selected.target==='ellipse'||selected.target==='lunar';
  const selectedUnlocked=stage>=selected.stage;
  const route=!selectedUnlocked||earthSide?'':`M ${earth.x.toFixed(1)} ${earth.y.toFixed(1)} Q ${((earth.x+focus.x)/2+24).toFixed(1)} ${((earth.y+focus.y)/2-25).toFixed(1)} ${focus.x.toFixed(1)} ${focus.y.toFixed(1)}`;
  const percent=(x:number,max:number)=>`${100*x/max}%`;
  return <section className="panel campaign-solar-map" aria-label="Live solar system mission map">
    <div className="campaign-map-header">
      <div><div className="eyebrow">MISSION DIRECTORATE / SOLAR SYSTEM</div>
        <h3>Orbital campaign map</h3>
        <p>JPL approximate planet positions · {dateForGameDay(day)} · schematic transfer highlights</p></div>
      <div className="campaign-map-zoom">
        <button type="button" aria-label="Zoom out solar system map" disabled={zoom<=.65}
          onClick={()=>setZoom(v=>Math.max(.65,rounded(v/1.5)))}>−</button>
        <button type="button" onClick={()=>setZoom(1)} aria-label="Fit Jupiter orbit to map">Fit</button>
        <button type="button" aria-label="Zoom in solar system map" disabled={zoom>=4}
          onClick={()=>setZoom(v=>Math.min(4,rounded(v*1.5)))}>+</button>
      </div>
    </div>
    <div className="campaign-map-content">
      <div className="campaign-map-scene">
        <svg viewBox="0 0 720 448" role="img" aria-label="Top-down Sun and Venus, Earth, Mars, Jupiter orbits, with highlighted mission destination">
          <defs>
            <radialGradient id="campSun"><stop offset="0%" stopColor="#fff7c2"/>
              <stop offset="45%" stopColor="#ffd18a"/><stop offset="100%" stopColor="#d87234"/></radialGradient>
            <radialGradient id="campBg"><stop offset="0" stopColor="#162b48"/><stop offset="1" stopColor="#091322"/></radialGradient>
          </defs>
          <rect width="720" height="448" fill="url(#campBg)" rx="10"/>
          {Array.from({length:68},(_,i)=><circle key={i} cx={15+(i*179)%690}
            cy={13+(i*131)%422} r={i%8===0?1.3:.55} fill="#9bb9cc" opacity={.27+(i%4)*.12}/>)}
          {bodies.map(body=><circle key={body.id} cx={CX} cy={CY}
            r={body.a*scale} fill="none" stroke={selected.target===body.id?'#789fb9':'#38516c'}
            strokeWidth={selected.target===body.id?1.5:1} strokeDasharray={body.id==='jupiter'?'4 5':'none'} opacity=".75"/>)}
          <circle cx={CX} cy={CY} r={1.35*scale} fill="none" stroke="#758196"
            strokeDasharray="2 5" opacity=".35"/>
          {selectedUnlocked&&route&&<path d={route} fill="none" stroke="#ffc17b" strokeWidth="2.5"
            strokeDasharray="7 5" opacity=".9"/>}
          {selectedUnlocked&&earthSide&&<ellipse cx={earth.x+13} cy={earth.y} rx={selected.target==='lunar'?46:31}
            ry={selected.target==='lunar'?15:10} transform={`rotate(-28 ${earth.x+13} ${earth.y})`}
            fill="none" stroke="#f9c681" strokeWidth="2" strokeDasharray="5 4"/>}
          <circle cx={CX} cy={CY} r="12" fill="url(#campSun)" stroke="#ffdc8a" strokeWidth="2"/>
          <text x={CX+17} y={CY-14} fill="#ffe2a6" fontSize="11" fontWeight="700">SUN</text>
          {bodies.map(body=>{
            const pos=frame.planets[body.id],p=xy(pos.xAu,pos.yAu);
            return <g key={body.id}>
              <circle cx={p.x} cy={p.y} r={body.id==='jupiter'?7:body.id==='earth'?5:4}
                fill={body.color} stroke="#e7eef5" strokeWidth="1"/>
              <text x={p.x+10} y={p.y+17} fill="#b6cadb" fontSize="10">{body.label}</text>
            </g>;
          })}
          <circle cx={xy(frame.asteroid.xAu,frame.asteroid.yAu).x}
            cy={xy(frame.asteroid.xAu,frame.asteroid.yAu).y} r="3" fill="#9eabb6"/>
          <text x="15" y="29" fontSize="10" fill="#9eb6c9">ECLIPTIC XY VIEW · AU SCALE · ZOOM {zoom.toFixed(2)}×</text>
          <text x="15" y="431" fontSize="9" fill="#a0b7c9">
            Earth ellipse/Moon markers are not to solar scale; route is NOT a propagated flight trajectory
          </text>
        </svg>
        {markers.map(m=><button key={m.mission.id} type="button"
          className={'campaign-map-marker '+(m.mission.id===selected.id?'selected ':'')+m.category}
          style={{left:percent(m.x,720),top:percent(m.y,448)}}
          title={m.index+' · '+m.mission.title}
          aria-label={'Select '+m.index+' '+m.mission.title}
          aria-pressed={m.mission.id===selected.id}
          onClick={()=>onSelect(m.mission.id)}>{m.index}</button>)}
      </div>
      <div className="campaign-map-directory" aria-label="Numbered mission directory">
        <div className="campaign-map-current"><small>TRACKING</small>
          <strong>{selected.title}</strong>
          <span>{selectedUnlocked?selected.location+' · Chapter '+selected.stage:'Mission classified · unlock to reveal location and orbit'}</span></div>
        <div className="campaign-map-list">
          {entries.map(e=><button type="button" key={e.mission.id}
            onClick={()=>onSelect(e.mission.id)}
            className={selected.id===e.mission.id?'selected':''}
            aria-pressed={selected.id===e.mission.id}>
            <span className="mission-index">{e.index}</span>
            <span><strong>{e.mission.title}</strong>
              <small>{stage<e.mission.stage?'LOCKED · destination hidden':completed.includes(e.mission.id)?'✓ Complete':
                e.category==='agency'?(e.mission.id.startsWith('csa-')?'CSA research data · optional':'NASA-inspired · optional'):
                e.category==='special'?'Limited-time contract':'Story mission'}</small></span>
          </button>)}
        </div>
      </div>
    </div>
  </section>;
}
