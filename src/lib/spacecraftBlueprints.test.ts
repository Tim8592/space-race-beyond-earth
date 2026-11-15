import {describe,it,expect} from 'vitest';
import {DEFAULT_SUBSYSTEM_DESIGN} from './subsystemDesign';
import {cloneSpacecraftDesign,saveSpacecraftBlueprint,duplicateSpacecraftBlueprint,
  markSpacecraftDeployed,safeBlueprints} from './spacecraftBlueprints';
describe('Excel-style independent spacecraft configurations',()=>{
 it('new workbook is independent, saving and cloning does not modify original',()=>{
   const original=cloneSpacecraftDesign({...DEFAULT_SUBSYSTEM_DESIGN,cellAreaM2:12,
     orbitalServiceModuleId:'compute'});
   const saved=saveSpacecraftBlueprint([],'Compute Mark I',original,11,'First build');
   const duplicated=duplicateSpacecraftBlueprint(saved,saved[0].id,12);
   expect(duplicated).toHaveLength(2);
   expect(duplicated[0].name).toContain('Copy');
   expect(duplicated[0].id).not.toBe(saved[0].id);
   const editing=cloneSpacecraftDesign(duplicated[0].design);
   editing.cellAreaM2=22;
   editing.orbitalServiceModuleId='relay';
   expect(saved[0].design.cellAreaM2).toBe(12);
   expect(saved[0].design.orbitalServiceModuleId).toBe('compute');
   expect(duplicated[0].design.cellAreaM2).toBe(12);
   expect(duplicated[0].design.orbitalServiceModuleId).toBe('compute');
 });
 it('archives only once per identical flown configuration and adds real mission names',()=>{
   const once=markSpacecraftDeployed([],'Flight Mk I',DEFAULT_SUBSYSTEM_DESIGN,
     'Lunar Pathfinder',24);
   expect(once).toHaveLength(1);
   expect(once[0].source).toBe('mission');
   expect(once[0].lastUsedDay).toBe(24);
   const again=markSpacecraftDeployed(once,'Flight Mk II',DEFAULT_SUBSYSTEM_DESIGN,
     'Mars Survey',40);
   expect(again).toHaveLength(1);
   expect(again[0].usedOnMissions).toEqual(['Lunar Pathfinder','Mars Survey']);
   const third=markSpacecraftDeployed(again,'Other craft',
     {...DEFAULT_SUBSYSTEM_DESIGN,orbitalServiceModuleId:'relay'},'Network phase 1',44);
   expect(third).toHaveLength(2);
 });
 it('migrates old blueprints and filters corrupt payload with defaults',()=>{
   const saved=saveSpacecraftBlueprint([],'Legacy',DEFAULT_SUBSYSTEM_DESIGN,5);
   const raw=[{...saved[0],design:{...DEFAULT_SUBSYSTEM_DESIGN,orbitalServiceModuleId:undefined}},
     {id:'x',name:'Bad',design:{thrusterCount:-5000}}];
   const restored=safeBlueprints(raw);
   expect(restored).toHaveLength(1);
   expect(restored[0].design.orbitalServiceModuleId).toBe('none');
   expect(safeBlueprints(null)).toEqual([]);
 });
});
