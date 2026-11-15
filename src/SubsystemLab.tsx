import { useMemo, useState } from 'react';
import Spacecraft3D, {type PartName} from './Spacecraft3D';
import FieldHelp from './components/FieldHelp';
import { descriptionFor } from './lib/fieldHelp';
import {
  BATTERY_PACKS, IN_SPACE_THRUSTERS, SOLAR_CELLS, THERMAL_SURFACES,
} from './lib/spacecraftTechnology';
import { POWER_SYSTEMS, type PowerSourceId } from './lib/powerSources';
import { SCIENCE_INSTRUMENTS, type InstrumentSelection } from './lib/instrumentCatalog';
import type { ThrusterId } from './lib/subsystemDesign';
import {hasTechnology,THRUSTER_RESEARCH,POWER_RESEARCH,INSTRUMENT_RESEARCH,
  type TechnologyId} from './lib/technologyTree';
import {
  DEFAULT_SUBSYSTEM_DESIGN, DESTINATIONS, sizeSubsystemDesign,
  type SubsystemDesign, type SystemResults,
} from './lib/subsystemDesign';

/**
 * Interactive IN-SPACE spacecraft bus engineering lab.
 * Independent of the current high-thrust launch vehicle campaign.
 * Inputs persist locally; models are first-order and explicitly unqualified.
 */
const SAVE_KEY = 'space-race-systems-lab-v1';

export function readSubsystemDesign(): SubsystemDesign {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as Partial<SubsystemDesign> | null;
    if (!stored || typeof stored !== 'object') return DEFAULT_SUBSYSTEM_DESIGN;
    const next = { ...DEFAULT_SUBSYSTEM_DESIGN };
    for (const key of Object.keys(next) as Array<keyof SubsystemDesign>) {
      if (typeof stored[key] === typeof next[key]) {
        // The persisted state is validated again in sizeSubsystemDesign.
        (next as unknown as Record<string, unknown>)[key] = stored[key];
      }
    }
    return next;
  } catch {
    return DEFAULT_SUBSYSTEM_DESIGN;
  }
}

function fmt(value: number | null, units = '', digits = 1): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', { maximumFractionDigits: digits }) + (units ? ' ' + units : '');
}

function NumberField({
  label, value, unit, min, max, step = 1, onChange, hint,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <label className="sys-field">
      <span>{label}<small>{unit}</small><FieldHelp term={label}/></span>
      <input
        type="number" title={descriptionFor(label)}
        min={min} max={max} step={step} value={value}
        onChange={e => {
          const next = e.currentTarget.valueAsNumber;
          if (Number.isFinite(next)) onChange(Math.max(min, Math.min(max, next)));
        }}
      />
      {hint && <em>{hint}</em>}
    </label>
  );
}

