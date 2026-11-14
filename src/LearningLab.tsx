import { useMemo, useState } from 'react';
import { idealDeltaVms, idealBurnDurationSeconds, massFlowKgPerSecond,
  solarArrayPowerW, minimumRadiatorAreaM2, idealLiquidSphericalTank } from './lib/spacecraftSystems';
import { earthOrbitAtTime } from './lib/orbitalMechanics';

type Topic = 'propulsion'|'power'|'thermal'|'tank'|'orbits'|'mission';
const TOPICS: {id:Topic;name:string}[] = [
  {id:'propulsion',name:'Propulsion'},
  {id:'power',name:'Electrical power'},
  {id:'thermal',name:'Thermal control'},
  {id:'tank',name:'Propellant tanks'},
  {id:'orbits',name:'Orbital mechanics'},
  {id:'mission',name:'Transfer design'},
];
const W = ({label,value,min,max,step,onChange,unit}:{label:string;value:number;min:number;max:number;step:number;onChange:(n:number)=>void;unit:string})=>
  <label className="learning-field"><span>{label} <small>{unit}</small></span><input type="number"
    min={min} max={max} step={step} value={value} onChange={e=>{
      const n=e.currentTarget.valueAsNumber;
      if(Number.isFinite(n))onChange(Math.min(max,Math.max(min,n)));
    }}/></label>;

function N({value,units,digits=2}:{value:number;units:string;digits?:number}){
  return <strong className="learning-number">{Number.isFinite(value)?
    value.toLocaleString('en-US',{maximumFractionDigits:digits})+' '+units:'Outside model range'}</strong>;
}

