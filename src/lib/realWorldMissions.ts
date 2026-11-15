import type {CampaignDefinition} from './campaignMissions';
import {GAME_EPOCH_MS} from './campaignClock';

/**
 * NASA-confirmed mission milestones, with clearly fictional player-side
 * mission support contracts. A game offer's dates are DESIGN deadlines,
 * not NASA procurement periods or verified heliocentric launch windows.
 * Dates/summaries were checked against NASA mission pages on 2026-11-14.
 */
export type AgencyMilestone = {
  id:string; realMission:string; event:string; windowStart:string; windowEnd:string;
  sourceUrl:string; sourceNote:string; contract:CampaignDefinition;
};
export const AGENCY_MILESTONES:readonly AgencyMilestone[]=[
  {
    id:'clipper-assist',realMission:'Europa Clipper',event:'Earth gravity assist · December 2026',
    windowStart:'2026-11-14',windowEnd:'2026-12-31',
    sourceUrl:'https://science.nasa.gov/mission/europa-clipper/mission-timeline/',
    sourceNote:'NASA lists an Earth gravity-assist flyby in December 2026. No actual support contract is implied.',
    contract:{id:'agency-clipper-assist',title:'Clipper Flyby Tracking Demonstrator',
      summary:'Fictional fast-response Earth-orbit relay support, inspired by Europa Clipper’s real December 2026 Earth flyby. Launch an elliptical-orbit tracking demonstrator before the GAME deadline.',
      location:'Elliptical Earth orbit',target:'ellipse',stage:1,special:true,durationDays:5,
      payoutUsd:195e6,requiredScienceKg:40,minElectricW:180,
      requiresHighGain:true,requiresShield:false,acceptedInstruments:[],
      ellipticalApogeeKm:19000}
  },
  {
    id:'neo-surveyor',realMission:'NEO Surveyor',event:'Launch NET September 2027',
    windowStart:'2027-07-01',windowEnd:'2027-09-30',
    sourceUrl:'https://science.nasa.gov/mission/neo-surveyor/',
    sourceNote:'NASA describes a space-based infrared survey for potentially hazardous asteroids, launching no earlier than September 2027. The playable asteroid target is synthetic, NOT NEO Surveyor’s actual trajectory.',
    contract:{id:'agency-neo-surveyor',title:'Near-Earth Infrared Survey Pathfinder',
      summary:'Fictional infrared scout inspired by NASA NEO Surveyor. Design a scientific survey probe using the game’s synthetic 1.35 AU target; this is NOT NEO Surveyor’s Sun–Earth L1 trajectory.',
      location:'Synthetic asteroid survey target',target:'asteroid',stage:2,special:true,durationDays:220,
      payoutUsd:430e6,requiredScienceKg:75,minElectricW:310,requiresHighGain:true,
      requiresShield:false,acceptedInstruments:['thermal','irMapper']}
  },
  {
    id:'skyfall',realMission:'SkyFall',event:'Planned launch · late 2028',
    windowStart:'2028-09-01',windowEnd:'2028-12-31',
    sourceUrl:'https://science.nasa.gov/mission/skyfall/',
    sourceNote:'NASA lists three Mars rotorcraft and a late-2028 launch target. This is an illustrative separately designed relay spacecraft, not SkyFall flight hardware or its nuclear-electric transfer.',
    contract:{id:'agency-skyfall',title:'Mars Rotorcraft Relay Pathfinder',
      summary:'Fictional Mars communications/science relay inspired by NASA SkyFall’s planned three-rotorcraft exploration. Evaluate an actual Mars transfer in Orbital Map, not the original mission trajectory.',
      location:'Mars',target:'mars',stage:3,special:true,durationDays:300,
      payoutUsd:650e6,requiredScienceKg:100,minElectricW:380,
      requiresHighGain:true,requiresShield:false,acceptedInstruments:['thermal','lidar']}
  },
  {
    id:'clipper-arrival',realMission:'Europa Clipper',event:'Jupiter orbit insertion · April 2030',
    windowStart:'2030-01-01',windowEnd:'2030-04-30',
    sourceUrl:'https://science.nasa.gov/mission/europa-clipper/mission-timeline/',
    sourceNote:'NASA expects Jupiter orbit insertion in April 2030. The game models a Jupiter FLYBY only, not Clipper’s real orbit insertion, gravity assists, or Europa tour.',
    contract:{id:'agency-clipper-arrival',title:'Jovian Science Flyby Support',
      summary:'Fictional separate Jovian flyby probe inspired by Europa Clipper arrival. Design hardened science, deep-space communications and outer-planet electrical power. Not a Europa orbit or a replica of Clipper.',
      location:'Jupiter flyby',target:'jupiter',stage:4,special:true,durationDays:1050,
      payoutUsd:1120e6,requiredScienceKg:140,minElectricW:450,
      requiresHighGain:true,requiresShield:true,acceptedInstruments:['magnetometer','irMapper','gammaNeutron']}
  }
];
function dayForDate(date:string):number{
  const [year,month,day]=date.split('-').map(Number);
  return Math.floor((Date.UTC(year,month-1,day,12)-GAME_EPOCH_MS)/86_400_000)+1;
}
/**
 * NASA milestones are historical calendar context, never mandatory campaign
 * prerequisites. After a fictional proposal window closes, a lower-paying
 * follow-on training/customer reissue remains playable. Its reward may be
 * claimed only once under the stable contract id.
 */
export type AgencyOfferPhase='upcoming'|'open'|'reissued';
export function agencyOfferPhase(offer:CampaignDefinition,day:number):AgencyOfferPhase{
  if(offer.windowStartDay!==undefined&&day<offer.windowStartDay)return 'upcoming';
  if(offer.windowEndDay!==undefined&&day>offer.windowEndDay)return 'reissued';
  return 'open';
}
export function reissueAgencyOffer(offer:CampaignDefinition,day:number):CampaignDefinition{
  if(agencyOfferPhase(offer,day)!=='reissued')return offer;
  return {...offer,title:offer.title+' · Follow-on',
    summary:offer.summary+' Original game proposal window missed. A separate fictional follow-on contract remains available at reduced funding; the real NASA milestone is NOT repeated.',
    payoutUsd:Math.round(offer.payoutUsd*.75/1e6)*1e6,
    windowStartDay:undefined,windowEndDay:undefined};
}
export function agencyMissionDefinitions(day?:number):CampaignDefinition[]{
  const base=AGENCY_MILESTONES.map(item=>({...item.contract,
    windowStartDay:dayForDate(item.windowStart),windowEndDay:dayForDate(item.windowEnd)}));
  return day===undefined?base:base.map(offer=>reissueAgencyOffer(offer,day));
}
