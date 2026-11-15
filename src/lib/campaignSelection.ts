import {STORY_MISSIONS,nextSpecialOffer,type CampaignDefinition} from './campaignMissions';
import {agencyMissionDefinitions} from './realWorldMissions';
export type CampaignSelection={
  selected:CampaignDefinition;story:readonly CampaignDefinition[];
  agency:CampaignDefinition[];special:CampaignDefinition|null;
};
/**
 * A single resolver for Play Campaign, Engineering Lab and the mini map.
 * Source-of-truth selection belongs to App, not a locally mounted panel.
 */
export function resolveCampaignSelection(day:number,stage:number,
  completed:readonly string[],requestedId:string):CampaignSelection{
  const agency=agencyMissionDefinitions(day);
  const special=nextSpecialOffer(day,stage);
  const first=STORY_MISSIONS.find(m=>stage>=m.stage&&!completed.includes(m.id))??STORY_MISSIONS[0];
  return {selected:STORY_MISSIONS.find(m=>m.id===requestedId)??
      agency.find(m=>m.id===requestedId)??
      (special?.id===requestedId?special:null)??first,
    story:STORY_MISSIONS,agency,special};
}
