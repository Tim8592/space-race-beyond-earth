import {describe,it,expect} from 'vitest';
import {AGENCY_MILESTONES,agencyMissionDefinitions} from './realWorldMissions';
import {specialOfferStatus,unlockedStage} from './campaignMissions';
describe('Real mission inspiration with fictional deadline contracts',()=>{
  it('reuses recorded NASA milestones but not claimed official procurement windows',()=>{
    const contracts=agencyMissionDefinitions();
    expect(contracts).toHaveLength(4);
    expect(contracts[0].windowStartDay).toBe(1);
    expect(specialOfferStatus(contracts[0],1)).toBe('open');
    expect(specialOfferStatus(contracts[0],contracts[0].windowEndDay!+1)).toBe('expired');
    expect(contracts.map(c=>c.stage)).toEqual([1,2,3,4]);
    expect(AGENCY_MILESTONES.every(m=>m.sourceUrl.startsWith('https://science.nasa.gov/'))).toBe(true);
    expect(unlockedStage(['observation'],false)).toBe(1);
    expect(contracts[3].stage).toBeGreaterThan(unlockedStage(['observation'],false));
  });
});
