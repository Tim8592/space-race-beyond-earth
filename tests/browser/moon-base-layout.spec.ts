import {test,expect} from '@playwright/test';

test('Moon Base cargo manifest stays within its card on desktop, tablet and mobile',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    const key='space-race-v01-save';
    const raw=localStorage.getItem(key);
    if(!raw)throw new Error('Expected initialized campaign save');
    const saved=JSON.parse(raw);
    saved.game.storyCompleted=['observation','lunar'];
    saved.game.cash=600e6;
    saved.game.rocketService='falcon9';
    localStorage.setItem(key,JSON.stringify(saved));
  });
  for(const width of [1280,768,390,320]){
    await page.setViewportSize({width,height:900});
    await page.reload();
    await page.getByRole('tab',{name:'Moon Base'}).click();
    const manifest=page.locator('.moon-cargo-manifest');
    await expect(manifest).toBeVisible();
    await expect(manifest).toContainText('Transfer + lunar descent propellant');
    const metrics=await manifest.evaluate(el=>{
      const bounds=el.getBoundingClientRect();
      const parent=el.closest('.moon-base-economy')!.getBoundingClientRect();
      const children=[...el.children].map(child=>child.getBoundingClientRect());
      return {
        display:getComputedStyle(el).display,
        left:bounds.left,right:bounds.right,
        parentLeft:parent.left,parentRight:parent.right,
        furthestChildRight:Math.max(...children.map(r=>r.right)),
        viewport:document.documentElement.clientWidth
      };
    });
    expect(metrics.display).toBe('block');
    expect(metrics.left).toBeGreaterThanOrEqual(metrics.parentLeft-1);
    expect(metrics.right).toBeLessThanOrEqual(metrics.parentRight+1);
    expect(metrics.furthestChildRight).toBeLessThanOrEqual(metrics.right+1);
    expect(metrics.right).toBeLessThanOrEqual(metrics.viewport+1);
  }
});
