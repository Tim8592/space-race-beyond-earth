/**
 * NASA-surveyed, publicly reported example technology specifications.
 *
 * Source: NASA 2026 Small Spacecraft Technology SoA (public survey
 * of manufacturer data, NOT NASA certification or procurement guidance).
 * Values are reference operating points, not necessarily full throttle envelopes.
 * Never infer a full propulsion-system dry mass from a thruster-head mass,
 * or full array mass from solar cell efficiency.
 */

export type SourceReference = {
  title: string;
  url: string;
  table?: string;
  provenance: 'nasa-measurement' | 'nasa-survey-of-manufacturer-data' | 'nasa-reference';
};

export const SOURCES = {
  propulsion: {
    title: 'NASA 2026 Small Spacecraft SoA — In-Space Propulsion',
    url: 'https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion/',
    table: 'Tables 4-9 and 4-10',
    provenance: 'nasa-survey-of-manufacturer-data',
  },
  power: {
    title: 'NASA 2026 Small Spacecraft SoA — Power',
    url: 'https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/',
    table: 'Tables 3-1 and 3-5',
    provenance: 'nasa-survey-of-manufacturer-data',
  },
  thermal: {
    title: 'NASA 2026 Small Spacecraft SoA — Thermal Control',
    url: 'https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/',
    table: 'Table 7-4',
    provenance: 'nasa-survey-of-manufacturer-data',
  },
  structures: {
    title: 'NASA 2026 Small Spacecraft SoA — Structures and Mechanisms',
    url: 'https://www.nasa.gov/smallsat-institute/sst-soa/structures-materials-and-mechanisms/',
    table: 'Table 6-1',
    provenance: 'nasa-reference',
  },
  gnc: {
    title: 'NASA 2026 Small Spacecraft SoA — Guidance, Navigation and Control',
    url: 'https://www.nasa.gov/smallsat-institute/sst-soa/guidance-navigation-and-control/',
    table: 'Table 5-2',
    provenance: 'nasa-survey-of-manufacturer-data',
  },
  irradiance: {
    title: 'NASA GSFC — Solar Irradiance Science (TSIS-1 solar minimum)',
    url: 'https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science',
    provenance: 'nasa-measurement',
  },
} as const satisfies Record<string, SourceReference>;

export const SOLAR_IRRADIANCE_1AU_WM2 = 1361.6;

export type PropulsionTechnology = {
  id: string;
  name: string;
  family: 'hall' | 'gridded-ion';
  propellant: string;
  nominalThrustN: number;
  nominalSpecificImpulseSeconds: number;
  nominalThrusterPowerW: number;
  reportedMassKg?: number;
  massScope?: 'thruster-only' | 'integrated-wet';
  source: SourceReference;
  note: string;
};

export const IN_SPACE_THRUSTERS: readonly PropulsionTechnology[] = [
  {
    id: 'busek-bht100',
    name: 'Busek BHT-100',
    family: 'hall',
    propellant: 'Xenon',
    nominalThrustN: 0.0063,
    nominalSpecificImpulseSeconds: 1086,
    nominalThrusterPowerW: 105,
    reportedMassKg: 1.2,
    massScope: 'thruster-only',
    source: SOURCES.propulsion,
    note: 'NASA Table 4-10 nominal point. Reported mass excludes full feed/storage/PPU system.',
  },
  {
    id: 'busek-bht200',
    name: 'Busek BHT-200',
    family: 'hall',
    propellant: 'Xenon',
    nominalThrustN: 0.013,
    nominalSpecificImpulseSeconds: 1390,
    nominalThrusterPowerW: 250,
    reportedMassKg: 1.2,
    massScope: 'thruster-only',
    source: SOURCES.propulsion,
    note: 'NASA Table 4-10 nominal point. 250 W thruster input is not the complete bus electrical demand.',
  },
  {
    id: 'busek-bit3',
    name: 'Busek BIT-3',
    family: 'gridded-ion',
    propellant: 'Iodine',
    nominalThrustN: 0.001,
    nominalSpecificImpulseSeconds: 1960,
    nominalThrusterPowerW: 70,
    reportedMassKg: 2.9,
    massScope: 'integrated-wet',
    source: SOURCES.propulsion,
    note: 'NASA Table 4-9 integrated system reported as wet mass; avoid adding it as dry mass.',
  },
  {
    id: 'nstar',
    name: 'NSTAR (Dawn / Deep Space 1)',
    family: 'gridded-ion',
    propellant: 'Xenon',
    nominalThrustN: 0.091,
    nominalSpecificImpulseSeconds: 3120,
    nominalThrusterPowerW: 2300,
    source: {
      title: 'NASA / JPL — NSTAR versus NEXT full-power performance',
      url: 'https://science.nasa.gov/mission/dawn/technology/ion-propulsion/',
      provenance: 'nasa-reference',
    },
    note: 'Near full-power reference: ~91 mN, 2.3 kW, 3120 s. No dry feed/PPU/tank mass inferred.',
  },
  {
    id: 'next-c',
    name: 'NEXT-C (DART heritage)',
    family: 'gridded-ion',
    propellant: 'Xenon',
    nominalThrustN: 0.235,
    nominalSpecificImpulseSeconds: 4155,
    nominalThrusterPowerW: 7330,
    reportedMassKg: 14,
    massScope: 'thruster-only',
    source: {
      title: 'NASA NEXT-C Flight Ion System Status, Table: Thruster Performance',
      url: 'https://ntrs.nasa.gov/api/citations/20205005694/downloads/AIAA_NEXT-C_Flight_Ion_System_Status_Aug2020_8_04_2020.pdf',
      provenance: 'nasa-reference',
    },
    note: 'Published 7.33 kW PPU input operating point: 235 mN, 4155 s; <14 kg thruster only. Total xenon storage/feed and PPU integration additional.',
  },
  {
    id: 't6',
    name: 'QinetiQ T6 (BepiColombo)',
    family: 'gridded-ion',
    propellant: 'Xenon',
    nominalThrustN: 0.143,
    nominalSpecificImpulseSeconds: 4120,
    nominalThrusterPowerW: 5000,
    source: {
      title: 'NASA NTRS — Performance Evaluation of the T6 Ion Engine',
      url: 'https://ntrs.nasa.gov/citations/20150008918',
      provenance: 'nasa-reference',
    },
    note: '143 mN, 4120 s demonstrated at high power; 5 kW is an approximate full-power planning allocation, not a measured matched point in this source.',
  },
  {
    id: 'spt-140',
    name: 'SPT-140 Hall thruster',
    family: 'hall',
    propellant: 'Xenon',
    nominalThrustN: 0.281,
    nominalSpecificImpulseSeconds: 1820,
    nominalThrusterPowerW: 4500,
    source: {
      title: 'NASA NTRS — SPT-140 Hall thruster electrical characterization',
      url: 'https://ntrs.nasa.gov/api/citations/20170003033/downloads/20170003033.pdf',
      provenance: 'nasa-reference',
    },
    note: 'Nominal 4.5 kW class, ~281 mN, ~1820 s from a ground-tested operating point. Power electronics, storage and feed excluded.',
  },

];

