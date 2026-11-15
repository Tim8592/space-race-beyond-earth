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
  it('science payload comes from installed science cargo, never support equipment',()=>{
    const clean=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,
      highGain:false,radiationShield:false,reserveBattery:false}});
    const supported=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,
      highGain:true,radiationShield:true,reserveBattery:true}});
    expect(supported.scienceMassKg).toBe(clean.scienceMassKg);
    expect(supported.hardwareWetKg).toBeGreaterThan(clean.hardwareWetKg);
    expect(supported.powerDemandW).toBeGreaterThan(clean.powerDemandW);
    expect(supported.costUsd).toBeGreaterThan(clean.costUsd);
    const cargo=reviewCampaignMission({...referenceArgs,
      spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,payloadMassKg:DEFAULT_SUBSYSTEM_DESIGN.payloadMassKg+50}});
    expect(cargo.scienceMassKg).toBe(clean.scienceMassKg+50);
    const rideshare=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,cubesatUnits:3}});
    expect(rideshare.scienceMassKg).toBeGreaterThan(clean.scienceMassKg);
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
  it('external energy reserve increases survival margin without creating solar power',()=>{
    const noReserve=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,reserveBattery:false}});
    const reserve=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,reserveBattery:true}});
    expect(reserve.backupUsableWh).toBeGreaterThan(noReserve.backupUsableWh);
    expect(reserve.backupRequiredWh).toBeGreaterThan(noReserve.backupRequiredWh);
    expect(reserve.powerAvailableW).toBe(noReserve.powerAvailableW);
    expect(noReserve.checks.find(c=>c.label==='Power interruption reserve')?.passed).toBe(false);
    expect(reserve.checks.find(c=>c.label==='Power interruption reserve')?.passed).toBe(true);
  });
  it('NASA CubeSat 101 form factors influence installed payload, launch mass, power and cost',()=>{
    const zero=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,cubesatUnits:0}});
    const one=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,cubesatUnits:1}});
    const three=reviewCampaignMission({...referenceArgs,options:{...DEFAULT_MISSION_OPTIONS,cubesatUnits:3}});
    expect(one.hardwareWetKg).toBeGreaterThan(zero.hardwareWetKg);
    expect(three.hardwareWetKg).toBeGreaterThan(one.hardwareWetKg);
    expect(three.powerDemandW).toBeGreaterThan(one.powerDemandW);
    expect(three.costUsd).toBeGreaterThan(one.costUsd);
    const requires3U={...luna,special:true,id:'nasa-cubesat-test',
      requiredCubeSatUnits:3 as const,windowStartDay:8,windowEndDay:29};
    const incompatible=reviewCampaignMission({...referenceArgs,definition:requires3U,
      options:{...DEFAULT_MISSION_OPTIONS,cubesatUnits:1}});
    const installed=reviewCampaignMission({...referenceArgs,definition:requires3U,
      options:{...DEFAULT_MISSION_OPTIONS,cubesatUnits:3}});
    expect(incompatible.checks.find(c=>c.label.includes('NASA CubeSat 101'))?.passed).toBe(false);
    expect(installed.checks.find(c=>c.label.includes('NASA CubeSat 101'))?.passed).toBe(true);
  });
  it('campaign special requirements increase with unlocked level',()=>{
    const early=nextSpecialOffer(8,1)!;
    const late=nextSpecialOffer(8,4)!;
    expect(late.requiredScienceKg).toBeGreaterThan(early.requiredScienceKg);
    expect(late.minElectricW).toBeGreaterThan(early.minElectricW);
  });
  it('onboard Δv uses shared mission duration and available powered engine count',()=>{
    const short=reviewCampaignMission({...referenceArgs,
      definition:{...luna,durationDays:1},
      options:{...DEFAULT_MISSION_OPTIONS,booster:'none'},
      spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,cellAreaM2:50,
        thrusterCount:4,propellantMassKg:25,structureScale:1.4}});
    const long=reviewCampaignMission({...referenceArgs,
      definition:{...luna,durationDays:80},
      options:{...DEFAULT_MISSION_OPTIONS,booster:'none'},
      spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,cellAreaM2:50,
        thrusterCount:4,propellantMassKg:25,structureScale:1.4}});
    expect(long.busDeltaVms).toBeGreaterThan(short.busDeltaVms);
    const noPower=reviewCampaignMission({...referenceArgs,
      definition:{...luna,durationDays:80},
      options:{...DEFAULT_MISSION_OPTIONS,booster:'none'},
      spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,cellAreaM2:0,
        thrusterCount:4,propellantMassKg:25,structureScale:1.4}});
    expect(noPower.busDeltaVms).toBe(0);
    const cramped=reviewCampaignMission({...referenceArgs,
      spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,thrusterCount:8,
        secondaryThrusterId:'mono-reference',secondaryThrusterCount:8,structureScale:1}});
    expect(cramped.checks.find(c=>c.label==='Engine mount clearance')?.passed).toBe(false);
    const wider=reviewCampaignMission({...referenceArgs,
      spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,thrusterCount:8,
        secondaryThrusterId:'mono-reference',secondaryThrusterCount:8,structureScale:1.8}});
    expect(wider.checks.some(c=>c.label==='Engine mount clearance'&&!c.passed)).toBe(false);
    expect(wider.hardwareWetKg).toBeGreaterThan(cramped.hardwareWetKg);
    expect(wider.costUsd).toBeGreaterThan(cramped.costUsd);
  });
  it('large spacecraft actually require multiple paid rockets and an assembly facility',()=>{
    const heavy={...referenceArgs,capitalUsd:1e9,
      launcher:{...INITIAL_VEHICLE,payloadMassKg:700}, // ignored by preset fleet
      spacecraft:{...DEFAULT_SUBSYSTEM_DESIGN,payloadMassKg:1000},
      launchService:'custom' as const,rocketProgramLevel:1,priorServiceFlights:0};
    const blocked=reviewCampaignMission({...heavy,orbitalAssemblyUnlocked:false});
    expect(blocked.launchManifest.flightsRequired).toBeGreaterThan(1);
    expect(blocked.launchManifest.feasible).toBe(false);
    expect(blocked.checks.some(c=>c.label==='Rocket launch manifest / orbital assembly'&&!c.passed)).toBe(true);
    const integrated=reviewCampaignMission({...heavy,orbitalAssemblyUnlocked:true});
    expect(integrated.launchManifest.feasible).toBe(true);
    expect(integrated.launchManifest.assemblyCostUsd).toBeGreaterThan(0);
    expect(integrated.launchManifest.assemblyHardwareKg).toBeGreaterThan(0);
    expect(integrated.costUsd).toBeCloseTo(integrated.spacecraftProcurementUsd+
      integrated.launchServicesUsd);
    expect(integrated.launchManifest.flights.every(f=>f.massKg<=f.capacityKg)).toBe(true);
    const contracted=reviewCampaignMission({...heavy,
      launchService:'falcon9',orbitalAssemblyUnlocked:false});
    expect(contracted.launchManifest.flightsRequired).toBe(1);
    expect(contracted.launchManifest.feasible).toBe(true);
    expect(contracted.launchManifest.capacityKg).toBeGreaterThan(integrated.launchCapacityKg);
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
