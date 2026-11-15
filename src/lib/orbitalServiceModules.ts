/**
 * Fictional, power- and thermally-accounted orbital-service payload models.
 * Product/category inspiration only, NOT actual vendor specifications/pricing.
 * Galaxia Onyx Edge: https://gx.space/news-press-releases/galaxia-introduces-onyx-edge
 * Galaxia OSPREY: https://gx.space/news-press-releases/galaxia-unveils-osprey-advancing-canadian-built-space-technology-for-defence-applications
 * Kepler LEO relay: https://www.kepler.space/
 */
export const ORBITAL_SERVICE_MODULES={
 none:{id:'none',name:'No commercial orbital-service payload',massKg:0,
   activePowerW:0,standbyW:0,heatDissipationW:0,downlinkMbps:0,costUsd:0,
   family:'none',description:'No commercial computing or communications hardware.',
   sourceUrl:'https://www.csa-asc.gc.ca/eng/'},
 compute:{
   id:'compute',name:'Onyx Edge–inspired orbital compute blades',
   massKg:75,activePowerW:550,standbyW:65,heatDissipationW:495,downlinkMbps:35,
   costUsd:28e6,family:'compute',
   description:'Fictional modular flight computer plus application-processor stack inspired by Galaxia Onyx Edge Core + Blades, MissionOne and VSaS. Extra radiator capacity, solar production, launch mass and operations are mandatory.',
   sourceUrl:'https://gx.space/news-press-releases/galaxia-introduces-onyx-edge',
 },
 relay:{
   id:'relay',name:'Canadian hybrid RF/optical network node',
   massKg:60,activePowerW:410,standbyW:45,heatDissipationW:350,downlinkMbps:300,
   costUsd:24e6,family:'relay',
   description:'Fictional Canadian low Earth orbit communications relay with intersatellite data transport, inspired by Kepler and Galaxia OSPREY. Orbital-plane coverage, laser link acquisition and regulatory licensing remain future models.',
   sourceUrl:'https://gx.space/news-press-releases/galaxia-unveils-osprey-advancing-canadian-built-space-technology-for-defence-applications',
 },
} as const;
export type OrbitalServiceModuleId=keyof typeof ORBITAL_SERVICE_MODULES;
export const getOrbitalModule=(id:OrbitalServiceModuleId)=>ORBITAL_SERVICE_MODULES[id];