export default function LearningLab({onOpenBuilder,onOpenOrbital}:{
  onOpenBuilder:()=>void; onOpenOrbital:()=>void;
}) {
  const [topic,setTopic]=useState<Topic>('propulsion');
  const [dry,setDry]=useState(120);
  const [fuel,setFuel]=useState(25);
  const [isp,setIsp]=useState(1390);
  const [thrust,setThrust]=useState(0.013);
  const [cellArea,setCellArea]=useState(4);
  const [distance,setDistance]=useState(1);
  const [efficiency,setEfficiency]=useState(29.5);
  const [heat,setHeat]=useState(100);
  const [radiatorTemp,setRadiatorTemp]=useState(300);
  const [emissivity,setEmissivity]=useState(.85);
  const [tankPressure,setTankPressure]=useState(20);
  const [tankFuel,setTankFuel]=useState(5);
  const [density,setDensity]=useState(1000);
  const [perigee,setPerigee]=useState(400);
  const [eccentricity,setEccentricity]=useState(.2);
  const lesson = useMemo(()=>{
    const deltaV=idealDeltaVms(dry+fuel,dry,isp);
    const flow=massFlowKgPerSecond(thrust,isp);
    const burn=idealBurnDurationSeconds(fuel,thrust,isp)/86400;
    const power=solarArrayPowerW({cellAreaM2:cellArea,bolEfficiency:efficiency/100,
      distanceAu:distance,incidenceCosine:1,userDeratingFactor:.75});
    const radiator=minimumRadiatorAreaM2({heatLoadW:heat,surfaceEmissivity:emissivity,
      radiatorTemperatureK:radiatorTemp,effectiveSinkTemperatureK:3});
    const tank=idealLiquidSphericalTank({propellantMassKg:tankFuel,liquidDensityKgM3:density,
      ullageFraction:.05,differentialPressurePa:tankPressure*1e5,
      allowableMembraneStressPa:150e6,shellMaterialDensityKgM3:2700});
    const orbit=earthOrbitAtTime(perigee,eccentricity,0);
    return {deltaV,flow,burn,power,radiator,tank,orbit};
  },[dry,fuel,isp,thrust,cellArea,distance,efficiency,heat,radiatorTemp,emissivity,tankPressure,tankFuel,density,perigee,eccentricity]);

  return <section className="panel learning-lab" aria-label="Engineering learning center">
    <div className="panel-heading"><div>
      <div className="eyebrow">ENGINEERING ACADEMY · LEARN BY EXPERIMENTING</div>
      <h2>The physics behind your spacecraft</h2>
      <p>Explore the same first-order equations used in the builder. Change an input and observe the result.</p>
    </div><span className="sys-model-label">INTERACTIVE LESSONS</span></div>
    <div className="learning-topic-list" role="tablist" aria-label="Engineering lesson">
      {TOPICS.map(t=><button type="button" role="tab" key={t.id} aria-selected={topic===t.id}
        className={topic===t.id?'selected':''} onClick={()=>setTopic(t.id)}>{t.name}</button>)}
    </div>
    {topic==='propulsion'&&<>
      <h3>1. How efficiently can a rocket change its motion?</h3>
      <p>The ideal rocket equation links propellant mass, specific impulse and change in velocity. Higher <b>specific impulse</b> (Isp, seconds) means more exhaust momentum per kilogram of propellant, not necessarily more thrust.</p>
      <div className="learning-formula">Δv = Isp × g₀ × ln(m₀ / mf)</div>
      <p>For one burn, <b>m₀</b> is mass before the burn, <b>mf</b> is mass after propellant is consumed and <b>g₀</b> is standard gravity (9.80665 m/s²). This ignores external forces, pressure losses and propulsion throttling.</p>
      <div className="learning-formula">ṁ = F / (Isp × g₀) &nbsp; ; &nbsp; burn time = propellant / ṁ</div>
      <div className="learning-inputs">
        <W label="Dry mass + payload" unit="kg" value={dry} min={10} max={2000} step={5} onChange={setDry}/>
        <W label="Propellant" unit="kg" value={fuel} min={.1} max={500} step={5} onChange={setFuel}/>
        <W label="Specific impulse" unit="s" value={isp} min={100} max={5000} step={10} onChange={setIsp}/>
        <W label="Thrust" unit="N" value={thrust} min={.001} max={100} step={.001} onChange={setThrust}/>
      </div>
      <div className="learning-output">
        <div><span>Ideal Δv</span><N value={lesson.deltaV} units="m/s" digits={0}/></div>
        <div><span>Propellant flow</span><N value={lesson.flow*1e6} units="mg/s"/></div>
        <div><span>Continuous burn</span><N value={lesson.burn} units="days" digits={1}/></div>
      </div>
      <p className="learning-caution">Ion/Hall thrusters have very high Isp but low thrust. A transfer using continuous tiny thrust cannot be modeled as a single instant maneuver. Electric thrusters also require electrical power.</p>
      <a href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/" target="_blank" rel="noreferrer">NASA Glenn — ideal rocket equation ↗</a>
    </>}
    {topic==='power'&&<>
      <h3>2. How much power can sunlight provide?</h3>
      <p>NASA measured about 1,361.6 W/m² of solar irradiance near 1 AU. A photovoltaic array captures a fraction based on its active cell area, beginning-of-life efficiency, pointing angle and realistic losses.</p>
      <div className="learning-formula">Psolar ≈ 1361.6 × A × η × cos(θ) × d / r²</div>
      <p><b>A</b> is cell area (m²); <b>η</b> is conversion efficiency, <b>r</b> is distance in AU, and <b>d</b> is an illustrative derate factor. Here we assume panels face the Sun and use a 75% derate.</p>
      <div className="learning-inputs">
        <W label="Active cell area" unit="m²" value={cellArea} min={0} max={150} step={1} onChange={setCellArea}/>
        <W label="Distance from Sun" unit="AU" value={distance} min={.5} max={40} step={.5} onChange={setDistance}/>
        <W label="Cell efficiency" unit="%" value={efficiency} min={5} max={42} step={.5} onChange={setEfficiency}/>
      </div>
      <div className="learning-output"><div><span>Approximate electrical output</span><N value={lesson.power} units="W"/></div>
        <div><span>Power at same area, 1 AU</span><N value={lesson.power*distance*distance} units="W"/></div></div>
      <p className="learning-caution">Increasing the number of solar wings without increasing <b>total cell area</b> does not increase generated power. It changes mounting mass and mechanical packaging. RTGs and fission sources operate without solar irradiation, but add mass, heat and safety requirements.</p>
      <a href="https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/" target="_blank" rel="noreferrer">NASA — spacecraft electrical power systems ↗</a>
    </>}
    {topic==='thermal'&&<>
      <h3>3. Spacecraft radiators reject heat by radiation</h3>
      <p>In vacuum there is effectively no atmospheric convection. Radiators mainly reject energy through infrared radiation, with emissivity, temperature and incident solar/planetary radiation determining how large they must be.</p>
      <div className="learning-formula">Qrad = ε × σ × A × (Trad⁴ − Tsink⁴)</div>
      <p>Here σ = 5.670374419 × 10⁻⁸ W/(m² K⁴). The worked example assumes a 3 K sink, clear view and <b>no solar, planetary IR or albedo loading</b>. The builder uses a separate estimated solar absorption term.</p>
      <div className="learning-inputs">
        <W label="Heat to reject" unit="W" value={heat} min={0} max={5000} step={10} onChange={setHeat}/>
        <W label="Radiator temperature" unit="K" value={radiatorTemp} min={180} max={420} step={5} onChange={setRadiatorTemp}/>
        <W label="Infrared emissivity" unit="ε" value={emissivity} min={.05} max={1} step={.05} onChange={setEmissivity}/>
      </div>
      <div className="learning-output"><div><span>Ideal radiator area</span><N value={lesson.radiator} units="m²"/></div></div>
      <p className="learning-caution">Multiple radiators divide the required total area among surfaces, but do not magically increase cooling at the same total area and conditions. Reactor/RTG waste heat needs dedicated analysis and may be handled separately from the bus.</p>
      <a href="https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/" target="_blank" rel="noreferrer">NASA — thermal control technologies ↗</a>
    </>}
    {topic==='tank'&&<>
      <h3>4. Fuel mass is not the same as tank hardware mass</h3>
      <p>For an incompressible liquid, density sets the storage volume. A pressure vessel also needs a shell, feed hardware and a propellant-acquisition arrangement that prevents gas ingestion under microgravity.</p>
      <div className="learning-formula">Vliquid = mprop / ρ &nbsp; ; &nbsp; Vtank = Vliquid / (1 − ullage)</div>
      <div className="learning-formula">tshell ≈ ΔP × r / (2 × Sallow) &nbsp; ; &nbsp; mshell ≈ 4πr² × t × ρshell</div>
      <p>These equations assume an ideal <b>thin-walled spherical LIQUID tank</b>. This example assumes 5% ullage, 150 MPa allowable stress and 2,700 kg/m³ shell density.</p>
      <div className="learning-inputs">
        <W label="Liquid propellant mass" unit="kg" value={tankFuel} min={.1} max={300} step={1} onChange={setTankFuel}/>
        <W label="Liquid density" unit="kg/m³" value={density} min={300} max={2000} step={50} onChange={setDensity}/>
        <W label="Differential pressure" unit="bar" value={tankPressure} min={1} max={100} step={1} onChange={setTankPressure}/>
      </div>
      <div className="learning-output">
        <div><span>Tank internal volume</span><N value={lesson.tank.tankInternalVolumeM3*1000} units="L"/></div>
        <div><span>Ideal shell thickness</span><N value={lesson.tank.idealWallThicknessM*1000} units="mm" digits={3}/></div>
        <div><span>Ideal shell mass</span><N value={lesson.tank.idealShellMassKg} units="kg" digits={3}/></div>
      </div>
      <p className="learning-caution">The ideal shell estimate is NOT a manufacturable flight tank design. Minimum thickness, welds, bosses, burst/proof factors, fatigue, PMDs, plumbing and supports may dominate. Compressed xenon or solid iodine require different storage physics.</p>
      <a href="https://www.nasa.gov/reference/jsc-propulsion-subsystems/" target="_blank" rel="noreferrer">NASA — spacecraft propulsion subsystem design ↗</a>
    </>}
    {topic==='orbits'&&<>
      <h3>5. Why does an orbiting spacecraft speed up near Earth?</h3>
      <p>For an ideal two-body orbit, gravity continuously bends the velocity vector. An elliptical orbit reaches its highest speed at <b>perigee</b> and lowest speed at <b>apogee</b>. The vis-viva equation links speed and orbital geometry.</p>
      <div className="learning-formula">v² = μ × (2/r − 1/a) &nbsp; ; &nbsp; T = 2π × √(a³/μ)</div>
      <p><b>μ</b> is the central body's gravitational parameter; <b>r</b> is distance to its center and <b>a</b> is semimajor axis. Period T increases rapidly for larger orbits. This game uses the two-body model with no atmospheric drag, J₂ perturbation or third-body gravity.</p>
      <div className="learning-inputs">
        <W label="Perigee altitude" unit="km" value={perigee} min={180} max={30000} step={100} onChange={setPerigee}/>
        <W label="Eccentricity" unit="0–1" value={eccentricity} min={0} max={.8} step={.05} onChange={setEccentricity}/>
      </div>
      <div className="learning-output">
        <div><span>Perigee speed</span><N value={lesson.orbit.speedKmS} units="km/s" digits={3}/></div>
        <div><span>Orbital period</span><N value={lesson.orbit.periodMinutes} units="minutes" digits={1}/></div>
        <div><span>Apogee altitude</span><N value={lesson.orbit.apogeeAltitudeKm} units="km" digits={0}/></div>
      </div>
      <button className="secondary-button" type="button" onClick={onOpenOrbital}>Open animated orbital map →</button>
    </>}
    {topic==='mission'&&<>
      <h3>6. Mission design is an optimization problem</h3>
      <p>A Lambert solver finds a Keplerian transfer arc connecting two planetary positions in a specified amount of time. The solution determines a Sun-centered departure velocity and arrival velocity, which can be compared with each planet's own velocity.</p>
      <div className="learning-formula">C₃ = v∞,dep² &nbsp; ; &nbsp; Δvparking = √(v∞² + 2μ/r) − √(μ/r)</div>
      <p><b>C₃</b> is characteristic departure energy (km²/s²), not delta-V. <b>v∞</b> is the excess velocity relative to the departing or arriving planet. The idealized parking burn above uses circular orbits and impulsive maneuvers.</p>
      <p>To find a low-cost transfer for a <b>fixed departure day</b>, sample arrival dates / flight durations, solve each Lambert transfer, and compare the modeled departure burn or combined departure and capture burns. A wider search across <b>both dates</b> creates a porkchop plot.</p>
      <p>Long-duration electric propulsion requires a different problem: integrate very small thrust over time while changing mass and accounting for solar power, pointing and duty cycle. A Lambert minimum cannot be assumed reachable by a Hall thruster.</p>
      <p className="learning-caution">Never require a propulsion technology just because a destination is distant. Mission feasibility depends on its trajectory, burn time, propellant and mass, power, thermal constraints and engineering margins.</p>
      <button className="secondary-button" type="button" onClick={onOpenOrbital}>Try the Orekit transfer optimizer →</button>
      <a href="https://ssd.jpl.nasa.gov/planets/approx_pos.html" target="_blank" rel="noreferrer">JPL — approximate planetary positions ↗</a>
    </>}
    <div className="learning-footer">
      <span>These are first-order educational models. All hardware specifications, assumptions and data provenance are documented in the repository.</span>
      <button className="secondary-button" type="button" onClick={onOpenBuilder}>Apply ideas in the Spacecraft Builder →</button>
    </div>
  </section>;
}
