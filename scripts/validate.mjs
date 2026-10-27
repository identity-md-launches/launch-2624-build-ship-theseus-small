import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { once } from 'node:events';
import { createPreview } from './server.mjs';
import { loadPlaywright, loadAxe } from './modules.mjs';

const { chromium, webkit } = await loadPlaywright();
const { default: AxeBuilder } = await loadAxe();
const out = resolve(process.env.VALIDATION_OUT ?? '/tmp/theseus-validation');
await mkdir(out, { recursive: true });
const server = createPreview('/preview/');
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
assert.ok(address && typeof address !== 'string');
const origin = `http://127.0.0.1:${address.port}`;
const base = `${origin}/preview/`;
const results = [];

async function run(name, body) {
  const started = Date.now();
  try {
    const detail = await body();
    results.push({ name, passed: true, durationMs: Date.now() - started, detail });
    console.log(`PASS ${name}${detail ? `: ${detail}` : ''}`);
  } catch (error) {
    results.push({ name, passed: false, durationMs: Date.now() - started, error: error.stack ?? String(error) });
    console.error(`FAIL ${name}: ${error.stack ?? String(error)}`);
  }
}

const materialNames = ['A very long receipt', 'Load-bearing cheese', 'An unfinished scarf', 'The concept of Thursday', 'A secondhand compliment', 'A legally binding absence'];

