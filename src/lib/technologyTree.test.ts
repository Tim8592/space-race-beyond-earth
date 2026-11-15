import {describe,it,expect} from 'vitest';
import {TECHNOLOGIES,canResearch,hasTechnology,researchDiscount,missionRiskSummary} from './technologyTree';
describe('research and risk economics',()=>{
  it('requires prerequisites, available cash and a purchased node',()=>{
    expect(canResearch('advanced-ion',[],100_000_000)).toBe(false);
    expect(canResearch('advanced-ion',['ion-electric'],100_000_000)).toBe(true);
    expect(canResearch('advanced-ion',['ion-electric'],1_000_000)).toBe(false);
  });
  it('temporary developer unlock does not mutate the permanent research tree',()=>{
    const saved:string[]=[];
    expect(hasTechnology('fission-power',[],false)).toBe(false);
    expect(hasTechnology('fission-power',[],true)).toBe(true);
    expect(saved).toHaveLength(0);
  });
  it('discount starts only after production research or developer mode',()=>{
    expect(researchDiscount([],false)).toBe(0);
    expect(researchDiscount(['production-line'],false)).toBe(.12);
    expect(researchDiscount([],true)).toBe(.12);
  });
  it('scientific fiction/risk scores are not a fabricated NASA failure probability',()=>{
    const r=missionRiskSummary({powerMarginW:0,thermalMarginW:-100,
      massMarginKg:20,moneyMarginUsd:1e6,generatorClass:'fission',hasConceptTech:true});
    expect(r.level).toBe('High');
    expect(r.drivers.length).toBe(3);
  });
  it('every research prerequisite references a real technology',()=>{
    const ids=TECHNOLOGIES.map(x=>x.id);
    for(const t of TECHNOLOGIES)for(const dep of t.prerequisites)expect(ids).toContain(dep);
  });
});
