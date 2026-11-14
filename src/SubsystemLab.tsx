import { useEffect, useMemo, useState } from 'react';
import Spacecraft3D from './Spacecraft3D';
import {
  BATTERY_PACKS, IN_SPACE_THRUSTERS, SOLAR_CELLS, THERMAL_SURFACES,
} from './lib/spacecraftTechnology';
import { POWER_SYSTEMS, type PowerSourceId } from './lib/powerSources';
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

function readDesign(): SubsystemDesign {
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
      <span>{label}<small>{unit}</small></span>
      <input
        type="number"
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

export default function SubsystemLab() {
  const [design, setDesign] = useState<SubsystemDesign>(readDesign);
  const [activeSystemTab,setActiveSystemTab] = useState<'propulsion'|'power'|'thermal'|'tank'|'analysis'>('propulsion');
  const analysis = useMemo(() => {
    try { return { result: sizeSubsystemDesign(design), error: '' }; }
    catch (error) {
      return { result: null as SystemResults | null, error: error instanceof Error ? error.message : 'Invalid inputs' };
    }
  }, [design]);
  const result = analysis.result;

  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(design)); } catch { /* browser storage disabled */ }
  }, [design]);

  function change<K extends keyof SubsystemDesign>(key: K, value: SubsystemDesign[K]) {
    setDesign(previous => ({ ...previous, [key]: value }));
  }

  const isLiquid = design.thrusterId === 'mono-reference';
  const selectedElectric = IN_SPACE_THRUSTERS.find(t => t.id === design.thrusterId);
  const isIodine = design.thrusterId === 'busek-bit3';
  const storage = isLiquid ? 'Illustrative liquid monopropellant'
    : isIodine ? 'Iodine solid-feed (not liquid)'
    : 'High-pressure xenon (not liquid)';

  return (
    <section className="panel sys-panel" id="systems-lab" aria-label="In-space spacecraft systems engineering lab">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">02 / NASA TECHNOLOGY LAB</div>
          <h2>Spacecraft Subsystems</h2>
          <p>Design an in-space spacecraft bus. Changing propulsion affects power, thermal control, mass and propellant.</p>
        </div>
        <span className="sys-model-label">BETA · PRELIMINARY</span>
      </div>
      <p className="sys-intro">
        This is separate from the launch rocket above. Real published component examples are used where available;
        everything labeled <b>assumption</b> is an illustrative sizing input, not a NASA-certified design.
      </p>

      <Spacecraft3D design={design} analysis={result}/>

      <div className="sys-tab-strip" role="tablist" aria-label="Spacecraft subsystem">
        {([
          ['propulsion','Propulsion'], ['power','Power'], ['thermal','Thermal'],
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
            <span>In-space engine / technology<small>SELECT COMPONENT</small></span>
            <select value={design.thrusterId} onChange={e => change('thrusterId', e.target.value as SubsystemDesign['thrusterId'])}>
              <option value="mono-reference">Chemical monopropellant · illustrative 1 N / 230 s</option>
              {IN_SPACE_THRUSTERS.map(t => <option key={t.id} value={t.id}>{t.name} · {t.nominalSpecificImpulseSeconds} s</option>)}
            </select>
          </label>
          <NumberField label="Propellant inventory" unit="kg" value={design.propellantMassKg} min={0.1} max={300} step={0.5} onChange={n=>change('propellantMassKg', n)}/>
          <NumberField label="Spacecraft bus (other dry hardware)" unit="kg · assumption" value={design.busDryMassKg} min={1} max={2000} step={5} onChange={n=>change('busDryMassKg',n)}/>
          <NumberField label="Science / cargo payload" unit="kg" value={design.payloadMassKg} min={0} max={1000} step={5} onChange={n=>change('payloadMassKg',n)}/>
        </div>
        <p className="sys-subnote">
          {selectedElectric
            ? `NASA-surveyed operating point: ${fmt(selectedElectric.nominalThrustN * 1000, 'mN', 2)} thrust · ${fmt(selectedElectric.nominalSpecificImpulseSeconds, 's', 0)} Isp · ${fmt(selectedElectric.nominalThrusterPowerW, 'W', 0)} rated thruster input. This is not full propulsion-system power or mass.`
            : 'Chemical baseline 1 N, 230 s, 8 W for valves (assumptions within NASA-surveyed monopropellant performance ranges).'}
          {' '}<a href="https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/" target="_blank" rel="noreferrer">NASA propulsion survey ↗</a>
        </p>
      </div>

      <div className={'sys-group '+(activeSystemTab==='power'?'':'sys-hidden')}>
        <div className="sys-heading"><span>02</span><div><h3>Electrical power</h3><small>Solar generation → power processing → propulsion</small></div></div>
        <div className="sys-input-grid">
          <label className="sys-field sys-wide">
            <span>Primary power generation<small>NASA HERITAGE / RESEARCH</small></span>
            <select value={design.powerSourceId} onChange={e=>change('powerSourceId',e.target.value as PowerSourceId)}>
              {Object.values(POWER_SYSTEMS).map(system=><option key={system.id} value={system.id}>{system.name} · {system.heritage}</option>)}
            </select>
          </label>
          {design.powerSourceId !== 'solar' && <>
            <NumberField label="Number of power units" unit="systems" value={design.powerSourceCount} min={1} max={8} step={1} onChange={n=>change('powerSourceCount',n)}/>
            <NumberField label="Mission age for degradation" unit="years" value={design.missionYears} min={0} max={40} step={1} onChange={n=>change('missionYears',n)}/>
          </>}
          <label className="sys-field">
            <span>Solar cell type<small>NASA-SURVEYED</small></span>
            <select value={design.solarCellId} onChange={e=>change('solarCellId',e.target.value)}>
              {SOLAR_CELLS.map(cell=><option key={cell.id} value={cell.id}>{cell.name} ({fmt(cell.efficiencyBOL*100,'%',1)} BOL)</option>)}
            </select>
          </label>
          <label className="sys-field">
            <span>Mission solar distance<small>APPROXIMATE REGION</small></span>
            <select value={design.distanceAu} onChange={e=>change('distanceAu',Number(e.target.value))}>
              {DESTINATIONS.map(d=><option key={d.name} value={d.distanceAu}>{d.name} ({d.distanceAu} AU)</option>)}
            </select>
          </label>
          <NumberField label="Active solar cell area" unit="m²" value={design.cellAreaM2} min={0} max={250} step={0.5} onChange={n=>change('cellAreaM2',n)}/>
          <NumberField label="Housekeeping / instruments draw" unit="W" value={design.busElectricalPowerW} min={0} max={5000} step={10} onChange={n=>change('busElectricalPowerW',n)}/>
          <label className="sys-field">
            <span>Battery pack technology<small>NASA-SURVEYED</small></span>
            <select value={design.batteryPackId} onChange={e=>change('batteryPackId',e.target.value)}>
              {BATTERY_PACKS.map(b=><option key={b.id} value={b.id}>{b.name} · {b.specificEnergyWhKg} Wh/kg</option>)}
            </select>
          </label>
          <NumberField label="Eclipse / no-solar duration" unit="hours · assumption" value={design.eclipseHours} min={0} max={30} step={0.1} onChange={n=>change('eclipseHours',n)}/>
        </div>
        <p className="sys-subnote">
          Selected radioisotope or fission hardware operates alongside solar panels, with published reference mass included when available. Solar model uses measured 1 AU irradiance, cell efficiency and inverse-square solar distance;
          a 75% overall array derate and 88% thruster power-processing efficiency are <b>assumptions</b>.
          Battery reserve assumes 80% usable capacity and 90% discharge efficiency. Published generator masses exclude mission-specific mounting, and reactor integrations need independent thermal and safety analyses.
          {' '}{design.powerSourceId !== 'solar' && <a href={POWER_SYSTEMS[design.powerSourceId].sourceUrl} target="_blank" rel="noreferrer">Selected NASA power source ↗</a>}
          <a href="https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/" target="_blank" rel="noreferrer"> NASA power survey ↗</a>
        </p>
      </div>

      <div className={'sys-group '+(activeSystemTab==='thermal'?'':'sys-hidden')}>
        <div className="sys-heading"><span>03</span><div><h3>Thermal management</h3><small>Electrical heat generation and radiator solar loading</small></div></div>
        <div className="sys-input-grid">
          <label className="sys-field">
            <span>Radiator surface treatment<small>NASA-SURVEYED α</small></span>
            <select value={design.coatingId} onChange={e=>change('coatingId',e.target.value)}>
              {THERMAL_SURFACES.map(t=><option key={t.id} value={t.id}>{t.name} · α={t.solarAbsorptivityBOL}</option>)}
            </select>
          </label>
          <NumberField label="IR emissivity (ε)" unit="assumption · 0–1" value={design.infraredEmissivity} min={0.1} max={1} step={0.05} onChange={n=>change('infraredEmissivity',n)}/>
          <NumberField label="Radiator operating temperature" unit="K · assumption" value={design.radiatorTemperatureK} min={180} max={420} step={5} onChange={n=>change('radiatorTemperatureK',n)}/>
          <NumberField label="Radiator sun incidence factor" unit="assumption · 0–1" value={design.radiatorSunIncidence} min={0} max={1} step={0.05} onChange={n=>change('radiatorSunIncidence',n)}/>
        </div>
        <p className="sys-subnote">
          Radiator sizing uses Stefan–Boltzmann emission minus direct solar absorption,
          and assumes a 3 K sink, clear view, and no planetary albedo/IR heating.
          Surface <b>absorptivity</b> is reported; emissivity is a separate adjustable assumption.
          <a href="https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/" target="_blank" rel="noreferrer"> NASA thermal survey ↗</a>
        </p>
      </div>

      <div className={'sys-group '+(activeSystemTab==='tank'?'':'sys-hidden')}>
        <div className="sys-heading"><span>04</span><div><h3>Tank & propellant management</h3><small>Propellant mass, shell mass, volume and liquid acquisition</small></div></div>
        <p className="sys-storage"><b>Propellant storage class:</b> {storage}</p>
        {isLiquid ? (
          <>
            <div className="sys-input-grid">
              <label className="sys-field">
                <span>Liquid acquisition / tank type<small>ILLUSTRATIVE MASS ALLOWANCE</small></span>
                <select value={design.tankType} onChange={e=>change('tankType',e.target.value as SubsystemDesign['tankType'])}>
                  <option value="diaphragm">Diaphragm tank · +1 kg</option>
                  <option value="bellows">Bellows tank · +1.5 kg</option>
                  <option value="capillary">Surface-tension PMD · +0.5 kg</option>
                </select>
              </label>
              <NumberField label="Assumed liquid density" unit="kg/m³" value={design.liquidDensityKgM3} min={300} max={2000} step={25} onChange={n=>change('liquidDensityKgM3',n)}/>
              <NumberField label="Differential tank pressure" unit="bar" value={design.tankPressureBar} min={1} max={100} step={1} onChange={n=>change('tankPressureBar',n)}/>
              <NumberField label="Allowable membrane stress" unit="MPa" value={design.tankAllowableStressMpa} min={10} max={700} step={10} onChange={n=>change('tankAllowableStressMpa',n)}/>
              <NumberField label="Tank shell material density" unit="kg/m³" value={design.tankMetalDensityKgM3} min={1000} max={10000} step={100} onChange={n=>change('tankMetalDensityKgM3',n)}/>
            </div>
            <p className="sys-subnote">Ideal thin spherical shell with assumed 5% ullage. This is a <b>lower-bound mass estimate</b>, not a tank design-code calculation. Diaphragms, bellows or capillary PMDs help avoid ingesting gas in microgravity; actual pump/valve/pressurant compatibility and slosh dynamics remain unmodeled.</p>
          </>
        ) : (
          <p className="sys-subnote">
            {isIodine
              ? 'The BIT-3 uses iodine. Its published 2.9 kg reported mass is integrated WET mass; it is not added as a dry component or sized with a liquid-density model.'
              : 'Xenon is stored under pressure, and cannot be correctly sized using the incompressible-liquid spherical tank formula. Pressure-vessel mass, feed/pressurant and regulator masses are explicitly NOT included in the estimate below.'}
            {' '}<a href="https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/" target="_blank" rel="noreferrer">NASA propulsion and PMD background ↗</a>
          </p>
        )}
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
            <Result label="Separate generator waste heat" value={fmt(result.powerSystemWasteHeatW,'W',0)} note="Not added to bus radiator; dedicated rejection unresolved"/>
            <Result label="Power requirement (bus + propulsion)" value={fmt(result.totalElectricalDemandW,'W',1)} note={result.canPowerThruster?'Rated operating point supplied':'POWER DEFICIT'} tone={result.canPowerThruster?'good':'bad'}/>
            <Result label="Combined power margin" value={fmt(result.totalPowerMarginW,'W',1)} note="Power generation less bus and thruster loads" tone={result.totalPowerMarginW>=0?'good':'bad'}/>
            <Result label="Battery mass" value={fmt(result.batteryMassKg,'kg',2)} note="Bus eclipse load net of continuous generator output"/>
            <Result label="Internal thermal load" value={fmt(result.thermalLoadW,'W',1)} note="Bus and assumed propulsion heat; separate source heat excluded"/>
            <Result label="Required radiator area" value={fmt(result.radiatorAreaM2,'m²',2)} note="Net radiative heat rejection" tone={result.radiatorAreaM2===null?'bad':undefined}/>
            <Result label={result.massEstimateIncomplete?'Partial modeled dry mass':'Preliminary dry mass'} value={fmt(result.modeledDryMassKg,'kg',2)} note="PV + battery + thermal + propulsion + tank allowances"/>
            <Result label={result.massEstimateIncomplete?'Partial modeled wet mass':'Preliminary wet mass'} value={fmt(result.modeledWetMassKg,'kg',2)} note="Dry mass + propellant inventory"/>
            <Result label="Tank shell mass" value={fmt(result.tankShellMassKg,'kg',2)} note={isLiquid?'Ideal thin-wall + PMD allowance separately':'Not modeled for gas/solid storage'} tone={!isLiquid?'warn':undefined}/>
            <Result label="Tank volume / wall" value={isLiquid ? fmt(result.tankInternalVolumeL,'L',1)+' / '+fmt(result.tankWallMm,'mm',2) : 'Not sized'} note={isLiquid?'Shell geometry only':'Different storage physics required'}/>
          </div>
          <div className="sys-feedback">
            <strong>Engineering review</strong>
            <ul>
              {result.warnings.map((warning, i)=><li key={i}>{warning}</li>)}
              <li>Solar-array mass (2.5 kg/m²), radiator mass (4 kg/m²), component and PMD allowances are game engineering assumptions, not NASA hardware data.</li>
              <li>Reported mass does not include all mounting, propulsion feed, wiring, thermal plumbing, redundancy or verification margins. Neither propulsion capability nor power margin alone proves mission feasibility.</li>
            </ul>
          </div>
        </>
      ) : <div className="sys-feedback sys-error">Invalid input: {analysis.error}. Restore physical values to see sizing results.</div>}
      </div>
      <div className="sys-footer">
        <span>Technology tables: NASA 2026 Small Spacecraft SoA · Engineering model: first-order, not certified</span>
        <button className="secondary-button" onClick={()=>setDesign(DEFAULT_SUBSYSTEM_DESIGN)}>Reset subsystem design</button>
      </div>
    </section>
  );
}
