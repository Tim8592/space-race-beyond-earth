/**
 * NASA mission heritage references for engineering comparisons.
 *
 * These are *historical spacecraft descriptions*, not mission requirements.
 * Propulsion and power options remain open to all physically capable designs.
 * See source URLs for original NASA descriptions and usage guidelines.
 */
export type HeritageMission = {
  id: 'dawn' | 'psyche' | 'new-horizons' | 'voyager';
  name: string;
  archetype: string;
  status: string;
  destinations: string;
  missionMode: 'orbiter' | 'flyby';
  propulsion: string;
  primaryPower: string;
  wetMassKg: number | null;
  dryMassKg: number | null;
  propellantKg: number | null;
  electricOutput: string;
  payload: string;
  highlights: string;
  dimensions: string;
  missionUrl: string;
  spacecraftUrl: string;
  modelUrl?: string;
  modelDownloadUrl?: string;
  imageUrl?: string;
  credit: string;
};

export const HERITAGE_MISSIONS: readonly HeritageMission[] = [
  {
    id: 'dawn',
    name: 'Dawn',
    archetype: 'Multi-destination asteroid orbiter',
    status: 'Completed, 2018',
    destinations: '4 Vesta and 1 Ceres',
    missionMode: 'orbiter',
    propulsion: '3 xenon gridded-ion engines, 19–91 mN; hydrazine attitude-control system',
    primaryPower: 'Two large photovoltaic wings + nickel-hydrogen battery',
    wetMassKg: 1218,
    dryMassKg: 747,
    propellantKg: 425,
    electricOutput: '>10 kW at 1 AU; ~1.4 kW at Ceres',
    payload: 'Framing camera, visible/infrared mapping spectrometer, gamma-ray and neutron detector',
    highlights: 'Orbited Vesta and then Ceres using long-duration ion thrust. The 1,218 kg launch mass also included roughly 45.6 kg hydrazine, separate from the 425 kg xenon.',
    dimensions: 'Bus approx. 1.64 × 1.27 × 1.77 m; 19.7 m solar wingspan',
    missionUrl: 'https://science.nasa.gov/mission/dawn/',
    spacecraftUrl: 'https://science.nasa.gov/mission/dawn/technology/spacecraft/',
    modelUrl: 'https://science.nasa.gov/3d-resources/dawn/',
    modelDownloadUrl: 'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/dawn/Dawn.glb',
    imageUrl: 'https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/model/dawn/Dawn.png?crop=faces%2Cfocalpoint&fit=clip&h=720&w=1280',
    credit: 'NASA / Brian E. Kumanchik (3D model); NASA/JPL (mission statistics)',
  },
  {
    id: 'psyche',
    name: 'Psyche',
    archetype: 'Metal-rich asteroid orbiter',
    status: 'En route (2026); arrival planned 2029',
    destinations: '16 Psyche asteroid',
    missionMode: 'orbiter',
    propulsion: 'Four xenon Hall-effect thrusters (one fires at a time, up to 240 mN); nitrogen cold-gas attitude control',
    primaryPower: 'Twin five-panel photovoltaic arrays',
    wetMassKg: 2747,
    dryMassKg: 1616,
    propellantKg: 1085,
    electricOutput: '21 kW near Earth; 2.3–3.4 kW near target',
    payload: 'Multispectral imager, gamma-ray/neutron spectrometer, magnetometer, gravity science; DSOC technology demonstration',
    highlights: 'Solar-electric Hall propulsion, large cross-shaped solar arrays and a high-gain antenna. Published dry mass excludes propellant, while wet launch mass includes instruments and DSOC.',
    dimensions: 'Bus ~4.9 m tall with booms; total deployed span ~25 × 7.3 m',
    imageUrl: 'https://d2pn8kiwq2w21t.cloudfront.net/images/Psyche_Mission_-_Spacecraft_H.2e16d0ba.fill-1800x775-c10.jpg',
    missionUrl: 'https://science.nasa.gov/mission/psyche/',
    spacecraftUrl: 'https://science.nasa.gov/mission/psyche/spacecraft/',
    credit: 'NASA / JPL-Caltech (spacecraft specs and photography)',
  },
  {
    id: 'new-horizons',
    name: 'New Horizons',
    archetype: 'Pluto flyby and Kuiper Belt explorer',
    status: 'Pluto encounter 2015; extended mission',
    destinations: 'Pluto, Charon, Arrokoth',
    missionMode: 'flyby',
    propulsion: 'Chemical launch energy + Jupiter gravity assist; hydrazine trajectory-correction and attitude-control thrusters (no electric main propulsion)',
    primaryPower: 'One radioisotope thermoelectric generator (RTG)',
    wetMassKg: 478,
    dryMassKg: null,
    propellantKg: null,
    electricOutput: 'About 250 W at launch, ~200 W by Pluto encounter',
    payload: '7 scientific instruments: Ralph, Alice, REX, LORRI, SWAP, PEPSSI, student dust counter',
    highlights: 'High-speed flyby, not an orbiter. Reached Pluto using powerful chemical launch stages and a Jupiter gravity assist, not an ion thruster.',
    dimensions: 'Approx. grand-piano-sized spacecraft bus',
    missionUrl: 'https://science.nasa.gov/mission/new-horizons/',
    spacecraftUrl: 'https://science.nasa.gov/mission/new-horizons/',
    modelUrl: 'https://science.nasa.gov/resource/new-horizons-3d-model/',
    credit: 'NASA / Johns Hopkins APL; NASA Visualization Technology Applications and Development 3D model',
  },
  {
    id: 'voyager',
    name: 'Voyager 1 / Voyager 2',
    archetype: 'Outer-planet flyby and interstellar science',
    status: 'Launched 1977; extended mission',
    destinations: 'Jupiter, Saturn; Voyager 2 also Uranus and Neptune',
    missionMode: 'flyby',
    propulsion: 'Launch-energy/gravity-assist trajectory, hydrazine attitude control and trajectory corrections',
    primaryPower: 'Three MHW radioisotope thermoelectric generators per spacecraft',
    wetMassKg: null,
    dryMassKg: null,
    propellantKg: null,
    electricOutput: 'RTG electric power declining with age',
    payload: 'Imaging, spectroscopy, magnetometry, charged particle and plasma instruments',
    highlights: 'Gravity-assist trajectory is central; no electric main propulsion. Payload and full system statistics vary by Voyager 1 / Voyager 2 and should be verified before numerical use.',
    dimensions: 'Large high-gain dish with instrument platform, booms and RTGs',
    missionUrl: 'https://science.nasa.gov/mission/voyager/',
    spacecraftUrl: 'https://science.nasa.gov/mission/voyager/',
    modelUrl: 'https://science.nasa.gov/resource/voyager-3d-model/',
    credit: 'NASA/JPL; NASA Visualization Technology Applications and Development 3D model',
  },
];

export function getHeritageMission(id: HeritageMission['id']): HeritageMission {
  const mission = HERITAGE_MISSIONS.find(m => m.id === id);
  if (!mission) throw new Error('Unknown heritage mission: ' + id);
  return mission;
}
