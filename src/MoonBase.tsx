import {useState} from 'react';
import {MOON_BASE_LEVELS,lunarEconomics} from './lib/programEconomy';
type Props={cash:number;level:number;unlocked:boolean;devMode:boolean;
  onInvest:()=>void;onExploreCampaign:()=>void};
const fmt=(usd:number)=>'$'+(usd/1e6).toLocaleString('en-US',{maximumFractionDigits:2})+'M';
const sites=[
  {name:'Shackleton Relay',lat:-89.9,lon:0,label:'SOUTH POLAR'},
  {name:'Malapert Data Hub',lat:-85.5,lon:0,label:'LINK STATION'},
  {name:'Industrial Plateau',lat:-82,lon:25,label:'RESOURCE SURVEY'}
] as const;
export default function MoonBase({cash,level,unlocked,devMode,onInvest,onExploreCampaign}:Props){
  const [zoom,setZoom]=useState(1.5);
  const income=lunarEconomics(level);
  const next=MOON_BASE_LEVELS[level];
  const canBuild=unlocked&&!!next&&cash>=next.investmentUsd;
  const cx=340,cy=214;
  const scale=zoom;
  return <section className="moon-base-page" aria-label="Moon base investment and lunar zoom map">
    <div className="panel moon-base-intro">
      <div className="eyebrow">LUNAR ECONOMIC DEVELOPMENT / INDEPENDENT INVESTMENT</div>
      <h2>Moon Base Directorate</h2>
      <p>Expand a conceptual lunar communications and logistics network. Every base stage costs
        upfront capital and produces recurring modeled commercial revenue—but also costs money
        to operate. The Moon is a separate close-up environment; this is not real NASA project revenue.</p>
      {!unlocked&&<div className="moon-base-lock">
        <strong>Moon Base financing locked</strong>
        <span>Complete Lunar Relay Pathfinder to establish your Moon presence.
          {devMode?' Dev Mode previews the map, but commercial investment still requires the lunar mission.':''}</span>
        <button type="button" className="secondary-button" onClick={onExploreCampaign}>Open Lunar Relay mission ↗</button>
      </div>}
    </div>
    <div className="moon-base-body">
      <div className="panel moon-base-surface">
        <div className="campaign-map-header">
          <div><div className="eyebrow">LUNAR SURFACE / CONCEPTUAL SOUTH POLE</div>
            <h3>Surface investment map</h3>
            <p>Crater and facility layout schematic · zoom controls are for exploration, not precision cartography</p></div>
          <div className="campaign-map-zoom">
            <button type="button" aria-label="Zoom out lunar map" onClick={()=>setZoom(v=>Math.max(1,Math.round(v/1.3*100)/100))} disabled={zoom<=1}>−</button>
            <button type="button" onClick={()=>setZoom(1.5)}>Fit</button>
            <button type="button" aria-label="Zoom in lunar map" onClick={()=>setZoom(v=>Math.min(3.5,Math.round(v*1.3*100)/100))} disabled={zoom>=3.5}>+</button>
          </div>
        </div>
        <svg viewBox="0 0 680 428" role="img" aria-label="Zoomed-in stylized lunar south-polar terrain and stage-by-stage facilities">
          <defs>
            <radialGradient id="moonSurfaceGradient"><stop offset="0%" stopColor="#a6a9ad"/>
              <stop offset="80%" stopColor="#626d7b"/><stop offset="100%" stopColor="#293849"/></radialGradient>
          </defs>
          <rect width="680" height="428" rx="8" fill="#0b1728"/>
          <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(-${cx} -${cy})`}>
            <circle cx={cx} cy={cy} r="175" fill="url(#moonSurfaceGradient)" stroke="#a9b5c6" strokeWidth="3"/>
            {Array.from({length:35},(_,i)=>{
              const angle=i*2.39996,rad=10+((i*43)%153);
              const x=cx+Math.cos(angle)*rad,y=cy+Math.sin(angle)*rad*.85;
              const r=3+(i*11)%21;
              return <g key={i}><ellipse cx={x} cy={y} rx={r} ry={r*.6}
                fill="#465567" opacity=".45" stroke="#d1d3d4" strokeWidth="1"/></g>;
            })}
            <path d="M 294 349 Q 347 281 319 208 T 393 114" fill="none"
              stroke="#ffc880" strokeDasharray="6 6" strokeWidth="2.5"/>
            {sites.map((site,i)=>{
              const x=320+i*38,y=298-i*84;
              const funded=level>i;
              return <g key={site.name}>
                <circle cx={x} cy={y} r={funded?11:7} fill={funded?'#e9c184':'#8fa2b2'}
                  stroke="#f0f4fa" strokeWidth="1.5"/>
                {funded&&<g>
                  <rect x={x-11} y={y-16} width="22" height="14" rx="3" fill="#8bd4d2" stroke="#f5d8ac"/>
                  <path d={`M ${x-11} ${y-9} h -22 M ${x+11} ${y-9} h 22`}
                    stroke="#83bdf9" strokeWidth="6"/>
                </g>}
                <text x={x+16} y={y-5} fontSize="10" fill="#ffffff" fontWeight="700">{site.name}</text>
                <text x={x+16} y={y+8} fontSize="8" fill="#d7e1ef">
                  {funded?'OPERATING':unlocked?'PROPOSED':'LOCKED'} · {site.label}
                </text>
              </g>;
            })}
          </g>
          <text x="17" y="29" fill="#cfdfec" fontSize="11">LUNAR CLOSE-UP · {zoom.toFixed(2)}×</text>
          <text x="17" y="405" fill="#c0cedb" fontSize="10">Illustrative sites and infrastructure · not verified landing coordinates</text>
        </svg>
      </div>
      <aside className="panel moon-base-economy">
        <div className="eyebrow">CASH FLOW / ALL ACTIVE BASE MODULES</div>
        <h3>{level===0?'No facilities operating':MOON_BASE_LEVELS[level-1].name}</h3>
        <div className="moon-base-numbers">
          <div><small>Installed Moon stages</small><strong>{level} / 3</strong></div>
          <div><small>Gross income / game day</small><strong>{fmt(income.grossDailyUsd)}</strong></div>
          <div><small>Lunar operations / game day</small><strong>−{fmt(income.expensesDailyUsd)}</strong></div>
          <div><small>Moon net contribution / day</small><strong>{fmt(income.grossDailyUsd-income.expensesDailyUsd)}</strong></div>
        </div>
        {next?<div className="moon-next-investment">
          <div className="eyebrow">NEXT INVESTMENT / STAGE {next.level}</div>
          <h4>{next.name}</h4>
          <p>{next.description}. All projected values are fictional space-economy assumptions.</p>
          <div><span>Capital required</span><strong>{fmt(next.investmentUsd)}</strong></div>
          <div><span>Additional daily gross</span><strong>+{fmt(next.dailyRevenueUsd)}</strong></div>
          <div><span>Additional daily upkeep</span><strong>−{fmt(next.dailyOperationsUsd)}</strong></div>
          <button type="button" className="launch-button" disabled={!canBuild} onClick={onInvest}>
            {unlocked?cash>=next.investmentUsd?'Invest in '+next.name:'Insufficient capital':'Unlock via Lunar Relay Pathfinder'}
          </button>
        </div>:<p className="moon-base-complete">All three lunar development stages funded. Recurring base revenue continues as in-game days advance.</p>}
      </aside>
    </div>
  </section>;
}
