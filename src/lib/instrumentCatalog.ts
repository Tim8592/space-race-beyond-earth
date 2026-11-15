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
