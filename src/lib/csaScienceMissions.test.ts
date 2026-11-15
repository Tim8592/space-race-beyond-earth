import {describe,it,expect} from 'vitest';
import {CSA_DATA_PROGRAMS,CSA_DATA_MISSIONS} from './csaScienceMissions';
import {SCIENCE_INSTRUMENTS} from './instrumentCatalog';
import {DEFAULT_SUBSYSTEM_DESIGN} from './subsystemDesign';
import {DEFAULT_MISSION_OPTIONS,reviewCampaignMission} from './campaignMissions';
import {INITIAL_VEHICLE} from './engineering';
import {INSTRUMENT_RESEARCH} from './technologyTree';
describe('Canadian public science data → real spacecraft instrument checks',()=>{
 it('uses three verified CSA source repos and distinct data formats, no fabricated archive data',()=>{
  expect(CSA_DATA_PROGRAMS).toHaveLength(3);
  expect(new Set(CSA_DATA_MISSIONS.map(x=>x.id)).size).toBe(3);
  for(const p of CSA_DATA_PROGRAMS){
   expect(p.sourceUrl).toMatch(/^https:\/\/github\.com\/asc-csa\//);
   expect(p.datasetFormat.length).toBeGreaterThan(6);
   expect(p.mission.stage).toBe(1);
   expect(p.mission.target).toBe('ellipse');
   expect(p.mission.acceptedInstruments).toHaveLength(1);
   const name=p.mission.acceptedInstruments[0];
   expect(SCIENCE_INSTRUMENTS[name].powerW).toBeGreaterThan(0);
   expect(SCIENCE_INSTRUMENTS[name].massKg).toBeGreaterThan(0);
   expect(INSTRUMENT_RESEARCH[name]).toBe('precision-imaging');
  }
 });
 it('game checks matched CSA optical / auroral / active SAR sensor instead of decorative contracts',()=>{
  const baseline={day:14,options:DEFAULT_MISSION_OPTIONS,launcher:INITIAL_VEHICLE,
    capitalUsd:1e9,productionDiscount:0,launchService:'falcon9' as const};
  for(const p of CSA_DATA_PROGRAMS){
    const noInstrument=reviewCampaignMission({...baseline,definition:p.mission,spacecraft:DEFAULT_SUBSYSTEM_DESIGN});
    const actual=reviewCampaignMission({...baseline,definition:p.mission,
      spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,payloadInstrumentId:p.mission.acceptedInstruments[0]}});
    expect(noInstrument.checks.find(c=>c.label==='Required science instrument')?.passed).toBe(false);
    expect(actual.checks.find(c=>c.label==='Required science instrument')?.passed).toBe(true);
    expect(actual.hardwareWetKg).toBeGreaterThan(noInstrument.hardwareWetKg);
    expect(actual.powerDemandW).toBeGreaterThan(noInstrument.powerDemandW);
    expect(actual.costUsd).toBeGreaterThan(noInstrument.costUsd);
  }
  const auroral=SCIENCE_INSTRUMENTS.auroralImager;
  const sar=SCIENCE_INSTRUMENTS.sarImager;
  expect(sar.powerW).toBeGreaterThan(auroral.powerW*3);
  expect(sar.dataMbps).toBeGreaterThan(auroral.dataMbps);
 });
});
