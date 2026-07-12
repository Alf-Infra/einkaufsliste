import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const port = 43106;
const server = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'pipe' });
let browser;

try {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (attempt === 49) throw new Error('Express-Server wurde nicht rechtzeitig bereit');
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    assert.ok(dimensions.scrollWidth <= dimensions.clientWidth, `${width}px: horizontaler Overflow ${dimensions.scrollWidth} > ${dimensions.clientWidth}`);
    await page.getByRole('button', { name: 'Listen öffnen' }).click();
    await page.getByRole('button', { name: 'Listen schließen' }).click();
    await page.getByLabel('Artikel hinzufügen').fill('Milch');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await page.getByRole('button', { name: 'Milch nach oben' }).waitFor({ state: 'visible' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Listen öffnen' }).click();
  const renameTrigger = page.getByRole('button', { name: 'Umbenennen' });
  await renameTrigger.focus();
  await renameTrigger.press('Enter');
  await page.getByRole('dialog', { name: 'Liste umbenennen' }).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await renameTrigger.evaluate((trigger) => document.activeElement === trigger), true, 'Escape gibt den Fokus nicht an Umbenennen zurück');

  await renameTrigger.press('Enter');
  await page.getByRole('dialog', { name: 'Liste umbenennen' }).getByRole('button', { name: 'Abbrechen' }).click();
  assert.equal(await renameTrigger.evaluate((trigger) => document.activeElement === trigger), true, 'Abbrechen gibt den Fokus nicht an Umbenennen zurück');
  console.log('Browsertests: Layout ohne Overflow und reale Fokus-Rückgabe per Escape/Abbrechen');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