export type SolarCellTechnology = {
  id: string;
  name: string;
  efficiencyBOL: number;
  quotedPeakPowerDensityWM2: number;
  source: SourceReference;
};

export const SOLAR_CELLS: readonly SolarCellTechnology[] = [
  { id: 'azur-3g30', name: 'AZUR Space 3G30-Adv', efficiencyBOL: 0.295, quotedPeakPowerDensityWM2: 403, source: SOURCES.power },
  { id: 'azur-4g32', name: 'AZUR Space 4G32-Adv', efficiencyBOL: 0.315, quotedPeakPowerDensityWM2: 431, source: SOURCES.power },
  { id: 'rocketlab-ztj', name: 'Rocket Lab ZTJ', efficiencyBOL: 0.295, quotedPeakPowerDensityWM2: 397.7, source: SOURCES.power },
  { id: 'rocketlab-imma', name: 'Rocket Lab IMMα', efficiencyBOL: 0.32, quotedPeakPowerDensityWM2: 433.1, source: SOURCES.power },
];

export type BatteryPackTechnology = {
  id: string;
  name: string;
  specificEnergyWhKg: number;
  source: SourceReference;
};

export const BATTERY_PACKS: readonly BatteryPackTechnology[] = [
  { id: 'aac-optimus', name: 'AAC Clyde Space Optimus', specificEnergyWhKg: 119.4, source: SOURCES.power },
  { id: 'astro-direct', name: 'Astro Digital Direct Energy Pack', specificEnergyWhKg: 144, source: SOURCES.power },
  { id: 'eaglepicher-npd', name: 'EaglePicher NPD-002271', specificEnergyWhKg: 153.5, source: SOURCES.power },
];

export type ThermalSurface = {
  id: string;
  name: string;
  solarAbsorptivityBOL: number;
  source: SourceReference;
  note: string;
};

export const THERMAL_SURFACES: readonly ThermalSurface[] = [
  {
    id: 'gsfc-silver',
    name: 'NASA GSFC Silver Composite Coating / 200HN Kapton',
    solarAbsorptivityBOL: 0.1,
    source: SOURCES.thermal,
    note: 'Only solar absorptivity provided here. IR emissivity is a separate user-defined parameter.',
  },
  {
    id: 'fep-silver-inconel',
    name: 'FEP/Ag/Inconel film, 0.005 in',
    solarAbsorptivityBOL: 0.07,
    source: SOURCES.thermal,
    note: 'Only solar absorptivity provided here. Coating temperature and emissivity matter.',
  },
];

export type StructureReference = {
  id: string;
  name: string;
  dimensionsMm: readonly [number, number, number];
  reportedStructureMassKg: number | readonly [number, number];
  source: SourceReference;
};

export const CUBESAT_STRUCTURES: readonly StructureReference[] = [
  { id: '1u', name: '1U chassis', dimensionsMm: [100, 100, 113.5], reportedStructureMassKg: 0.118, source: SOURCES.structures },
  { id: '3u', name: '3U chassis', dimensionsMm: [100, 100, 340.5], reportedStructureMassKg: 0.352, source: SOURCES.structures },
  { id: '6u', name: '6U chassis', dimensionsMm: [100, 226.3, 366], reportedStructureMassKg: [0.916, 1.94], source: SOURCES.structures },
];

export const GNC_EXAMPLE = {
  id: 'xact15',
  name: 'Blue Canyon Technologies XACT-15 integrated ADCS',
  reportedMassKg: 0.885,
  source: SOURCES.gnc,
  note: 'Manufacturer-reported integrated ADCS mass; pointing performance depends on configuration and mission.',
} as const;
