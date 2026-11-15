import {EARTH, circularOrbitPeriodMinutes} from './lib/nasaData';

type Props={
  altitudeKm:number;
  completedDays:number;
  downlinkAvailable:boolean;
  finished:boolean;
};

export default function MissionOrbitScene({altitudeKm,completedDays,downlinkAvailable,finished}:Props){
  // Shares NASA/JPL two-body circular orbit period with the Orbital Map.
  // Orbital geometry is visually exaggerated for clarity (altitude is ~6% of
  // Earth's radius in real LEO). The mission operations model computes daily
  // science/data values separately; this view illustrates the sequence.
  const periodMinutes=circularOrbitPeriodMinutes(altitudeKm);
  const orbitalRadiusKm=EARTH.equatorialRadiusKm+altitudeKm;
  const radius=136+(altitudeKm-400)*.045;
  const eclipseFraction=Math.asin(EARTH.equatorialRadiusKm/orbitalRadiusKm)/Math.PI;
  const orbitDurationSeconds=13.5*periodMinutes/93;
  const orbitOffsetSeconds=-((((completedDays*1440/periodMinutes)%1)+1)%1)*orbitDurationSeconds;
  return <div className="mission-orbit-scene">
    <div className="mission-orbit-head">
      <div><span className="eyebrow">LIVE MISSION ANIMATION / EARTH ORBIT</span>
        <h4>Satellite operations</h4></div>
      <span className="orbit-live-pill">{finished?'MISSION COMPLETE':'SIMULATED FLIGHT'}</span>
    </div>
    <svg viewBox="0 0 620 382" className="mission-orbit-svg" role="img"
      aria-label={'Accelerated schematic Earth satellite orbit at '+altitudeKm+
        ' km. Calculated period '+periodMinutes.toFixed(1)+' minutes, estimated eclipse portion '+
        (eclipseFraction*100).toFixed(0)+' percent per orbit.'}>
      <defs>
        <radialGradient id="missionEarthOcean" cx="28%" cy="29%" r="85%">
          <stop offset="0%" stopColor="#2778b2"/>
          <stop offset="52%" stopColor="#164e83"/>
          <stop offset="100%" stopColor="#071b37"/>
        </radialGradient>
        <linearGradient id="missionTerminator"><stop offset="0%" stopColor="#020b18" stopOpacity="0"/>
          <stop offset="80%" stopColor="#020b18" stopOpacity=".52"/></linearGradient>
        <linearGradient id="missionBeam"><stop offset="0%" stopColor="#4bd7c4" stopOpacity=".05"/>
          <stop offset="100%" stopColor="#8ae4d8" stopOpacity=".8"/></linearGradient>
        <filter id="missionPlanetGlow"><feGaussianBlur stdDeviation="10"/></filter>
      </defs>
      <g opacity=".4">{[
        [40,35],[90,320],[535,61],[580,278],[500,340],[170,47],[340,19],[390,305],[20,190],
      ].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?1.9:1.1} fill="#9dcde7"/>)}</g>
      <g transform="translate(225 190)">
        <path d="M -180 -125 H -83" stroke="#e0b36f" strokeWidth="1.4" opacity=".8"/>
        <path d="M -175 -140 H -80" stroke="#e0b36f" strokeWidth="1.4" opacity=".5"/>
        <path d="M -180 -110 H -85" stroke="#e0b36f" strokeWidth="1.4" opacity=".5"/>
        <text x="-187" y="-153" fill="#e8c58e" fontSize="12" textAnchor="start">SUNLIGHT</text>
        <circle r={radius} fill="none" stroke="#507eac" strokeWidth="1.8" strokeDasharray="6 6"/>
        <path d={`M ${radius} 0 A ${radius} ${radius} 0 0 1 ${-radius} 0`}
          fill="none" stroke="#60c8d2" strokeWidth="2.4" opacity=".45"/>
        <circle r="102" fill="#35699d" opacity=".23" filter="url(#missionPlanetGlow)"/>
        <circle r="91" fill="url(#missionEarthOcean)" stroke="#5b8fb8" strokeWidth="1.3"/>
        <ellipse rx="91" ry="27" fill="none" stroke="#d6ebf6" strokeOpacity=".22"/>
        <ellipse rx="38" ry="91" fill="none" stroke="#d6ebf6" strokeOpacity=".18"/>
        <path d="M -47 -58 Q -72 -40 -49 -19 L -29 -6 -41 12 -14 25 1 16 -5 -11 18 -31 -5 -49Z"
          fill="#4b977e" opacity=".65"/>
        <path d="M 34 5 Q 56 -15 78 0 L 66 28 46 34 30 63 9 45Z" fill="#609e79" opacity=".65"/>
        <path d="M 0 -91 A 91 91 0 0 1 0 91 L 0 91 L 0 -91 Z" fill="url(#missionTerminator)"/>
        <g transform="translate(45 -77)">
          <circle cx="0" cy="0" r="5" fill="#8ff0d4"/>
          <circle cx="0" cy="0" r="12" stroke="#8ff0d4" fill="none" opacity=".5"/>
        </g>
        <g className={'mission-orbit-rotor '+(finished?'paused':'')}
          style={{animationDuration:orbitDurationSeconds+'s',
            animationDelay:orbitOffsetSeconds+'s',transformOrigin:'0px 0px'}}>
          <g transform={`translate(${radius} 0)`}>
            <path d="M -7 -14 H 7 L 12 11 -12 11 Z" fill="#e9d8a4" stroke="#c3af74" strokeWidth="1.2"/>
            <path d="M -32 -8 H -10 V 7 H -32 Z M 10 -8 H 32 V 7 H 10 Z" fill="#3972ae" stroke="#b0d7ed" strokeWidth="1"/>
            <circle r="27" fill="none" stroke="#91e3d0" strokeOpacity=".4" strokeDasharray="3 5" />
            <path d="M 0 11 L -17 36 L 17 36 Z" fill="#f3da8a" opacity=".28" className="mission-imaging-cone"/>
          </g>
        </g>
      </g>
      <g transform="translate(408 58)">
        <text x="0" y="0" fill="#abc3d7" fontSize="10" letterSpacing="1.2">EST. ORBIT PERIOD</text>
        <text x="0" y="29" fill="#f2d4a7" fontSize="22" fontWeight="700">{periodMinutes.toFixed(1)} min</text>
        <text x="0" y="56" fill="#abc3d7" fontSize="10" letterSpacing="1.1">ALTITUDE</text>
        <text x="0" y="82" fill="#dceefa" fontSize="20" fontWeight="700">{altitudeKm} km</text>
        <text x="0" y="111" fill="#abc3d7" fontSize="10" letterSpacing="1.1">ECLIPSE FRACTION</text>
        <text x="0" y="136" fill="#f2d4a7" fontSize="20" fontWeight="700">{(eclipseFraction*100).toFixed(1)}%</text>
      </g>
      <g transform="translate(389 286)">
        <rect width="183" height="59" rx="8" fill="#0e2943" stroke="#2b5672"/>
        <circle cx="18" cy="19" r="5" fill={downlinkAvailable?'#69e5c0':'#cfaa75'}/>
        <text x="31" y="23" fontSize="11" fill="#d8e8f3">{downlinkAvailable?'DOWNLINK ACTIVE':'DOWNLINK LIMITED'}</text>
        <text x="18" y="43" fontSize="10" fill="#a8bbd2">Ground network (game model)</text>
      </g>
      <text x="22" y="360" fill="#789ab6" fontSize="10">Orbit-period physics from shared Earth constants · altitude exaggerated · animation accelerated</text>
    </svg>
    <div className="mission-orbit-foot">
      <span><b>DAY {completedDays}/7</b> mission data timeline</span>
      <span><span className="mission-orbit-pulse"/> Satellite moving in ideal circular orbit</span>
    </div>
  </div>;
}
