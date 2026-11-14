import { describe, it, expect } from 'vitest';
import { getPowerOutput, POWER_SYSTEMS } from './powerSources';

describe('historical NASA power source benchmarks', () => {
  it('MMRTG yields power and dry mass independent of Sun distance', () => {
    const result = getPowerOutput('mmrtg', 2, 0);
    expect(result.generatedElectricW).toBe(220);
    expect(result.installedGeneratorMassKg).toBe(90);
    expect(result.generatorWasteHeatW).toBeCloseTo(3540);
    expect(getPowerOutput('mmrtg', 2, 10).generatedElectricW).toBeLessThan(220);
  });
  it('does not invent a flight-reactor mass for KRUSTY', () => {
    const demo = getPowerOutput('krusty', 1, 0);
    expect(demo.installedGeneratorMassKg).toBeNull();
    expect(demo.generatorWasteHeatW).toBeNull();
    expect(demo.heritage).toBe('ground-demonstrated');
  });
  it('SNAP-10A is a historical flight demo with an incomplete mass model', () => {
    expect(POWER_SYSTEMS.snap10a.heritage).toBe('flight-demonstrated');
    expect(POWER_SYSTEMS.snap10a.note).toContain('UNshielded');
  });
  it('rejects nonphysical unit count and mission life', () => {
    expect(() => getPowerOutput('mmrtg', -1, 0)).toThrow(RangeError);
    expect(() => getPowerOutput('mmrtg', 1, -1)).toThrow(RangeError);
  });
});
