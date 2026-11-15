import {describe,it,expect} from 'vitest';
import {resolveCampaignSelection} from './campaignSelection';
import {agencyMissionDefinitions} from './realWorldMissions';
describe('Shared campaign selection',()=>{
  it('keeps side missions independent of story unlock progression',()=>{
    const day=agencyMissionDefinitions()[0].windowEndDay!+10;
    const state=resolveCampaignSelection(day,1,['observation'],'agency-clipper-assist');
    expect(state.selected.id).toBe('agency-clipper-assist');
    expect(state.selected.title).toContain('Follow-on');
    expect(state.selected.windowEndDay).toBeUndefined();
    expect(state.story[1].id).toBe('asteroid');
  });
  it('keeps story and NASA map selection consistent across panels',()=>{
    const state=resolveCampaignSelection(1,4,['observation'],'jupiter');
    expect(state.selected.id).toBe('jupiter');
    expect(state.agency).toHaveLength(7);
    expect(state.agency.filter(x=>x.id.startsWith('csa-'))).toHaveLength(3);
  });
});
