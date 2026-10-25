/**
 * AegisMesh QVAC - Playwright Video Director & Automation Script
 * Automates recording at 1920x1080 with high-DPI scaling and visual cursor
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const durationsPath = path.join(__dirname, 'audio', 'durations.json');
const durations = JSON.parse(fs.readFileSync(durationsPath, 'utf8'));

const recordingsDir = path.join(__dirname, '..', 'recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

async function recordDemo() {
  console.log('================================================================================');
  console.log('🎬 Launching Automated Playwright Video Director for AegisMesh QVAC');
  console.log('🎥 Resolution: 1920x1080 | Scaling: 2x (4K crispness) | Target: 60 FPS');
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    headless: true, // Headless video recording for maximum FPS and stability
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // Crisp high-DPI rendering
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // Helper to add visual mouse cursor highlighter
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const cursor = document.createElement('div');
      cursor.id = 'playwright-virtual-cursor';
      cursor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.7);
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 12px #10B981, 0 0 20px rgba(16, 185, 129, 0.5);
        pointer-events: none;
        z-index: 999999;
        transition: transform 0.08s ease-out, background 0.15s ease;
        transform: translate(-50%, -50%);
      `;
      document.body.appendChild(cursor);

      document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      });

      document.addEventListener('mousedown', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
        cursor.style.background = 'rgba(6, 182, 212, 0.9)';
      });

      document.addEventListener('mouseup', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.background = 'rgba(16, 185, 129, 0.7)';
      });
    });
  });

  async function smoothClick(selector, pauseAfter = 1000) {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
      const el = await page.$(selector);
      if (el) {
        const box = await el.boundingBox();
        if (box) {
          const x = box.x + box.width / 2;
          const y = box.y + box.height / 2;
          await page.mouse.move(x, y, { steps: 20 });
          await page.waitForTimeout(150);
          await page.mouse.down();
          await page.waitForTimeout(100);
          await page.mouse.up();
          await page.waitForTimeout(pauseAfter);
          return;
        }
      }
      await page.click(selector);
      await page.waitForTimeout(pauseAfter);
    } catch (err) {
      console.warn(`Click warning on ${selector}:`, err.message);
    }
  }

  async function highlightElement(selector, durationMs = 2000, color = '#10B981') {
    await page.evaluate(({ sel, dur, col }) => {
      const el = document.querySelector(sel);
      if (el) {
        const oldBorder = el.style.boxShadow;
        el.style.boxShadow = `0 0 24px 4px ${col}`;
        el.style.transition = 'box-shadow 0.3s ease';
        setTimeout(() => {
          el.style.boxShadow = oldBorder;
        }, dur);
      }
    }, { sel: selector, dur: durationMs, col: color });
    await page.waitForTimeout(durationMs);
  }

  // --------------------------------------------------------------------------
  // SCENE 1: INTRO & 3-PILLAR ARCHITECTURE (~21.86s)
  // --------------------------------------------------------------------------
  console.log(`🎬 [1/5] Recording Scene 1: Intro & Architecture (Target: ${durations.scene1}s)...`);
  const scene1Start = Date.now();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Smooth pan down to Pillar Command Center
  await highlightElement('.telemetry-header', 3000, '#10B981');
  await page.evaluate(() => window.scrollTo({ top: 320, behavior: 'smooth' }));
  await page.waitForTimeout(2500);
  await highlightElement('#card-threat-radar', 3000, '#10B981');
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'smooth' }));
  await page.waitForTimeout(2500);
  await highlightElement('#card-state-sandbox', 3000, '#06B6D4');
  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'smooth' }));
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(1500);

  // Pad to exact scene duration
  const scene1Elapsed = (Date.now() - scene1Start) / 1000;
  if (scene1Elapsed < durations.scene1) {
    await page.waitForTimeout((durations.scene1 - scene1Elapsed) * 1000);
  }
  console.log(`  ✓ Scene 1 recorded (${((Date.now() - scene1Start) / 1000).toFixed(2)}s).`);

  // --------------------------------------------------------------------------
  // SCENE 2: SCENARIO 1 (LEGITIMATE ESCROW) (~25.34s)
  // --------------------------------------------------------------------------
  console.log(`🎬 [2/5] Recording Scene 2: Scenario 1 - Legitimate Escrow (Target: ${durations.scene2}s)...`);
  const scene2Start = Date.now();
  await smoothClick('#btn-scenario-1', 1200);

  // Smooth scroll to input card & run audit
  await page.evaluate(() => window.scrollTo({ top: 150, behavior: 'smooth' }));
  await page.waitForTimeout(1000);
  await smoothClick('#btn-audit', 2500);

  // Show EVM Decompilation & Pre-Execution State Sandbox
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
  await highlightElement('#card-threat-radar', 3000, '#10B981');
  await page.evaluate(() => window.scrollTo({ top: 850, behavior: 'smooth' }));
  await highlightElement('#card-state-sandbox', 3500, '#10B981');

  // Click Co-Sign via WDK
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }));
  await smoothClick('#btn-sign', 2000);

  // Scroll down to WDK Vault & highlight generated signatures
  await page.evaluate(() => window.scrollTo({ top: 1600, behavior: 'smooth' }));
  await highlightElement('#card-wdk-vault', 4000, '#10B981');

  const scene2Elapsed = (Date.now() - scene2Start) / 1000;
  if (scene2Elapsed < durations.scene2) {
    await page.waitForTimeout((durations.scene2 - scene2Elapsed) * 1000);
  }
  console.log(`  ✓ Scene 2 recorded (${((Date.now() - scene2Start) / 1000).toFixed(2)}s).`);

  // --------------------------------------------------------------------------
  // SCENE 3: SCENARIO 2 (MALICIOUS DRAINER TRAP BLOCKED) (~25.06s)
  // --------------------------------------------------------------------------
  console.log(`🎬 [3/5] Recording Scene 3: Scenario 2 - Drainer Blocked (Target: ${durations.scene3}s)...`);
  const scene3Start = Date.now();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(800);
  await smoothClick('#btn-scenario-2', 1200);

  // Run QVAC Audit on the malicious trap
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }));
  await smoothClick('#btn-audit', 2500);

  // Highlight Red Threat Radar (99/100)
  await page.evaluate(() => window.scrollTo({ top: 480, behavior: 'smooth' }));
  await highlightElement('#card-threat-radar', 4000, '#EF4444');

  // Highlight State Sandbox showing UNLIMITED EXPOSURE [CRITICAL]
  await page.evaluate(() => window.scrollTo({ top: 850, behavior: 'smooth' }));
  await highlightElement('#card-state-sandbox', 4500, '#EF4444');

  // Highlight the Locked Vault button
  await page.evaluate(() => window.scrollTo({ top: 220, behavior: 'smooth' }));
  await highlightElement('#btn-sign', 4000, '#EF4444');

  const scene3Elapsed = (Date.now() - scene3Start) / 1000;
  if (scene3Elapsed < durations.scene3) {
    await page.waitForTimeout((durations.scene3 - scene3Elapsed) * 1000);
  }
  console.log(`  ✓ Scene 3 recorded (${((Date.now() - scene3Start) / 1000).toFixed(2)}s).`);

  // --------------------------------------------------------------------------
  // SCENE 4: AIR-GAP KILLER SWITCH, PEARS P2P & DISASTER PAYROLL (~22.25s)
  // --------------------------------------------------------------------------
  console.log(`🎬 [4/5] Recording Scene 4: Air-Gap Switch & Disaster Payroll (Target: ${durations.scene4}s)...`);
  const scene4Start = Date.now();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(800);

  // Toggle Air-Gap Killer Switch in Header
  await smoothClick('#airgap-toggle-btn', 1200);
  await highlightElement('#airgap-status-banner', 2500, '#10B981');

  // Load Scenario 3: Disaster Micro-Payroll
  await smoothClick('#btn-scenario-3', 1200);
  await smoothClick('#btn-audit', 2000);
  await smoothClick('#btn-sign', 1800);

  // Scroll to Pillar C: Pears Local P2P Mesh
  await page.evaluate(() => window.scrollTo({ top: 1950, behavior: 'smooth' }));
  await page.waitForTimeout(1000);

  // Click Broadcast to Pears Local Swarm
  await smoothClick('#btn-pears-swarm', 1500);

  // Click Optical QR Bridge to open high-density QR streamer
  await smoothClick('#btn-optical-bridge', 1000);
  await page.waitForTimeout(3800); // Display optical QR streamer for ~4s
  await smoothClick('#optical-qr-modal .close-modal-btn', 800);

  const scene4Elapsed = (Date.now() - scene4Start) / 1000;
  if (scene4Elapsed < durations.scene4) {
    await page.waitForTimeout((durations.scene4 - scene4Elapsed) * 1000);
  }
  console.log(`  ✓ Scene 4 recorded (${((Date.now() - scene4Start) / 1000).toFixed(2)}s).`);

  // --------------------------------------------------------------------------
  // SCENE 5: INTEL i5-1155G7 BENCHMARK & CODEBASE PROOF (~21.31s)
  // --------------------------------------------------------------------------
  console.log(`🎬 [5/5] Recording Scene 5: Benchmark & Architecture Proof (Target: ${durations.scene5}s)...`);
  const scene5Start = Date.now();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(800);

  // Open Scenario 4: Hardware Benchmark Modal
  await smoothClick('#btn-scenario-4', 1000);
  await page.waitForTimeout(4500); // Showcase benchmark table
  await smoothClick('#benchmark-modal .close-modal-btn', 800);

  // Open Node.js Files & Judge README Modal
  await smoothClick('#btn-readme-code', 1000);
  await page.waitForTimeout(2000);

  // Click through architecture tabs: WDK -> Pears -> README
  await smoothClick('#code-tab-wdk', 2200);
  await smoothClick('#code-tab-pears', 2200);
  await smoothClick('#code-tab-readme', 3500);

  await smoothClick('#codebase-modal .close-modal-btn', 1000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(1500);

  const scene5Elapsed = (Date.now() - scene5Start) / 1000;
  if (scene5Elapsed < durations.scene5) {
    await page.waitForTimeout((durations.scene5 - scene5Elapsed) * 1000);
  }
  console.log(`  ✓ Scene 5 recorded (${((Date.now() - scene5Start) / 1000).toFixed(2)}s).`);

  // Finish Recording
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const recordedPath = await video.path();
  console.log(`\n🎉 High-resolution video recording saved to: ${recordedPath}`);

  // Save metadata
  fs.writeFileSync(path.join(recordingsDir, 'recorded_video.json'), JSON.stringify({
    videoPath: recordedPath,
    recordedAt: new Date().toISOString()
  }, null, 2));

  return recordedPath;
}

if (require.main === module) {
  recordDemo().catch(err => {
    console.error('Recording failed:', err);
    process.exit(1);
  });
}

module.exports = { recordDemo };
