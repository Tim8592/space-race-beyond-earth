/**
 * Public historical NASA power-system benchmarks.
 * Heritage hardware does NOT establish availability for procurement or launch.
 * Device-level published masses are not guaranteed complete integrated spacecraft
 * installation masses. Reactor shielding / separation / heat rejection are mission
 * dependent and not fully sized here.
 */
export type PowerSourceId = 'solar' | 'mmrtg' | 'gphs-rtg' | 'snap10a' | 'krusty';
export type PowerSystem = {
  id: PowerSourceId;
  name: string;
  class: 'photovoltaic' | 'radioisotope' | 'fission';
  heritage: 'flight-proven' | 'flight-demonstrated' | 'ground-demonstrated';
  nominalElectricW: number;
  reportedSystemMassKg: number | null;
  reportedThermalW: number | null;
  degradationPerYear: number | null;
  sourceUrl: string;
  note: string;
};

export const POWER_SYSTEMS: Record<PowerSourceId, PowerSystem> = {
  solar: {
    id: 'solar',
    name: 'Solar photovoltaic only',
    class: 'photovoltaic',
    heritage: 'flight-proven',
    nominalElectricW: 0,
    reportedSystemMassKg: 0,
    reportedThermalW: 0,
    degradationPerYear: null,
    sourceUrl: 'https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/',
    note: 'Solar output and assumed array mass are calculated separately from selected solar-cell area and heliocentric distance.',
  },
  mmrtg: {
    id: 'mmrtg',
    name: 'MMRTG (Perseverance heritage)',
    class: 'radioisotope',
    heritage: 'flight-proven',
    nominalElectricW: 110,
    reportedSystemMassKg: 45,
    reportedThermalW: 1880,
    degradationPerYear: 0.03, // Illustrative decline, NASA says a few percent per year
    sourceUrl: 'https://ntrs.nasa.gov/api/citations/20170000017/downloads/20170000017.pdf',
    note: '110 W and ~45 kg at launch; ~1880 W thermal. Power decline modeled at an illustrative 3%/year, NOT a certified EOL guarantee.',
  },
  'gphs-rtg': {
    id: 'gphs-rtg',
    name: 'GPHS-RTG (New Horizons heritage)',
    class: 'radioisotope',
    heritage: 'flight-proven',
    nominalElectricW: 285,
    reportedSystemMassKg: 56,
    reportedThermalW: 4500, // Nominal 18 GPHS modules, 250 Wth each BOL
    degradationPerYear: 0.016,
    sourceUrl: 'https://ntrs.nasa.gov/api/citations/20160001769/downloads/20160001769.pdf',
    note: 'NASA technical report gives 285 W beginning-of-mission, 56 kg variant, 1.6%/yr degradation; thermal derived from 18×250 Wth GPHS nominal heat inventory.',
  },
  snap10a: {
    id: 'snap10a',
    name: 'SNAP-10A (1965 reactor)',
    class: 'fission',
    heritage: 'flight-demonstrated',
    nominalElectricW: 500,
    reportedSystemMassKg: 238.1, // 525 lb historical estimate; unshielded only
    reportedThermalW: 40000,
    degradationPerYear: null,
    sourceUrl: 'https://ntrs.nasa.gov/api/citations/19650058959/downloads/19650058959.pdf',
    note: '500 W and 43 days flight demonstration; ~238 kg is a historical UNshielded system estimate. 40 kW thermal from heritage technical literature. Additional shields, standoffs, integration and radiator checks are unmodeled.',
  },
  krusty: {
    id: 'krusty',
    name: 'Kilopower / KRUSTY (research prototype)',
    class: 'fission',
    heritage: 'ground-demonstrated',
    nominalElectricW: 1000,
    reportedSystemMassKg: null,
    reportedThermalW: null,
    degradationPerYear: null,
    sourceUrl: 'https://ntrs.nasa.gov/citations/20180007748',
    note: '2018 nuclear ground demonstration, NOT a flown reactor. 1 kW is a class-level research demonstrator, not a complete flight power system. Mass, heat rejection, shielding and lifetime remain unspecified.',
  },
};

export type PowerOutput = {
  generatedElectricW: number;
  installedGeneratorMassKg: number | null;
  generatorWasteHeatW: number | null;
  heritage: PowerSystem['heritage'];
  provenance: string;
};

/** Includes historical system masses where published; excludes reactor integration. */
export function getPowerOutput(id: PowerSourceId, count: number, missionYears: number): PowerOutput {
  const system = POWER_SYSTEMS[id];
  if (!system || !Number.isInteger(count) || count < 0 || count > 8 ||
      !Number.isFinite(missionYears) || missionYears < 0 || missionYears > 40) {
    throw new RangeError('Invalid power system selection, count, or mission age');
  }
  const degradation = system.degradationPerYear === null
    ? 1 : (1 - system.degradationPerYear) ** missionYears;
  const generatedElectricW = system.nominalElectricW * count * degradation;
  const installedGeneratorMassKg = system.reportedSystemMassKg === null
    ? null : system.reportedSystemMassKg * count;
  const generatorWasteHeatW = system.reportedThermalW === null
    ? null : Math.max(0, system.reportedThermalW * count - generatedElectricW);
  return {
    generatedElectricW,
    installedGeneratorMassKg,
    generatorWasteHeatW,
    heritage: system.heritage,
    provenance: system.note,
  };
}
