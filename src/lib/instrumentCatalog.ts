/**
 * Fictional instrument choices for educational missions, inspired by categories
 * of NASA sensors. None of the engineering numbers below are actual flight
 * camera / radar / spectrometer specifications.
 */
export const SCIENCE_INSTRUMENTS = {
  compact: {
    id:'compact', name:'Compact Earth imager', category:'earth' as const,
    massKg:8, powerW:45, standbyW:3, dataMbps:0.025, sciencePerHour:1.2, costUsd:3_000_000,
    description:'Visible-light imaging for broad weather and surface observation.',
    reference:'https://earthobservatory.nasa.gov/',
  },
  multispectral: {
    id:'multispectral',name:'Multispectral Earth camera',category:'earth' as const,
    massKg:26,powerW:110,standbyW:8,dataMbps:0.12,sciencePerHour:2.5,costUsd:14_000_000,
    description:'Multiple reflected-light bands to examine vegetation, water and soil.',
    reference:'https://landsat.gsfc.nasa.gov/',
  },
  hyperspectral: {
    id:'hyperspectral',name:'Hyperspectral mapper',category:'earth' as const,
    massKg:70,powerW:240,standbyW:14,dataMbps:0.4,sciencePerHour:4.5,costUsd:32_000_000,
    description:'Dense spectral sampling with challenging storage and downlink.',
    reference:'https://science.nasa.gov/mission/emit/',
  },
  thermal: {
    id:'thermal',name:'Thermal infrared radiometer',category:'earth' as const,
    massKg:32,powerW:135,standbyW:10,dataMbps:0.09,sciencePerHour:2.9,costUsd:16_000_000,
    description:'Measures infrared radiance for temperature-related Earth science.',
    reference:'https://landsat.gsfc.nasa.gov/',
  },
  neoTelescope: {
    id:'neoTelescope',name:'NEOSSAT-inspired optical telescope',category:'earth' as const,
    massKg:35,powerW:118,standbyW:7,dataMbps:.12,sciencePerHour:2.4,costUsd:15_000_000,
    description:'Optical astrometry and near-Earth-object candidate imaging inspired by CSA NEOSSAT FITS data extraction tutorials. All sensor engineering figures are game assumptions, NOT NEOSSAT actual hardware performance.',
    reference:'https://github.com/asc-csa/NEOSSAT_Tutorial',
  },
  auroralImager: {
    id:'auroralImager',name:'CASSIOPE-inspired auroral imager',category:'earth' as const,
    massKg:22,powerW:94,standbyW:6,dataMbps:.075,sciencePerHour:2.1,costUsd:12_000_000,
    description:'Auroral imaging and ionospheric research inspired by CASSIOPE e-POP/FAI data tutorials. The power, data rate, mass and procurement amounts are fictional.',
    reference:'https://github.com/asc-csa/CASSIOPE-Tutorial',
  },
  sarImager: {
    id:'sarImager',name:'RADARSAT-inspired synthetic-aperture radar',category:'earth' as const,
    massKg:95,powerW:345,standbyW:12,dataMbps:.75,sciencePerHour:4.5,costUsd:45_000_000,
    description:'Active SAR payload, higher peak electrical and downlink burden, inspired by CSA RADARSAT-1/RCM Earth-observation archive tutorials. This illustrative sensor is NOT an actual RADARSAT antenna or specification.',
    reference:'https://github.com/asc-csa/EO-Visualization-and-Search-Tutorial',
  },
  magnetometer: {
    id:'magnetometer',name:'Fluxgate magnetometer',category:'planetary' as const,
    massKg:6,powerW:12,standbyW:2,dataMbps:0.0006,sciencePerHour:0.7,costUsd:2_000_000,
    description:'Measures magnetic field variation; usually carried on a boom.',
    reference:'https://science.nasa.gov/mission/psyche/',
  },
  irMapper: {
    id:'irMapper',name:'Visible/infrared mineral mapper',category:'planetary' as const,
    massKg:18,powerW:65,standbyW:5,dataMbps:0.035,sciencePerHour:2.0,costUsd:8_000_000,
    description:'Hypothetical mineral spectral mapper for asteroid and moon flybys.',
    reference:'https://science.nasa.gov/mission/dawn/',
  },
  gammaNeutron: {
    id:'gammaNeutron',name:'Gamma-ray and neutron spectrometer',category:'planetary' as const,
    massKg:27,powerW:60,standbyW:9,dataMbps:0.001,sciencePerHour:1.5,costUsd:9_000_000,
    description:'Measures energetic particles associated with elemental composition.',
    reference:'https://science.nasa.gov/mission/dawn/',
  },
  lidar: {
    id:'lidar',name:'Laser altimeter',category:'planetary' as const,
    massKg:24,powerW:105,standbyW:6,dataMbps:0.02,sciencePerHour:1.8,costUsd:12_000_000,
    description:'Pulsed ranging for surface elevations, geometry and navigation.',
    reference:'https://science.nasa.gov/mission/psyche/',
  },
} as const;
export type ScienceInstrumentId=keyof typeof SCIENCE_INSTRUMENTS;
export type InstrumentSelection='none'|ScienceInstrumentId;

export function getInstrument(id:InstrumentSelection) {
  return id==='none'?null:SCIENCE_INSTRUMENTS[id];
}