function Result({ label, value, note, tone }: {
  label: string; value: string; note?: string; tone?: 'good' | 'bad' | 'warn';
}) {
  return (
    <div className={'sys-result ' + (tone ? 'sys-' + tone : '')}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

export default function SubsystemLab({design,onDesignChange,unlockedTechnologies=[],devMode=false}:{
  design:SubsystemDesign;onDesignChange:(next:SubsystemDesign)=>void;
  unlockedTechnologies?:readonly TechnologyId[];
  devMode?:boolean;
}) {
  const [activeSystemTab,setActiveSystemTab] = useState<'propulsion'|'payload'|'power'|'thermal'|'tank'|'analysis'>('propulsion');
  const analysis = useMemo(() => {
    try { return { result: sizeSubsystemDesign(design), error: '' }; }
    catch (error) {
      return { result: null as SystemResults | null, error: error instanceof Error ? error.message : 'Invalid inputs' };
    }
  }, [design]);
  const result = analysis.result;
  const unlocked=(id:TechnologyId|undefined)=>hasTechnology(id,unlockedTechnologies,devMode);
  const installedLocked=[
    THRUSTER_RESEARCH[design.thrusterId],THRUSTER_RESEARCH[design.secondaryThrusterId],
    POWER_RESEARCH[design.powerSourceId],INSTRUMENT_RESEARCH[design.payloadInstrumentId],
  ].filter(id=>id&&!unlocked(id));
  const isFission=POWER_SYSTEMS[design.powerSourceId].class==='fission';

  function change<K extends keyof SubsystemDesign>(key: K, value: SubsystemDesign[K]) {
    onDesignChange({...design,[key]:value});
  }

  const isLiquid = design.thrusterId === 'mono-reference' ||
    design.secondaryThrusterId === 'mono-reference';
  const hasXenon = result?.tankReports.some(t=>t.kind==='xenon')??false;
  const selectedElectric = IN_SPACE_THRUSTERS.find(t => t.id === design.thrusterId);
  const selectedInstrument=design.payloadInstrumentId==='none'?null:SCIENCE_INSTRUMENTS[design.payloadInstrumentId];
  const thrusterChoices=[
    {id:'mono-reference',name:'Chemical monopropellant · 1 N / 230 s (illustrative)'},
    ...IN_SPACE_THRUSTERS.map(t=>({id:t.id,
      name:t.name+' · '+t.nominalSpecificImpulseSeconds+' s · '+(t.nominalThrusterPowerW/1000).toFixed(2)+' kW'})),
  ];

  return (
    <section className="panel sys-panel" id="systems-lab" aria-label="In-space spacecraft systems engineering lab">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">02 / NASA TECHNOLOGY LAB</div>
          <h2>Spacecraft Subsystems</h2>
          <p>Choose the parts and the game derives the coupled mass, heat, electrical demand and propellant storage. Add a second propulsion architecture when useful.</p>
        </div>
        <span className="sys-model-label">BETA · PRELIMINARY</span>
      </div>
      <p className="sys-intro">
        This is separate from the launch vehicle in Mission Control. Real published component examples are used where available;
        everything labeled <b>assumption</b> is an illustrative sizing input, not a NASA-certified design.
        Technologies marked locked are developed in Research &amp; Roadmap. Dev Mode enables all catalog parts for presentations.
      </p>
      {installedLocked.length>0&&<div className="sys-feedback sys-error" role="status">
        This design uses {installedLocked.length} technology research unlock(s) you have not permanently acquired. You can inspect the saved design, but guided missions cannot launch it until the technologies are researched or Dev Mode is enabled.
      </div>

      {result&&<div className="sys-live-strip" aria-label="Live spacecraft engineering summary">
        <div><small>MODELED WET MASS</small><strong>{fmt(result.modeledWetMassKg,'kg',1)}</strong></div>
        <div><small>SOLAR ARRAY + MOUNTS</small><strong>{fmt(result.arrayMassKg,'kg',1)}</strong></div>
        <div><small>PEAK ELECTRICAL DRAW</small><strong>{fmt(result.totalElectricalDemandW,'W',0)}</strong></div>
        <div><small>TANKS AND FEEDS</small><strong>{fmt(result.totalTankHardwareMassKg,'kg',1)}</strong></div>
      </div>}
      <Spacecraft3D design={design} analysis={result} onPartSelect={(part:PartName)=>{
        const where:Record<PartName,'propulsion'|'payload'|'power'|'thermal'|'tank'|'analysis'>={
          bus:'analysis',power:'power',radiator:'thermal',tank:'tank',
          propulsion:'propulsion',antenna:'payload',payload:'payload',
        };
        setActiveSystemTab(where[part]);
      }}/>

      <div className="sys-tab-strip" role="tablist" aria-label="Spacecraft subsystem">
        {([
          ['propulsion','Propulsion'], ['payload','Science payload'], ['power','Power'], ['thermal','Thermal'],
          ['tank','Tanks'], ['analysis','Engineering Analysis'],
        ] as const).map(([id,label])=>(
          <button key={id} role="tab" aria-selected={activeSystemTab===id}
            className={activeSystemTab===id?'selected':''}
            onClick={()=>setActiveSystemTab(id)}>{label}</button>
        ))}
      </div>

      <div className={'sys-group '+(activeSystemTab==='propulsion'?'':'sys-hidden')}>
        <div className="sys-heading"><span>01</span><div><h3>Propulsion</h3><small>Specific impulse, thrust, mass flow and burn time</small></div></div>
        <div className="sys-input-grid">
          <label className="sys-field sys-wide">
            <span>Primary propulsion system<small>SELECT COMPONENT</small><FieldHelp term="In-space engine / technology"/></span>
            <select value={design.thrusterId} onChange={e => change('thrusterId', e.target.value as ThrusterId)}>
              {thrusterChoices.map(t=><option key={t.id} value={t.id}
                disabled={!unlocked(THRUSTER_RESEARCH[t.id])}>{t.name}{!unlocked(THRUSTER_RESEARCH[t.id])?' · RESEARCH LOCKED':''}</option>)}
            </select>
          </label>
          <NumberField label="Number of thrusters" unit="identical engines · concurrent operation" value={design.thrusterCount} min={1} max={8} step={1} onChange={n=>change("thrusterCount",n)}/>
          <NumberField label="Primary propellant inventory" unit="kg · stored by selected engine type" value={design.propellantMassKg} min={0.1} max={300} step={0.5} onChange={n=>change('propellantMassKg', n)}/>
          <label className="sys-field sys-wide">
            <span>Optional second propulsion system<small>SEPARATE ENGINE + PROPELLANT</small><FieldHelp term="Optional second propulsion system"/></span>
            <select value={design.secondaryThrusterId} onChange={e=>change('secondaryThrusterId',e.target.value as SubsystemDesign['secondaryThrusterId'])}>
              <option value="none">None · one propulsion system</option>
              {thrusterChoices.map(t=><option key={t.id} value={t.id}
                disabled={!unlocked(THRUSTER_RESEARCH[t.id])}>{t.name}{!unlocked(THRUSTER_RESEARCH[t.id])?' · RESEARCH LOCKED':''}</option>)}
            </select>
          </label>
          {design.secondaryThrusterId!=='none'&&<>
            <NumberField label="Secondary thruster count" unit="identical engines" value={design.secondaryThrusterCount}
              min={1} max={8} step={1} onChange={n=>change('secondaryThrusterCount',n)}/>
            <NumberField label="Secondary propellant" unit="kg · independent tank" value={design.secondaryPropellantMassKg}
              min={0.1} max={300} step={0.5} onChange={n=>change('secondaryPropellantMassKg',n)}/>
            <label className="sys-field">
              <span>Burn sequence<small>IDEAL EQUATION ONLY</small><FieldHelp term="Burn sequence"/></span>
              <select value={design.burnOrder} onChange={e=>change('burnOrder',e.target.value as SubsystemDesign['burnOrder'])}>
                <option value="primary-first">Primary burns first</option>
                <option value="secondary-first">Secondary burns first</option>
              </select>
            </label>
          </>}
          <NumberField label="Spacecraft bus (other dry hardware)" unit="kg · assumption" value={design.busDryMassKg} min={1} max={2000} step={5} onChange={n=>change('busDryMassKg',n)}/>

        </div>
        {result&&<div className="sys-architecture">
          <div><strong>Primary · {result.primaryMode.name}</strong><span>{result.primaryMode.kind} · {fmt(result.primaryMode.thrustN*1000,'mN',1)} · {fmt(result.primaryMode.completePropulsionPowerW,'W',0)} peak bus draw</span></div>
          {result.secondaryMode&&<div><strong>Secondary · {result.secondaryMode.name}</strong><span>{result.secondaryMode.kind} · {fmt(result.secondaryMode.thrustN*1000,'mN',1)} · {fmt(result.secondaryMode.completePropulsionPowerW,'W',0)} peak bus draw</span></div>}
          <p>Both engines count toward launch mass. The power and thermal systems are sized to the highest single active engine family, not both firing at once. Ideal Δv uses separate sequential burns; no real low-thrust trajectory is implied.</p>
        </div>}
        <p className="sys-subnote">
          {selectedElectric
            ? `NASA-surveyed per-thruster operating point: ${fmt(selectedElectric.nominalThrustN * 1000, 'mN', 2)} thrust · ${fmt(selectedElectric.nominalSpecificImpulseSeconds, 's', 0)} Isp · ${fmt(selectedElectric.nominalThrusterPowerW, 'W', 0)} rated electrical reference (thruster or PPU-input scope depends on source). This is not necessarily a complete propulsion-system or spacecraft mass.`
            : 'Chemical baseline 1 N, 230 s, 8 W for valves (assumptions within NASA-surveyed monopropellant performance ranges).'}
          {' '}<a href="https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/" target="_blank" rel="noreferrer">NASA propulsion survey ↗</a>
        </p>
      </div>

      <div className={'sys-group '+(activeSystemTab==='payload'?'':'sys-hidden')}>
        <div className="sys-heading"><span>02</span><div><h3>Scientific payload</h3><small>Instrument mass, continuous active load and mission suitability</small></div></div>
        <div className="sys-input-grid">
          <label className="sys-field sys-wide">
            <span>Installed science sensor<small>GAME ENGINEERING EXAMPLES</small><FieldHelp term="Installed science sensor"/></span>
            <select value={design.payloadInstrumentId} onChange={e=>change('payloadInstrumentId',e.target.value as InstrumentSelection)}>
              <option value="none">No catalog sensor · generic payload only</option>
              {Object.values(SCIENCE_INSTRUMENTS).map(inst=><option key={inst.id} value={inst.id}
                disabled={!unlocked(INSTRUMENT_RESEARCH[inst.id])}>
                {inst.name} · {inst.massKg} kg · {inst.powerW} W · {inst.category}{!unlocked(INSTRUMENT_RESEARCH[inst.id])?' · RESEARCH LOCKED':''}</option>)}
            </select>
          </label>
          <NumberField label="Additional instruments / cargo mass" unit="kg · excludes selected sensor" value={design.payloadMassKg}
            min={0} max={1000} step={5} onChange={n=>change('payloadMassKg',n)}/>
        </div>
        {selectedInstrument?<div className="sys-sensor-card">
          <div><span className="sys-chip">{selectedInstrument.category==='earth'?'EARTH OBSERVATION':'DEEP-SPACE SCIENCE'}</span><h4>{selectedInstrument.name}</h4>
            <p>{selectedInstrument.description}</p>
            <a href={selectedInstrument.reference} target="_blank" rel="noreferrer">Explore NASA science inspiration ↗</a>
          </div>
          <div className="sys-sensor-numbers"><strong>{fmt(selectedInstrument.massKg,'kg')}</strong><span>INSTALLED MASS</span>
            <strong>{fmt(selectedInstrument.powerW,'W')}</strong><span>ACTIVE DRAW</span>
            <strong>{selectedInstrument.dataMbps} Mb/s</strong><span>ILLUSTRATIVE DATA</span></div>
        </div>:<p className="sys-subnote">Install a camera, magnetometer, spectrometer, thermal sensor or altimeter to automatically add its mass, active electric demand and heat. Values are illustrative—not certified specifications of NASA flight instruments.</p>}
        <p className="sys-subnote">Earth Observation One uses its own chosen sensor as this payload slot and does not double-count the generic Engineering Lab payload when launching.</p>
      </div>

      <div className={'sys-group '+(activeSystemTab==='power'?'':'sys-hidden')}>
        <div className="sys-heading"><span>02</span><div><h3>Electrical power</h3><small>Solar generation → power processing → propulsion</small></div></div>
        <div className="sys-input-grid">
          <label className="sys-field sys-wide">
            <span>Primary power generation<small>NASA HERITAGE / RESEARCH</small><FieldHelp term="Primary power generation"/></span>
            <select value={design.powerSourceId} onChange={e=>change('powerSourceId',e.target.value as PowerSourceId)}>
              {Object.values(POWER_SYSTEMS).map(system=><option key={system.id} value={system.id}
                disabled={!unlocked(POWER_RESEARCH[system.id])}>{system.name} · {system.heritage}{!unlocked(POWER_RESEARCH[system.id])?' · RESEARCH LOCKED':''}</option>)}
            </select>
          </label>
          {design.powerSourceId !== 'solar' && <>
            <NumberField label="Number of power units" unit="systems" value={design.powerSourceCount} min={1} max={8} step={1} onChange={n=>change('powerSourceCount',n)}/>
            <NumberField label="Mission age for degradation" unit="years" value={design.missionYears} min={0} max={40} step={1} onChange={n=>change('missionYears',n)}/>
          </>}
          <label className="sys-field">
            <span>Solar cell type<small>NASA-SURVEYED</small><FieldHelp term="Solar cell type"/></span>
            <select value={design.solarCellId} onChange={e=>change('solarCellId',e.target.value)}>
              {SOLAR_CELLS.map(cell=><option key={cell.id} value={cell.id}>{cell.name} ({fmt(cell.efficiencyBOL*100,'%',1)} BOL)</option>)}
            </select>
          </label>
          <label className="sys-field">
            <span>Mission solar distance<small>APPROXIMATE REGION</small><FieldHelp term="Mission solar distance"/></span>
            <select value={design.distanceAu} onChange={e=>change('distanceAu',Number(e.target.value))}>
              {DESTINATIONS.map(d=><option key={d.name} value={d.distanceAu}>{d.name} ({d.distanceAu} AU)</option>)}
            </select>
          </label>
          <NumberField label="Number of solar wings" unit="deployable panel assemblies" value={design.solarWingCount} min={1} max={8} step={1} onChange={n=>change("solarWingCount",n)}/>
          <NumberField label="Active solar cell area" unit="m²" value={design.cellAreaM2} min={0} max={250} step={0.5} onChange={n=>change('cellAreaM2',n)}/>
          <NumberField label="Base avionics load" unit="W · only the non-component baseline" value={design.busElectricalPowerW} min={0} max={5000} step={10} onChange={n=>change('busElectricalPowerW',n)}/>
          <label className="sys-field">
            <span>Battery pack technology<small>NASA-SURVEYED</small><FieldHelp term="Battery pack technology"/></span>
            <select value={design.batteryPackId} onChange={e=>change('batteryPackId',e.target.value)}>
              {BATTERY_PACKS.map(b=><option key={b.id} value={b.id}>{b.name} · {b.specificEnergyWhKg} Wh/kg</option>)}
            </select>
          </label>
          <NumberField label="Eclipse / no-solar duration" unit="hours · assumption" value={design.eclipseHours} min={0} max={30} step={0.1} onChange={n=>change('eclipseHours',n)}/>
        </div>
        {result&&<div className="sys-auto-ledger">
          <div className="eyebrow">AUTO-CALCULATED POWER LEDGER</div>
          <div><span>Base avionics / platform</span><strong>{fmt(result.baseBusPowerW,'W',1)}</strong></div>
          <div><span>Wing controls · {design.solarWingCount} wings</span><strong>{fmt(result.wingControlPowerW,'W',1)}</strong></div>
          <div><span>Radiator sensors · {design.radiatorPanelCount} panels</span><strong>{fmt(result.radiatorControlPowerW,'W',1)}</strong></div>
          <div><span>Installed science instrument</span><strong>{fmt(result.instrumentPowerW,'W',1)}</strong></div>
          <div><span>Distribution / wiring losses</span><strong>{fmt(result.harnessLossW,'W',1)}</strong></div>
          <div><span>Worst active propulsion mode incl. PPU</span><strong>{fmt(result.propulsionPeakPowerW,'W',1)}</strong></div>
          <div className="total"><span>Total peak spacecraft power</span><strong>{fmt(result.totalElectricalDemandW,'W',1)}</strong></div>
          <div className="total"><span>Solar array mass + wing mounts</span><strong>{fmt(result.arrayMassKg,'kg',2)}</strong></div>
        </div>}
        <p className="sys-subnote">
          Selected radioisotope or fission hardware operates alongside solar panels, with published reference mass included when available. Solar model uses measured 1 AU irradiance, cell efficiency and inverse-square solar distance;
          a 75% overall array derate and 88% thruster power-processing efficiency are <b>assumptions</b>. Solar wing count redistributes the selected total cell area.
          Battery reserve assumes 80% usable capacity and 90% discharge efficiency. Published generator masses exclude mission-specific mounting, and reactor integrations need independent thermal and safety analyses.
          {' '}{design.powerSourceId !== 'solar' && <a href={POWER_SYSTEMS[design.powerSourceId].sourceUrl} target="_blank" rel="noreferrer">Selected NASA power source ↗</a>}
          <a href="https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/" target="_blank" rel="noreferrer"> NASA power survey ↗</a>
        </p>
      </div>

      <div className={'sys-group '+(activeSystemTab==='thermal'?'':'sys-hidden')}>
        <div className="sys-heading"><span>03</span><div><h3>Thermal management</h3><small>Electrical heat generation and radiator solar loading</small></div></div>
        <div className="sys-input-grid">
          <label className="sys-field">
            <span>Radiator surface treatment<small>NASA-SURVEYED α</small><FieldHelp term="Radiator surface treatment"/></span>
            <select value={design.coatingId} onChange={e=>change('coatingId',e.target.value)}>
              {THERMAL_SURFACES.map(t=><option key={t.id} value={t.id}>{t.name} · α={t.solarAbsorptivityBOL}</option>)}
            </select>
          </label>
          <NumberField label="IR emissivity (ε)" unit="assumption · 0–1" value={design.infraredEmissivity} min={0.1} max={1} step={0.05} onChange={n=>change('infraredEmissivity',n)}/>
          <NumberField label="Number of radiator panels" unit="cooling panels" value={design.radiatorPanelCount} min={1} max={8} step={1} onChange={n=>change("radiatorPanelCount",n)}/>
          <NumberField label="Installed radiator area" unit="m² · drives heat rejection and spacecraft mass" value={design.installedRadiatorAreaM2} min={0} max={25} step={0.1} onChange={n=>change('installedRadiatorAreaM2',n)}/>
          <NumberField label="Radiator operating temperature" unit="K · assumption" value={design.radiatorTemperatureK} min={180} max={420} step={5} onChange={n=>change('radiatorTemperatureK',n)}/>
          <NumberField label="Radiator sun incidence factor" unit="assumption · 0–1" value={design.radiatorSunIncidence} min={0} max={1} step={0.05} onChange={n=>change('radiatorSunIncidence',n)}/>
        </div>
        {isFission&&<div className="sys-reactor-thermal">
          <div className="eyebrow">FISSION THERMAL ENGINEERING · SEPARATE HEAT LOOP</div>
          <h4>Deployable remote reactor radiator</h4>
          <p>A fission reactor produces far more thermal energy than electricity. Place radiator panels on a separation truss to reject waste heat without assuming it passes through the low-temperature spacecraft-bus radiator.</p>
          <div className="sys-input-grid">
            <NumberField label="Reactor branch radiator area" unit="m² · remote two-sided-equivalent modeled area"
              value={design.reactorRadiatorAreaM2} min={0} max={250} step={.5}
              onChange={n=>change('reactorRadiatorAreaM2',n)}/>
            <NumberField label="Reactor radiator temperature" unit="K · illustrative high-temperature surface"
              value={design.reactorRadiatorTemperatureK} min={250} max={1200} step={25}
              onChange={n=>change('reactorRadiatorTemperatureK',n)}/>
          </div>
          {result&&<div className="sys-reactor-ledger">
            <div><span>Generator thermal waste</span><strong>{fmt(result.reactorHeatLoadW,'W',0)}</strong></div>
            <div><span>Remote rejection capacity</span><strong>{fmt(result.reactorRadiatorCapacityW,'W',0)}</strong></div>
            <div><span>Required hot radiator area</span><strong>{fmt(result.reactorRadiatorRequiredAreaM2,'m²',2)}</strong></div>
            <div><span>Truss, panels and heat loop mass</span><strong>{fmt(result.reactorCoolingMassKg,'kg',1)}</strong></div>
            <div className={result.reactorThermalMarginW===null?'unknown':result.reactorThermalMarginW<0?'over':'ok'}>
              <span>Reactor heat rejection margin</span><strong>{fmt(result.reactorThermalMarginW,'W',0)}</strong>
            </div>
          </div>}
          <p className="sys-subnote">Hot-surface radiative capacity uses Stefan–Boltzmann emission with simple solar absorption. Assumed emissivity, truss mass, heat-pipe transport, surface temperature and coolant loop are NOT validated reactor engineering. Unknown heat load remains unknown (KRUSTY), not zero.</p>
        </div>}
        <p className="sys-subnote">
          Required and installed radiator area are separate: the <b>installed</b> panels set the spacecraft mass and thermal capacity. Required area comes from Stefan–Boltzmann emission minus direct solar absorption,
          and assumes a 3 K sink, clear view, and no planetary albedo/IR heating.
          Surface <b>absorptivity</b> is reported; emissivity is a separate adjustable assumption. Radiator panel count divides the required total area across surfaces.
          <a href="https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/" target="_blank" rel="noreferrer"> NASA thermal survey ↗</a>
        </p>
      </div>

      <div className={'sys-group '+(activeSystemTab==='tank'?'':'sys-hidden')}>
        <div className="sys-heading"><span>04</span><div><h3>Propellant storage architecture</h3>
          <small>Auto-derived reservoirs based on selected propulsion, pressure and propellant mass</small></div></div>
        <p className="sys-subnote">Liquid monopropellant gets a regulated diaphragm/bellows tank. Xenon receives a dense high-pressure spherical vessel estimate. Iodine uses a heated solid-feed reservoir, not a fictional liquid tank. Dual propulsion adds a separate store even if propellants match.</p>
        <div className="sys-input-grid">
          {isLiquid&&<label className="sys-field">
            <span>Chemical liquid acquisition system<FieldHelp term="Liquid acquisition / tank type"/></span>
            <select value={design.tankType} onChange={e=>change('tankType',e.target.value as SubsystemDesign['tankType'])}>
              <option value="diaphragm">Diaphragm tank</option>
              <option value="bellows">Bellows tank</option>
              <option value="capillary">Surface-tension PMD</option>
            </select>
          </label>}
          {isLiquid&&<NumberField label="Differential tank pressure" unit="bar · monopropellant" value={design.tankPressureBar}
            min={1} max={100} step={1} onChange={n=>change('tankPressureBar',n)}/>}
          {hasXenon&&<NumberField label="Xenon storage pressure" unit="bar · gas/supercritical estimate" value={design.xenonStoragePressureBar}
            min={60} max={350} step={10} onChange={n=>change('xenonStoragePressureBar',n)}/>}
          <NumberField label="Allowable membrane stress" unit="MPa · conceptual input" value={design.tankAllowableStressMpa}
            min={10} max={700} step={10} onChange={n=>change('tankAllowableStressMpa',n)}/>
          <NumberField label="Tank shell material density" unit="kg/m³" value={design.tankMetalDensityKgM3}
            min={1000} max={10000} step={100} onChange={n=>change('tankMetalDensityKgM3',n)}/>
        </div>
        {result&&<div className="sys-tank-grid">
          {result.tankReports.map((t,i)=><article key={i} className="sys-tank-card">
            <div className="sys-chip">{i===0?'PRIMARY TANK':'SECONDARY TANK'} · {t.kind.toUpperCase()}</div>
            <h4>{t.label}</h4>
            <div><span>Propellant inventory</span><strong>{fmt(t.propellantKg,'kg',2)}</strong></div>
            <div><span>Pressure assumption</span><strong>{fmt(t.designPressureBar,'bar',0)}</strong></div>
            <div><span>Storage volume</span><strong>{fmt(t.internalVolumeL,'L',2)}</strong></div>
            <div><span>Membrane Tmin</span><strong>{fmt(t.membraneTminMm,'mm',3)}</strong></div>
            <div><span>Adopted wall / manufacturing floor</span><strong>{fmt(t.adoptedWallMm,'mm',3)}</strong></div>
            <div><span>Shell + fittings allowance</span><strong>{fmt(t.shellMassKg,'kg',2)}</strong></div>
            <div><span>Feed / valves / heater estimate</span><strong>{fmt(t.feedHardwareKg,'kg',2)}</strong></div>
            <div className="total"><span>Installed tank/feed estimate</span><strong>{fmt(t.totalHardwareKg,'kg',2)}</strong></div>
            <p>{t.note}</p>
          </article>)}
        </div>}
        <p className="sys-subnote"><b>Engineering boundary:</b> Conceptual internal-pressure membrane thickness uses t ≈ P·R/(2·S·E − 0.2·P), assumed joint efficiency 0.85, plus application-specific minimum thickness and fittings allowance. It is NOT verified ASME VIII code compliance. Real spacecraft require stress analysis, burst/proof factors, welds, temperature-dependent strength, buckling, fatigue, fluid EOS, leakage and qualification testing.</p>
      </div>

      <div className={activeSystemTab==='analysis'?'':'sys-hidden'}>
      {result ? (
        <>
          <div className="sys-results-heading">
            <h3>Coupled engineering analysis</h3>
            <span>LIVE · IDEALIZED</span>
          </div>
          <div className="sys-result-grid">
            <Result label="Ideal delta-V (partial mass model)" value={fmt(result.idealDeltaVms,'m/s',0)} note="Not a flight-trajectory prediction"/>
            <Result label="Propellant burn at rated thrust" value={fmt(result.idealBurnDays,'days',1)} note="Continuous thrust; no coasting or eclipses"/>
            <Result label="Solar power generated" value={fmt(result.sunlightPowerW,'W',1)} note={fmt(design.distanceAu, 'AU',2)+' from Sun'}/>
            <Result label="Radioisotope / reactor output" value={fmt(result.generatorElectricPowerW,'W',1)} note={result.powerSystemHeritage}/>
            <Result label="Combined generation" value={fmt(result.totalAvailablePowerW,'W',1)} note="Solar + generator"/>
            <Result label="Power source installed mass" value={fmt(result.powerSystemMassKg,'kg',1)} note="Reference generator mass, incomplete for reactors"/>
            <Result label="Separate generator waste heat" value={fmt(result.powerSystemWasteHeatW,'W',0)} note="Fission uses dedicated remote cooling; RTG cooling remains separate"/>
            <Result label="Power requirement (bus + propulsion)" value={fmt(result.totalElectricalDemandW,'W',1)} note={result.canPowerThruster?'Rated operating point supplied':'POWER DEFICIT'} tone={result.canPowerThruster?'good':'bad'}/>
            <Result label="Combined power margin" value={fmt(result.totalPowerMarginW,'W',1)} note="Power generation less bus and thruster loads" tone={result.totalPowerMarginW>=0?'good':'bad'}/>
            <Result label="Battery mass" value={fmt(result.batteryMassKg,'kg',2)} note="Bus eclipse load net of continuous generator output"/>
            <Result label="Internal thermal load" value={fmt(result.thermalLoadW,'W',1)} note="Bus and assumed propulsion heat; separate source heat excluded"/>
            <Result label="Radiator installed / required" value={fmt(result.installedRadiatorAreaM2,'m²',2)+' / '+fmt(result.radiatorAreaM2,'m²',2)}
              note={result.thermalMarginW>=0?'HEAT REJECTION MARGIN':'COOLING DEFICIT'} tone={result.thermalMarginW>=0?'good':'bad'}/>
            <Result label="Radiator thermal capacity" value={fmt(result.radiatorCapacityW,'W',0)}
              note="Installed radiative area × net flux, independent of demand"/>
            <Result label={result.massEstimateIncomplete?'Partial modeled dry mass':'Preliminary dry mass'} value={fmt(result.modeledDryMassKg,'kg',2)} note="PV + battery + thermal + propulsion + tank allowances"/>
            <Result label={result.massEstimateIncomplete?'Partial modeled wet mass':'Preliminary wet mass'} value={fmt(result.modeledWetMassKg,'kg',2)} note="Dry mass + propellant inventory"/>
            <Result label="Installed tanks + feed hardware" value={fmt(result.totalTankHardwareMassKg,'kg',2)} note={result.tankReports.length+' tank architecture(s), conceptual mass'}/>
            <Result label="Primary tank volume / adopted wall" value={fmt(result.tankInternalVolumeL,'L',1)+' / '+fmt(result.tankWallMm,'mm',2)} note={result.primaryMode.feedTank.label}/>
            <Result label="Selected sensor + array hardware" value={fmt(result.instrumentMassKg+result.arrayMassKg,'kg',2)} note={result.instrumentName+' + solar array assembly'}/>
            <Result label="Automatic housekeeping power" value={fmt(result.housekeepingPowerW,'W',0)} note="Avionics + instrument + controllers + wiring losses"/>
          </div>
          <div className="sys-auto-ledger">
            <div className="eyebrow">MASS ROLL-UP · WHAT CHANGES WET WEIGHT?</div>
            {result.massBreakdown.map((item,i)=><div key={i}><span>{item.label}</span>
              <strong>{fmt(item.massKg,'kg',2)}</strong></div>)}
            <div className="total"><span>Installed modeled wet mass</span><strong>{fmt(result.modeledWetMassKg,'kg',2)}</strong></div>
          </div>
          <div className="sys-feedback">
            <strong>Engineering review</strong>
            <ul>
              {result.warnings.map((warning, i)=><li key={i}>{warning}</li>)}
              <li>Solar-array mass (2.5 kg/m²), radiator mass (4 kg/m²), per-wing/per-panel mounts, component and PMD allowances are game engineering assumptions, not NASA hardware data.</li>
              <li>Reported mass does not include all mounting, propulsion feed, wiring, thermal plumbing, redundancy or verification margins. Neither propulsion capability nor power margin alone proves mission feasibility.</li>
            </ul>
          </div>
        </>
      ) : <div className="sys-feedback sys-error">Invalid input: {analysis.error}. Restore physical values to see sizing results.</div>}
      </div>
      <div className="sys-footer">
        <span>Technology tables: NASA 2026 Small Spacecraft SoA · Engineering model: first-order, not certified</span>
        <button className="secondary-button" onClick={()=>onDesignChange(DEFAULT_SUBSYSTEM_DESIGN)}>Reset subsystem design</button>
      </div>
    </section>
  );
}
