/**
 * Real public research/tutorial repos from the Canadian Space Agency.
 * We reference and correctly name their data products but DO NOT pretend
 * to have retrieved restricted datasets or raw FITS/SAR archives in browser.
 * Game missions, sensor costs, power and science performance are fictional.
 */
import type {CampaignDefinition} from './campaignMissions';

export type CSADataProgram={
 id:string;agency:'Canadian Space Agency';
 realProgram:string;datasetFormat:string;datasetDescription:string;
 dataAccess:string;sourceUrl:string;technicalDataUrl:string;
 mission:CampaignDefinition;
};
export const CSA_DATA_PROGRAMS:readonly CSADataProgram[]=[
 {
  id:'neossat-optical',agency:'Canadian Space Agency',realProgram:'NEOSSAT',
  datasetFormat:'FITS astronomical imagery',
  datasetDescription:'CSA examples demonstrate downloading, inspecting and preprocessing real NEOSSAT CCD/FITS optical images from CSA and Canadian Astronomy Data Centre archives for near-Earth-object search.',
  dataAccess:'Access instructions and FITS processing examples are provided in the public CSA tutorial. This game does not auto-download FITS image collections.',
  sourceUrl:'https://github.com/asc-csa/NEOSSAT_Tutorial',
  technicalDataUrl:'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/',
  mission:{
   id:'csa-neossat-observer',title:'Canadian Optical Asteroid Survey',
   summary:'Fictional satellite mission inspired by CSA NEOSSAT optical/FITS workflows. Design and launch a fresh Earth-orbit optical asteroid observer; NEOSSAT imagery and methods are real external data references, not a reused historical spacecraft orbit or a CSA procurement award.',
   location:'Earth orbit · optical NEO survey',target:'ellipse',stage:1,
   durationDays:8,payoutUsd:174e6,requiredScienceKg:30,minElectricW:170,
   requiresHighGain:true,requiresShield:false,
   acceptedInstruments:['neoTelescope'],
  },
 },
 {
  id:'cassiope-auroral',agency:'Canadian Space Agency',realProgram:'CASSIOPE e-POP / FAI',
  datasetFormat:'Fast Auroral Imager observations',
  datasetDescription:'CSA tutorial covers real Fast Auroral Imager data extraction, image visualization, map projections and time-series imaging from CASSIOPE e-POP.',
  dataAccess:'Some CASSIOPE datasets need permission through University of Calgary services; this game provides the source and research scenario, not restricted observations.',
  sourceUrl:'https://github.com/asc-csa/CASSIOPE-Tutorial',
  technicalDataUrl:'https://epop.phys.ucalgary.ca/',
  mission:{
   id:'csa-cassiope-ionosphere',title:'Canadian Auroral Research Satellite',
   summary:'Fictional follow-on Earth-orbit auroral/imager mission inspired by the CSA CASSIOPE e-POP and FAI data workflows. Designed instrument, electrical supply, launch mass and backup power are checked in game; no real CASSIOPE flight is reproduced.',
   location:'Earth orbit · auroral science',target:'ellipse',stage:1,
   durationDays:8,payoutUsd:184e6,requiredScienceKg:20,minElectricW:165,
   requiresHighGain:true,requiresShield:false,
   acceptedInstruments:['auroralImager'],
  },
 },
 {
  id:'radarsat-sar',agency:'Canadian Space Agency',realProgram:'RADARSAT-1 / RADARSAT Constellation',
  datasetFormat:'SAR radar imagery and catalogue metadata',
  datasetDescription:'CSA Earth Observation tutorials show how to search and visualize RADARSAT-1 and RADARSAT Constellation SAR archive imagery using the Canadian Earth Observation Data Management System (EODMS).',
  dataAccess:'Some datasets require an EODMS account or permissions. No large radar imagery is bundled; the game uses a separately modeled SAR payload with actual mass/power/data-rate tradeoffs.',
  sourceUrl:'https://github.com/asc-csa/EO-Visualization-and-Search-Tutorial',
  technicalDataUrl:'https://www.eodms-sgdot.nrcan-rncan.gc.ca/',
  mission:{
   id:'csa-radarsat-sar',title:'Canadian Arctic Radar Mapping',
   summary:'Fictional synthetic-aperture radar mission inspired by real Canadian RADARSAT archival data. Install the dedicated game SAR radar, size extra electrical power and radiators, pay launch invoices, and keep the high-rate payload operating.',
   location:'Earth orbit · active SAR imaging',target:'ellipse',stage:1,
   durationDays:7,payoutUsd:252e6,requiredScienceKg:90,minElectricW:410,
   requiresHighGain:true,requiresShield:false,
   acceptedInstruments:['sarImager'],
  },
 },
] as const;
export const CSA_DATA_MISSIONS:readonly CampaignDefinition[]=CSA_DATA_PROGRAMS.map(x=>x.mission);