async function exercise(browserType, name) {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    const captureWarnings = [];
    let capturing = false;
    async function screenshot(options) {
      capturing = true;
      try { return await page.screenshot({ ...options, caret: 'initial' }); }
      finally { capturing = false; }
    }
    const external = [];
    const missing = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      // Playwright 1.56's WebKit screenshotter inserts exactly `body {}` to sync
      // animations. The real page correctly rejects that inline stylesheet.
      // Keep these warnings in the result instead of weakening the site's CSP.
      const captureWarning = "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.";
      if (name === 'webkit' && capturing && message.text() === captureWarning) captureWarnings.push(message.text());
      else errors.push(message.text());
    });
    page.on('requestfailed', (request) => missing.push(request.url()));
    page.on('response', (response) => { if (response.status() >= 400) missing.push(`${response.status()} ${response.url()}`); });
    await context.route('**/*', async (route) => {
      if (new URL(route.request().url()).origin !== origin) {
        external.push(route.request().url());
        await route.abort();
      } else await route.continue();
    });
    await page.goto(base);
    const replace = page.getByRole('button', { name: 'Replace a plank', exact: true });
    const undo = page.getByRole('button', { name: 'Undo last repair' });
    const reset = page.getByRole('button', { name: 'Start over' });
    await replace.waitFor();
    assert.equal(await replace.isEnabled(), true);
    assert.equal(await undo.isDisabled(), true);
    assert.equal(await reset.isDisabled(), true);

    await run(`${name}: mobile first screen and responsive export`, async () => {
      for (const width of [320, 390, 720, 992, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
        const action = await replace.boundingBox();
        assert.ok(action && action.y >= 0 && action.y + action.height <= 844, `Action below fold at ${width}`);
        if (width === 390) {
          const art = await page.locator('#ship-drawing').boundingBox();
          assert.ok(art && art.y + art.height < 844, 'Ship drawing below first screen');
        }
        await screenshot({ path: join(out, `${name}-home-${width}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await screenshot({ path: join(out, `${name}-first-screen-390.png`) });
      return '320, 390, 720, 992, 1440; action visible; entire drawing visible at 390';
    });

    await run(`${name}: keyboard path and visible focus`, async () => {
      await page.reload();
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Skip to content');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'replace');
      assert.equal(await replace.evaluate((el) => el.matches(':focus-visible')), true);
      assert.ok(await replace.evaluate((el) => Number.parseFloat(getComputedStyle(el).outlineWidth) >= 2));
      await screenshot({ path: join(out, `${name}-keyboard-focus.png`) });
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#original-count').textContent(), '5');
      assert.match(await page.getByRole('status').textContent(), /Plank 1 replaced/);
      return 'Tab, skip link, Enter; 2px focus outline; polite repair announcement';
    });

    await run(`${name}: all repairs, completion, undo, reset`, async () => {
      await reset.click();
      for (let index = 0; index < 6; index++) {
        await replace.click();
        assert.equal(await page.locator('#original-count').textContent(), String(5 - index));
        assert.equal(await page.locator('[data-material-name]').nth(index).textContent(), materialNames[index]);
        assert.equal(await page.locator('.plank:not([data-material="wood"])').count(), index + 1);
        assert.match(await page.locator('#ship-title').textContent(), new RegExp(`${index + 1} repair`));
        assert.match(await page.getByRole('status').textContent(), new RegExp(`Plank ${index + 1}`));
      }
      assert.equal(await replace.isDisabled(), true);
      assert.equal(await page.locator('#designation').textContent(), 'Still a ship.');
      assert.match(await page.locator('#replace-hint').textContent(), /Undo a repair or start over/);
      await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== 'running'));
      await screenshot({ path: join(out, `${name}-all-replaced.png`), fullPage: true });
      await undo.click();
      assert.equal(await replace.isEnabled(), true);
      assert.equal(await page.locator('#original-count').textContent(), '1');
      assert.equal(await page.locator('[data-material-name]').nth(5).textContent(), 'Perfectly ordinary wood');
      await reset.click();
      assert.equal(await page.locator('#original-count').textContent(), '6');
      assert.equal(await undo.isDisabled(), true);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'replace');
      return 'all 6 material/visual/status states match; completion is bounded and reversible';
    });

    await run(`${name}: saved state, navigation, and clean static routes`, async () => {
      await replace.click();
      await replace.click();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('theseus.experiment.v1')).repairs), 2);
      await page.reload();
      await page.waitForFunction(() => document.querySelector('#original-count')?.textContent === '4');
      assert.equal(await page.locator('#original-count').textContent(), '4');
      await page.getByRole('link', { name: 'Changelog', exact: true }).click();
      assert.equal(new URL(page.url()).pathname, '/preview/changelog/');
      assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), 'The paper trail.');
      assert.equal(await page.locator('.entry-number').textContent(), '1');
      assert.equal(await page.locator('time').getAttribute('datetime'), '2026-10-27');
      for (const width of [320, 390, 720, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await screenshot({ path: join(out, `${name}-changelog-${width}.png`), fullPage: true });
      }
      await page.getByRole('link', { name: 'Return to the ship' }).click();
      await page.waitForFunction(() => document.querySelector('#original-count')?.textContent === '4');
      assert.equal(await page.locator('#original-count').textContent(), '4');
      await page.goto(`${base}changelog`);
      assert.equal(new URL(page.url()).pathname, '/preview/changelog/');
      await page.getByRole('link', { name: 'The Ship of Theseus, home' }).click();
      await reset.click();
      return 'reload and round trip retain repairs; /changelog redirects to real exported directory';
    });

    await run(`${name}: reduced motion and 200% text enlargement`, async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await replace.click();
      assert.equal(await replace.evaluate((el) => getComputedStyle(el).transitionDuration), '0s');
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize), '32px');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Text enlargement caused overflow');
      await screenshot({ path: join(out, `${name}-enlarged-text.png`), fullPage: true });
      await page.reload();
      await page.waitForFunction(() => !document.querySelector('#reset')?.disabled);
      await reset.click();
      return 'transitions removed; repairs work; 200% root text size reflows (not native browser zoom)';
    });

    if (name === 'chromium') {
      await run('chromium: axe accessibility, both pages and completed state', async () => {
        const scans = [];
        await page.goto(base);
        await page.waitForFunction(() => !document.querySelector('#replace')?.disabled);
        if (await reset.isEnabled()) await reset.click();
        for (const state of ['home', 'complete', 'changelog']) {
          if (state === 'complete') for (let index = 0; index < 6; index++) await replace.click();
          if (state === 'changelog') await page.goto(`${base}changelog/`);
          const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
          scans.push({ state, violations: scan.violations, incomplete: scan.incomplete.map((item) => ({ id: item.id, nodes: item.nodes.length })), passes: scan.passes.length });
        }
        await writeFile(join(out, 'axe.json'), JSON.stringify(scans, null, 2) + '\n');
        for (const scan of scans) assert.equal(scan.violations.length, 0, `${scan.state}: ${scan.violations.map((item) => item.id).join(', ')}`);
        return 'zero violations in 3 scans; automated scan only';
      });
    }

    await run(`${name}: no external requests, application errors, or missing files`, async () => {
      assert.deepEqual(external, []);
      assert.deepEqual(errors, []);
      assert.deepEqual(missing, []);
      return `own-origin static documents/assets only; ${captureWarnings.length} screenshot-only CSP warnings from Playwright's empty stylesheet`;
    });

    await context.close();
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
    });
    await run(`${name}: blocked storage fallback`, async () => {
      const tab = await blocked.newPage();
      await tab.goto(base);
      await tab.getByRole('button', { name: 'Replace a plank', exact: true }).click();
      assert.equal(await tab.locator('#original-count').textContent(), '5');
      assert.match(await tab.locator('#save-note').textContent(), /storage is unavailable/);
      await tab.reload();
      assert.equal(await tab.locator('#original-count').textContent(), '6');
      return 'repairs remain usable; clear notice; no false persistence claim';
    });
    await blocked.close();

    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    await run(`${name}: no-JavaScript fallback`, async () => {
      const tab = await noJS.newPage();
      await tab.goto(base);
      assert.equal(await tab.getByRole('button', { name: 'Replace a plank', exact: true }).isDisabled(), true);
      assert.equal(await tab.locator('noscript').isVisible(), true);
      await tab.getByRole('link', { name: 'Changelog', exact: true }).click();
      assert.match(await tab.title(), /Changelog/);
      return 'ship, explanation and changelog available; repair control honestly disabled';
    });
    await noJS.close();
  } finally {
    await browser.close();
  }
}

try {
  for (const [browserType, name] of [[chromium, 'chromium'], [webkit, 'webkit']]) {
    try { await exercise(browserType, name); }
    catch (error) {
      results.push({ name: `${name}: browser runtime`, passed: false, error: String(error) });
      console.error(`FAIL ${name} runtime: ${String(error)}`);
    }
  }
} finally {
  await new Promise((done) => server.close(done));
  await writeFile(join(out, 'results.json'), JSON.stringify({ results }, null, 2) + '\n');
}
const passed = results.filter((item) => item.passed).length;
console.log(`${passed}/${results.length} checks passed. Evidence: ${out}`);
if (passed !== results.length) process.exitCode = 1;
