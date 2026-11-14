import { useEffect, useMemo, useState } from 'react';
import type { HeritageMission } from './lib/heritageMissions';

type Point = {date:string;xAu:number;yAu:number;zAu:number};
type Track = {
  mission:string;naifId:string;source:string;sourceUrl:string;
  origin:string;referencePlane:string;sampling:string;
  points:Point[];caution:string;
};
const BASE='http://127.0.0.1:8787';

function pathFor(points:Point[],scale:number,cx:number,cy:number){
  return points.map((p,i)=>`${i===0?'M':'L'} ${(cx+p.xAu*scale).toFixed(2)} ${(cy-p.yAu*scale).toFixed(2)}`).join(' ');
}

export default function HeritageTrajectoryView({mission}: {mission:HeritageMission}) {
  const [track,setTrack]=useState<Track|null>(null);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('Click to fetch sampled historical positions from NASA/JPL Horizons.');
  const [selected,setSelected]=useState(0);
  useEffect(()=>{
    setTrack(null);setLoading(false);setSelected(0);
    setMessage('NASA/JPL historical ephemerides are retrieved only when you request them.');
  },[mission.id]);

  async function load(){
    setLoading(true);setMessage('Retrieving JPL Horizons historical spacecraft positions…');
    try{
      const response=await fetch(BASE+'/api/heritage-track?mission='+encodeURIComponent(mission.id));
      const result=await response.json() as Track&{error?:string};
      if(!response.ok)throw Error(result.error??'Historical trajectory unavailable');
      if(!Array.isArray(result.points)||result.points.length<2)throw Error('JPL returned insufficient trajectory samples');
      setTrack(result);
      setSelected(0);
      setMessage(`Showing ${result.points.length} NASA/JPL ephemeris samples, projected onto the ecliptic plane.`);
    }catch(error){
      setTrack(null);
      const detail=error instanceof Error?error.message:'Data unavailable';
      setMessage(detail.includes('Failed to fetch')?
        'Start Orekit.command, then retry. It retrieves JPL data on demand and caches it locally for 12 hours.':
        detail);
    }finally{setLoading(false)}
  }

  const diagram=useMemo(()=>{
    if(!track)return null;
    const finite=track.points.filter(p=>[p.xAu,p.yAu,p.zAu].every(Number.isFinite));
    const maxR=Math.max(2,...finite.map(p=>Math.hypot(p.xAu,p.yAu)));
    const scale=150/(maxR*1.08);
    const cx=360,cy=180;
    return {finite,cx,cy,scale,maxR};
  },[track]);
  const point=track?.points[selected]??null;
  return <section className="heritage-track">
    <div className="heritage-track-heading">
      <div><div className="eyebrow">FLIGHT PATH · NASA/JPL HORIZONS</div>
        <h3>Historical spacecraft trajectory</h3>
        <p>Actual spacecraft positions when Horizons coverage is available—not an invented transfer ellipse.</p>
      </div>
      <button type="button" className="secondary-button" disabled={loading}
        onClick={load}>{loading?'Fetching from NASA…':track?'Refresh trajectory':'Load historical flight path'}</button>
    </div>
    <p role="status" className="heritage-track-status">{message}</p>
    {track&&diagram&&<>
      <svg className="heritage-track-map" viewBox="0 0 720 360" role="img"
        aria-label={'Heliocentric JPL spacecraft path for '+mission.name}>
        <rect width="720" height="360" fill="#061424"/>
        {([1,1.52,5.2,9.5] as const).filter(r=>r<diagram.maxR*1.2)
          .map(r=><circle key={r} cx={diagram.cx} cy={diagram.cy} r={r*diagram.scale}
            fill="none" stroke="#385370" strokeOpacity=".5" strokeDasharray="4 6"/>)}
        <line x1={diagram.cx} y1="0" x2={diagram.cx} y2="360" stroke="#31516d" strokeOpacity=".5"/>
        <line x1="0" y1={diagram.cy} x2="720" y2={diagram.cy} stroke="#31516d" strokeOpacity=".5"/>
        <path d={pathFor(diagram.finite,diagram.scale,diagram.cx,diagram.cy)}
          stroke="#f6bc79" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={diagram.cx} cy={diagram.cy} r="8" fill="#ffd67c"/>
        <text x={diagram.cx+12} y={diagram.cy-8} fill="#efcf91" fontSize="11">SUN</text>
        {point&&<circle cx={diagram.cx+point.xAu*diagram.scale}
          cy={diagram.cy-point.yAu*diagram.scale} r="7" fill="#90d7ff" stroke="#fff" strokeWidth="2"/>}
        <text x="16" y="25" fill="#c3dcef" fontSize="11">JPL SAMPLED SPACECRAFT POSITION · ECLIPTIC XY</text>
        <text x="16" y="345" fill="#9cb6ca" fontSize="11">Sun-centered projection · distances and event dates are approximate at sample intervals</text>
      </svg>
      <div className="heritage-track-controls">
        <label>Inspect sampled position <strong>{point?.date}</strong>
          <input type="range" min="0" max={track.points.length-1} step="1"
            value={selected} onChange={e=>setSelected(Number(e.currentTarget.value))}/>
        </label>
        <span>Sun distance: {point?Math.hypot(point.xAu,point.yAu,point.zAu).toFixed(2):'—'} AU</span>
        <span>Out-of-plane Z: {point?.zAu.toFixed(3)??'—'} AU</span>
      </div>
      <p className="heritage-track-note">{track.caution} Coordinate axes refer to JPL's ecliptic vector output in AU; samples are connected by straight line segments for readability. Vesta, Ceres and Pluto are not drawn as verified targets here.</p>
    </>}
    <div className="heritage-milestones">
      <div className="eyebrow">NASA MISSION MILESTONES</div>
      <div>{mission.trajectory?.events.map(item=>
        <div key={item.date+item.label}><time>{item.date}</time><strong>{item.label}</strong></div>)}</div>
    </div>
    <p className="heritage-track-note">
      These milestones are independent of the sampled path. When the trajectory cannot be retrieved, we show this verified chronology instead of fabricating a path.
      {' '}<a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noreferrer">NASA/JPL Horizons ↗</a>
    </p>
  </section>;
}
