import {describe,it,expect} from 'vitest';
import {engineMounts,minimumStructureScale,extraFrameMassKg} from './structureSizing';
import {DEFAULT_SUBSYSTEM_DESIGN,sizeSubsystemDesign} from './subsystemDesign';
describe('Shared non-overlapping 3D thruster grid and structural trade-off',()=>{
 it('assigns 16 independent positions across two propulsion families',()=>{
  const mounts=engineMounts(8,8);
  expect(mounts).toHaveLength(16);
  expect(mounts.filter(m=>m.family==='primary')).toHaveLength(8);
  expect(mounts.filter(m=>m.family==='secondary')).toHaveLength(8);
  expect(new Set(mounts.map(m=>m.x.toFixed(3)+','+m.y.toFixed(3))).size).toBe(16);
  expect(minimumStructureScale(8,8)).toBeGreaterThan(1);
  expect(minimumStructureScale(1,0)).toBe(1);
 });
 it('expanding the mounting frame adds dry mass and lowers ideal Δv with same engines and fuel',()=>{
  const small=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,
    thrusterCount:8,secondaryThrusterId:'mono-reference',secondaryThrusterCount:8,
    structureScale:1,cellAreaM2:25});
  const fitted=sizeSubsystemDesign({...DEFAULT_SUBSYSTEM_DESIGN,
    thrusterCount:8,secondaryThrusterId:'mono-reference',secondaryThrusterCount:8,
    structureScale:Math.ceil(small.requiredStructureScale*20)/20,cellAreaM2:25});
  expect(small.engineMountsFit).toBe(false);
  expect(fitted.engineMountsFit).toBe(true);
  expect(fitted.extraStructureMassKg).toBeGreaterThan(0);
  expect(fitted.modeledDryMassKg-small.modeledDryMassKg).toBeCloseTo(fitted.extraStructureMassKg);
  expect(fitted.idealDeltaVms).toBeLessThan(small.idealDeltaVms);
  expect(extraFrameMassKg(1)).toBe(0);
 });
});
