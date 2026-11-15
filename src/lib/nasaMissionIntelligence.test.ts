import {describe,it,expect} from 'vitest';
import {parseDONKI,parseNeoFeed,nasaWeatherBrief,makeNeoObservationOffer,
  type NASAMissionSnapshot} from './nasaMissionIntelligence';
import {specialOfferStatus,reviewCampaignMission,DEFAULT_MISSION_OPTIONS,STORY_MISSIONS} from './campaignMissions';
import {DEFAULT_SUBSYSTEM_DESIGN} from './subsystemDesign';
import {INITIAL_VEHICLE} from './engineering';
const now=new Date('2026-11-15T13:00:00Z');
const testData:NASAMissionSnapshot={
 fetchedAt:now.toISOString(),windowStart:'2026-11-08',windowEnd:'2026-11-22',
 source:'NASA API',partial:false,warnings:[],approaches:[],
 weather:parseDONKI('FLR',[
   {flrID:'flare-x',peakTime:'2026-11-14T22:00Z',classType:'X2.3',
     link:'https://ccmc.gsfc.nasa.gov/DONKI/'}]),
};
describe('NASA data integration: data provenance vs game assumptions',()=>{
 it('reads real DONKI flare, storm Kp and particle forms defensively',()=>{
  expect(testData.weather[0].level).toBe('high');
  expect(testData.weather[0].reading).toBe('X2.3');
  const storms=parseDONKI('GST',[{gstID:'g-1',startTime:'2026-11-14T14:00Z',
    allKpIndex:[{kpIndex:5},{kpIndex:7}]}]);
  expect(storms[0].level).toBe('high');
  expect(storms[0].reading).toBe('Kp 7.0');
  expect(parseDONKI('SEP',[{sepID:'p-1',eventTime:'2026-11-14T00:00Z'}])[0].level).toBe('elevated');
  expect(parseDONKI('GST',[null,{},17])).toEqual([]);
  expect(parseDONKI('FLR',null)).toEqual([]);
 });
 it('applies recorded weather only to matching real calendar dates, not a game forecast',()=>{
  const live=nasaWeatherBrief(testData,'2026-11-15',now);
  expect(live.reserveHours).toBe(2);
  expect(live.applicable).toBe(true);
  expect(nasaWeatherBrief(testData,'2027-01-01',now).reserveHours).toBe(0);
  expect(nasaWeatherBrief(testData,'2026-11-10',now).reserveHours).toBe(0);
  const old=nasaWeatherBrief(testData,'2026-11-15',new Date('2026-11-20T13:00:00Z'));
  expect(old.reserveHours).toBe(0);
  expect(nasaWeatherBrief(null,'2026-11-15',now).reserveHours).toBe(0);
 });
 it('increases near-Earth and Moon battery needs, not the distant future',()=>{
  const args={definition:STORY_MISSIONS[0],day:2,options:DEFAULT_MISSION_OPTIONS,
    spacecraft:DEFAULT_SUBSYSTEM_DESIGN,launcher:INITIAL_VEHICLE,
    capitalUsd:500e6,productionDiscount:0};
  const base=reviewCampaignMission(args);
  const weather=reviewCampaignMission({...args,weatherReserveHours:2});
  expect(weather.backupRequiredWh).toBeGreaterThan(base.backupRequiredWh);
  expect(weather.checks.some(c=>c.label.includes('NASA DONKI'))).toBe(true);
  const mars=reviewCampaignMission({...args,definition:STORY_MISSIONS[2]});
  const marsWeather=reviewCampaignMission({...args,definition:STORY_MISSIONS[2],weatherReserveHours:2});
  expect(mars.backupRequiredWh).toBe(marsWeather.backupRequiredWh);
 });
 it('uses real JPL close approach properties for a fictional orbital observer, never rendezvous',()=>{
  const neos=parseNeoFeed({near_earth_objects:{
    '2026-11-17':[{id:'2031',name:'(2026 ZZ1)',is_potentially_hazardous_asteroid:true,
      nasa_jpl_url:'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2031',
      estimated_diameter:{meters:{estimated_diameter_min:80,estimated_diameter_max:180}},
      close_approach_data:[{close_approach_date:'2026-11-17',orbiting_body:'Earth',
        miss_distance:{kilometers:'2000000'},relative_velocity:{kilometers_per_second:'13.4'}}]}] }});
  expect(neos).toHaveLength(1);
  expect(neos[0].missDistanceKm).toBe(2e6);
  expect(neos[0].diameterM).toBe(130);
  const offer=makeNeoObservationOffer(neos[0],15);
  expect(offer.mission.target).toBe('ellipse');
  expect(offer.mission.stage).toBe(1);
  expect(offer.mission.summary).toContain('does not intercept');
  const muchLarger=makeNeoObservationOffer({
    ...neos[0],diameterM:800,missDistanceKm:450000,velocityKmS:36},15);
  expect(muchLarger.mission.requiredScienceKg).toBeGreaterThan(offer.mission.requiredScienceKg);
  expect(muchLarger.mission.minElectricW).toBeGreaterThan(offer.mission.minElectricW);
  expect(muchLarger.mission.payoutUsd).toBeGreaterThan(offer.mission.payoutUsd);
  expect(specialOfferStatus(offer.mission,22)).toBe('open');
  expect(specialOfferStatus(offer.mission,24)).toBe('expired');
  expect(parseNeoFeed({near_earth_objects:{'x':[{}]}})).toEqual([]);
 });
});
