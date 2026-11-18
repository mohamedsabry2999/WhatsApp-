// بيتأكد إن كل إضافة منفصلة في dist/ بتتحمّل في كروم وصفحتها بتفتح من غير أخطاء.
// Run: node scripts/build.js && node tests/standalone.e2e.js
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const DIST = path.resolve(__dirname, '../dist');
const SHOTS = process.env.SHOTS || path.join(os.tmpdir(), 'mt-standalone');
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  let failed = 0;
  for (const name of fs.readdirSync(DIST).sort()) {
    const ext = path.join(DIST, name);
    const m = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8'));
    const ctx = await chromium.launchPersistentContext(path.join(os.tmpdir(), 'mt-sa-' + name + '-' + Date.now()), {
      channel: 'chromium', headless: true, viewport: { width: 1100, height: 760 },
      args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
    });
    const errors = [];
    try {
      let [sw] = ctx.serviceWorkers();
      if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 10000 });
      const id = sw.url().split('/')[2];
      const feat = await sw.evaluate(() => MT_FEATURES);
      const page = await ctx.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
      const isPopup = !!m.action.default_popup;
      if (isPopup) await page.setViewportSize({ width: 360, height: 620 });
      const nextPage = feat.popup === 'notion' ? ctx.waitForEvent('page', { timeout: 8000 }) : null;
      await page.goto(`chrome-extension://${id}/${isPopup ? 'popup.html' : 'app.html#' + feat.home}`).catch((e) => { if (!nextPage) throw e; });
      if (feat.popup === 'notion') {
        // من غير إعدادات Notion: الـ popup بيقفل ويفتح صفحة الإعداد
        const setup = await nextPage;
        await setup.waitForLoadState();
        await setup.waitForTimeout(500);
        const h = await setup.textContent('h1');
        await setup.screenshot({ path: path.join(SHOTS, name + '-setup.png') });
        const ok = h.includes('Notion') && setup.url().endsWith('#notion') && errors.length === 0;
        if (!ok) failed++;
        console.log(`${ok ? 'PASS' : 'FAIL'} ${name.padEnd(18)} popup→setup "${h.trim()}" perms=${m.permissions.join(',')}`);
        await ctx.close();
        continue;
      }
      await page.waitForTimeout(700);
      const title = isPopup ? await page.textContent('#brand') : await page.textContent('h1');
      const upd = await page.$eval('#upd', (a) => a.href).catch(() => '');
      if (!upd.includes(`/update.html?tool=${feat.id}&v=${m.version}`)) errors.push('bad update link: ' + upd);
      const navVisible = isPopup ? 0 : await page.$$eval('#nav a', (as) => as.filter((a) => !a.hidden).length);
      await page.screenshot({ path: path.join(SHOTS, name + '.png') });
      const ok = errors.length === 0 && !!title && (isPopup || feat.tools.length > 1 || navVisible === 1);
      if (!ok) failed++;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${name.padEnd(18)} ${isPopup ? 'popup' : 'page '} "${title.trim()}" perms=${m.permissions.join(',')}${errors.length ? ' ERR: ' + errors.join(' | ') : ''}`);
    } catch (e) {
      failed++;
      console.log(`FAIL ${name}: ${e.message}`);
    }
    await ctx.close();
  }
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();
