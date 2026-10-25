/**
 * AegisMesh QVAC - Automated High-Resolution Screenshot Capture Pipeline
 * Generates 5 razor-sharp 1920x1080 (2x DPI) screenshots for GitHub README & Docs
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function captureScreenshots() {
  console.log('================================================================================');
  console.log('📸 Launching Automated High-Resolution Screenshot Capture Pipeline');
  console.log('   Target: http://localhost:3000 | Output: docs/screenshots/');
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // 1. Overview Dashboard
  console.log('📷 [1/5] Capturing 01-command-center-overview.png...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(screenshotsDir, '01-command-center-overview.png'),
    fullPage: false
  });
  console.log('  ✓ Captured 01-command-center-overview.png');

  // 2. Scenario 1: Legitimate Escrow Approved & WDK Co-Signed
  console.log('📷 [2/5] Capturing 02-scenario1-wdk-cosigned.png...');
  await page.click('#btn-scenario-1');
  await page.waitForTimeout(600);
  await page.click('#btn-audit');
  await page.waitForTimeout(1500);
  await page.click('#btn-sign');
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(screenshotsDir, '02-scenario1-wdk-cosigned.png'),
    fullPage: false
  });
  console.log('  ✓ Captured 02-scenario1-wdk-cosigned.png');

  // 3. Scenario 2: Phishing Drainer Blocked by Threat Radar (99/100)
  console.log('📷 [3/5] Capturing 03-scenario2-drainer-blocked.png...');
  await page.click('#btn-scenario-2');
  await page.waitForTimeout(600);
  await page.click('#btn-audit');
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo({ top: 350, behavior: 'smooth' }));
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(screenshotsDir, '03-scenario2-drainer-blocked.png'),
    fullPage: false
  });
  console.log('  ✓ Captured 03-scenario2-drainer-blocked.png');

  // 4. Air-Gap Mode + Optical QR Bridge Modal
  console.log('📷 [4/5] Capturing 04-airgap-pears-qr-bridge.png...');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(500);
  await page.click('#btn-scenario-1');
  await page.waitForTimeout(600);
  await page.click('#btn-audit');
  await page.waitForTimeout(1200);
  await page.click('#btn-sign');
  await page.waitForTimeout(1200);
  await page.click('#btn-optical-bridge');
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(screenshotsDir, '04-airgap-pears-qr-bridge.png'),
    fullPage: false
  });
  console.log('  ✓ Captured 04-airgap-pears-qr-bridge.png');
  await page.click('#optical-qr-modal .close-modal-btn');
  await page.waitForTimeout(600);

  // 5. Hardware Benchmark & Architecture Modal
  console.log('📷 [5/5] Capturing 05-hardware-benchmarks-code.png...');
  await page.click('#btn-scenario-4');
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(screenshotsDir, '05-hardware-benchmarks-code.png'),
    fullPage: false
  });
  console.log('  ✓ Captured 05-hardware-benchmarks-code.png');

  await browser.close();
  console.log('\n================================================================================');
  console.log('🎉 All 5 high-resolution screenshots captured and saved to docs/screenshots/');
  console.log('================================================================================\n');
}

if (require.main === module) {
  captureScreenshots().catch(err => {
    console.error('Screenshot capture failed:', err);
    process.exit(1);
  });
}

module.exports = { captureScreenshots };
