import {describe,it,expect} from 'vitest';
import {EARTH,STANDARD_GRAVITY_MS2} from './nasaData';
import {earthOrbitAtTime} from './orbitalMechanics';
import {DEFAULT_SUBSYSTEM_DESIGN} from './subsystemDesign';
import {INITIAL_VEHICLE} from './engineering';
import {
  BOOSTERS,DEFAULT_MISSION_OPTIONS,STORY_MISSIONS,dateForGameDay,
  nextSpecialOffer,orbitalRoute,reviewCampaignMission,specialOfferStatus,
  unlockedStage,type MissionOptions,
} from './campaignMissions';
const luna=STORY_MISSIONS[0];
const referenceArgs={
  definition:luna,day:8,options:DEFAULT_MISSION_OPTIONS,
  spacecraft:DEFAULT_SUBSYSTEM_DESIGN,launcher:INITIAL_VEHICLE,
  capitalUsd:350e6,productionDiscount:0,
};
describe('Next chapter campaign and orbit integrations',()=>{
  it('requires the guided Earth Observation success and each story milestone',()=>{
    expect(unlockedStage([],false)).toBe(0);
    expect(unlockedStage(['cargo'],false)).toBe(0);
    expect(unlockedStage(['observation'],false)).toBe(1);
    expect(unlockedStage(['observation','lunar'],false)).toBe(2);
    expect(unlockedStage(['observation','lunar','asteroid'],false)).toBe(3);
    expect(unlockedStage(['observation','lunar','asteroid','mars'],false)).toBe(4);
    expect(unlockedStage([],true)).toBe(4);
  });
  it('creates deterministic, advancing in-game deadlines that eventually expire',()=>{
    const a=nextSpecialOffer(8,1)!;
    const b=nextSpecialOffer(8,1)!;
    expect(a).toEqual(b);
    expect(a.special).toBe(true);
    expect(specialOfferStatus(a,8)).toBe('open');
    expect(specialOfferStatus(a,a.windowEndDay!+1)).toBe('expired');
    expect(nextSpecialOffer(41,1)?.id).not.toBe(a.id);
    expect(nextSpecialOffer(4,0)).toBeNull();
  });
  it('elliptical special orbit uses exactly the same Earth Kepler state',()=>{
    const o:MissionOptions={...DEFAULT_MISSION_OPTIONS,perigeeKm:500,eccentricity:.67};
    const route=orbitalRoute('ellipse',8,o);
    const model=earthOrbitAtTime(500,.67,0);
    const parkingSpeed=Math.sqrt(EARTH.gravitationalParameterKm3PerS2/
      (EARTH.equatorialRadiusKm+500));
    expect(route.apogeeKm).toBeCloseTo(model.apogeeAltitudeKm,8);
    expect(route.totalDeltaVms).toBeCloseTo((model.speedKmS-parkingSpeed)*1000,8);
    expect(route.perigeeKm).toBe(500);
  });
  it('larger external kick stage increases launch mass AND achievable transfer delta-V',()=>{
    const none=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,booster:'none'}});
    const stage=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,booster:'cryogenic'}});
    expect(stage.hardwareWetKg).toBeGreaterThan(none.hardwareWetKg);
    expect(stage.costUsd).toBeGreaterThan(none.costUsd);
    expect(stage.boosterDeltaVms).toBeGreaterThan(none.boosterDeltaVms);
    expect(stage.totalDeltaVms).toBeGreaterThan(none.totalDeltaVms);
  });
  it('installed high-gain/radiation module increases mass and electrical load',()=>{
    const simple=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,
      highGain:false,radiationShield:false}});
    const bigger=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,
      highGain:true,radiationShield:true}});
    expect(bigger.hardwareWetKg).toBeGreaterThan(simple.hardwareWetKg);
    expect(bigger.powerDemandW).toBeGreaterThan(simple.powerDemandW);
    expect(bigger.costUsd).toBeGreaterThan(simple.costUsd);
  });
  it('time window is a hard gate; missing high apogee and deadlines cannot pass',()=>{
    const offer=nextSpecialOffer(8,1)!;
    const review=reviewCampaignMission({...referenceArgs,definition:offer,
      options:{...DEFAULT_MISSION_OPTIONS,eccentricity:.01}});
    expect(review.feasible).toBe(false);
    expect(review.checks.some(c=>c.label==='Elliptical target apogee'&&!c.passed)).toBe(true);
    const late=reviewCampaignMission({...referenceArgs,definition:offer,day:offer.windowEndDay!+1});
    expect(late.checks.some(c=>c.label==='Special contract deadline'&&!c.passed)).toBe(true);
  });
  it('solar power drops at Mars and Jupiter as heliocentric distance increases',()=>{
    const lunar=reviewCampaignMission({...referenceArgs});
    const mars=reviewCampaignMission({...referenceArgs,definition:STORY_MISSIONS[2]});
    const jovian=reviewCampaignMission({...referenceArgs,definition:STORY_MISSIONS[3]});
    expect(lunar.powerAvailableW).toBeGreaterThan(mars.powerAvailableW);
    expect(mars.powerAvailableW).toBeGreaterThan(jovian.powerAvailableW);
    expect(jovian.feasible).toBe(false);
    expect(jovian.checks.some(c=>c.label==='Power at destination'&&!c.passed)).toBe(true);
  });
  it('Orekit Lambert result can override Hohmann when target and departure date match',()=>{
    const date=dateForGameDay(8);
    const solved={target:'mars' as const,departureDate:date,flightDays:310,
      departureVInfinityKmS:2.1,arrivalVInfinityKmS:1.2,eccentricity:.23};
    const v=orbitalRoute('mars',8,DEFAULT_MISSION_OPTIONS,solved);
    expect(v.source).toBe('Orekit Lambert');
    expect(v.totalDeltaVms).toBeGreaterThan(0);
    const stale=orbitalRoute('mars',9,DEFAULT_MISSION_OPTIONS,solved);
    expect(stale.source).toBe('Hohmann approximation');
  });
  it('booster ideal delta-V accounts for attached spacecraft and jettisoned dry stage',()=>{
    const booster=BOOSTERS.storable;
    const review=reviewCampaignMission(referenceArgs);
    const mainWet=review.hardwareWetKg-booster.dryKg-booster.propKg;
    const correct=booster.ispS*STANDARD_GRAVITY_MS2*
      Math.log((mainWet+booster.dryKg+booster.propKg)/(mainWet+booster.dryKg));
    expect(review.boosterDeltaVms).toBeCloseTo(correct,8);
  });
});
