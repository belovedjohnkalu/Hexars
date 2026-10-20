// Anonymous production smoke test. Prints only newly created game IDs so a
// developer can remove these exact fixtures afterward; never deletes user data.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'],
    ...(process.env.HTTPS_PROXY ? {proxy: {server: process.env.HTTPS_PROXY}} : {}),
  });
  const context = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
  const page = await context.newPage(), errors = [], ids = new Set(), replies = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', async response => {
    if (!response.url().endsWith('/_api/game') || !response.ok()) return;
    try { const {json} = await response.json(); if (json?.gameId) {ids.add(json.gameId); if(json.lastSearch) replies.push(json.engineId);} } catch { /* Not a game response. */ }
  });
  const link = name => page.getByRole('link', {name, exact: true});
  const ready = () => page.getByRole('status').filter({hasText: 'Your turn'}).waitFor({timeout: 30000});
  async function playTurn() {
    await ready();
    await page.locator('[data-cell][aria-disabled="false"]').first().waitFor();
    const pieces = page.locator('[data-cell][aria-label^="White"]'); let moved = false;
    for (let i=0; i<await pieces.count(); ++i) {
      await pieces.nth(i).click();
      const targets = page.locator('[data-cell][aria-label*=", legal destination"]');
      if (await targets.count()) { await targets.first().click(); moved=true; break; }
    }
    assert.ok(moved, 'A piece must offer a legal move');
    await page.waitForFunction(() => document.querySelector('[data-ply]')?.getAttribute('data-ply')==='2', null, {timeout:30000});
    await ready();
  }
  try {
    await page.goto(process.env.ION_TEST_ORIGIN || 'https://ion.floot.app');
    await link('Hexagonal Chess').click(); await link('Engines').click();
    assert.deepEqual((await page.locator('[data-node-id]').allTextContents()).sort(), ['Defensive','Positional','Tactical']);
    await link('Defensive').focus(); await page.keyboard.press('Enter');
    await link('Beginner').waitFor(); assert.equal(await page.locator('[data-node-id]').count(),6);
    await link('Beginner').click(); await link('Gliński’s Variant').click(); await playTurn();
    await page.getByRole('button',{name:'Undo',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('[data-ply]')?.getAttribute('data-ply')==='0');
    await link('Engines').click(); await link('Positional').click(); await link('Easy').click();
    await playTurn();
    await page.getByRole('button',{name:'Board Reset',exact:true}).click();
    await page.getByRole('button',{name:'Reset board',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('[data-ply]')?.getAttribute('data-ply')==='0');
    await ready(); assert.ok(replies.includes('defensive') && replies.includes('positional'));
    for(const size of [{width:390,height:844},{width:1440,height:1000}]) {
      await page.setViewportSize(size);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      assert.equal(overflow,false);
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,engineReplies:[...new Set(replies)],anonymousGameIds:[...ids],errors}));
  } finally { console.log('QA_IDS '+JSON.stringify([...ids])); await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
