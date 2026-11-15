import {describe,it,expect} from 'vitest';
import {advanceProgramDay,dailyEconomics,lunarEconomics,
  researchPointsCost,MOON_BASE_LEVELS,RESEARCH_POINTS_START} from './programEconomy';
import type {TechnologyId} from './technologyTree';
const base={day:1,cash:350e6,researchPoints:RESEARCH_POINTS_START,
  researchUnlocked:[] as TechnologyId[],moonBaseLevel:0,activeStoryRun:null,
  operatingSpentUsd:0,passiveRevenueUsd:0};
describe('Recurring program economics',()=>{
 it('subtracts ongoing expense, not just launch/research purchases',()=>{
  const advanced=advanceProgramDay(base,16);
  expect(advanced.day).toBe(17);
  expect(advanced.cash).toBeLessThan(base.cash);
  expect(advanced.researchPoints).toBe(base.researchPoints+2);
  expect(advanced.operatingSpentUsd).toBeGreaterThan(0);
  expect(advanced.passiveRevenueUsd).toBe(0);
 });
 it('Moon investment provides recurring revenue net of Moon operations',()=>{
  const levelOne=dailyEconomics([],1);
  expect(levelOne.lunarRevenueUsd).toBe(MOON_BASE_LEVELS[0].dailyRevenueUsd);
  expect(levelOne.netUsd).toBeGreaterThan(0);
  const upgraded=advanceProgramDay({...base,moonBaseLevel:1},10);
  expect(upgraded.cash).toBeGreaterThan(base.cash);
  expect(upgraded.passiveRevenueUsd).toBe(10*MOON_BASE_LEVELS[0].dailyRevenueUsd);
  expect(lunarEconomics(3).grossDailyUsd).toBeGreaterThan(lunarEconomics(2).grossDailyUsd);
 });
 it('research points are scarce and required in addition to actual cash',()=>{
  expect(researchPointsCost(8e6)).toBe(2);
  expect(researchPointsCost(65e6)).toBe(17);
  expect(dailyEconomics(['fission-power'],0).expensesUsd)
    .toBeGreaterThan(dailyEconomics([],0).expensesUsd);
 });
 it('long flight time advances affect program finances, not just the displayed date',()=>{
  const game={...base,activeStoryRun:{id:'mars'},moonBaseLevel:1};
  const actual=advanceProgramDay(game,300);
  expect(actual.day).toBe(301);
  expect(actual.operatingSpentUsd).toBeGreaterThan(0);
  expect(actual.passiveRevenueUsd).toBeGreaterThan(0);
  expect(actual.cash).toBeCloseTo(base.cash+dailyEconomics([],1,true).netUsd*300);
 });
});
