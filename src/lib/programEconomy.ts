import {TECHNOLOGIES,type TechnologyId} from './technologyTree';
export {researchPointsCost} from './technologyTree';
/**
 * Fictional game economics in USD per GAME day; not NASA budgets or lunar
 * revenue forecasts. Centralized so ticking and mission time skips agree.
 */
export const RESEARCH_POINTS_START=10;
export const DAILY_BASE_OPERATIONS_USD=950_000;
export const RESEARCH_POINT_EVERY_DAYS=8;
export const MOON_BASE_LEVELS=[
  {level:1,name:'Lunar Survey Outpost',investmentUsd:75e6,dailyRevenueUsd:1_450_000,
    dailyOperationsUsd:260_000,description:'Commercial lunar relay and survey-data subscriptions'},
  {level:2,name:'Lunar Logistics Hub',investmentUsd:145e6,dailyRevenueUsd:1_650_000,
    dailyOperationsUsd:510_000,description:'Contracted logistics and precision mapping services'},
  {level:3,name:'Lunar Industrial Campus',investmentUsd:265e6,dailyRevenueUsd:2_600_000,
    dailyOperationsUsd:830_000,description:'Fictional construction, comms and materials licensing'},
] as const;
export function lunarEconomics(level:number){
  if(!Number.isInteger(level)||level<0||level>MOON_BASE_LEVELS.length)
    throw new RangeError('Invalid lunar base level');
  const active=MOON_BASE_LEVELS.slice(0,level);
  return {grossDailyUsd:active.reduce((a,x)=>a+x.dailyRevenueUsd,0),
    expensesDailyUsd:active.reduce((a,x)=>a+x.dailyOperationsUsd,0)};
}
export function dailyEconomics(researchUnlocked:readonly TechnologyId[],moonBaseLevel:number,
  activeFlight=false){
  const lunar=lunarEconomics(moonBaseLevel);
  const researchOperationsUsd=TECHNOLOGIES.filter(t=>researchUnlocked.includes(t.id))
    .reduce((sum,t)=>sum+t.operationalCostUsdPerYear/365,0);
  const flightOperationsUsd=activeFlight?110_000:0;
  const expensesUsd=DAILY_BASE_OPERATIONS_USD+researchOperationsUsd+
    lunar.expensesDailyUsd+flightOperationsUsd;
  const revenueUsd=lunar.grossDailyUsd;
  return {expensesUsd,revenueUsd,netUsd:revenueUsd-expensesUsd,
    baseUsd:DAILY_BASE_OPERATIONS_USD,researchOperationsUsd,flightOperationsUsd,
    lunarOperatingUsd:lunar.expensesDailyUsd,lunarRevenueUsd:lunar.grossDailyUsd};
}
export function advanceProgramDay<T extends {
  day:number;cash:number;researchPoints:number;researchUnlocked:TechnologyId[];
  moonBaseLevel:number;activeStoryRun:unknown;activeMoonCargoRun?:unknown;
  operatingSpentUsd:number;passiveRevenueUsd:number;
}>(game:T,days:number):T{
  if(!Number.isInteger(days)||days<0||days>10000)
    throw new RangeError('Invalid elapsed game days');
  if(!days)return game;
  const costs=dailyEconomics(game.researchUnlocked,game.moonBaseLevel,
    !!(game.activeStoryRun||game.activeMoonCargoRun));
  const earnedRP=Math.floor((game.day-1+days)/RESEARCH_POINT_EVERY_DAYS)-
    Math.floor((game.day-1)/RESEARCH_POINT_EVERY_DAYS);
  return {...game,day:game.day+days,
    cash:game.cash+costs.netUsd*days,
    operatingSpentUsd:game.operatingSpentUsd+costs.expensesUsd*days,
    passiveRevenueUsd:game.passiveRevenueUsd+costs.revenueUsd*days,
    researchPoints:game.researchPoints+earnedRP};
}
