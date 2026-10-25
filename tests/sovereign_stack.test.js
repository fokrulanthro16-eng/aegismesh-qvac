/**
 * ============================================================================
 * AEGISMSH QVAC - 3-PILLAR SOVEREIGN STACK AUTOMATED TEST SUITE
 * File: tests/sovereign_stack.test.js
 * ============================================================================
 * Institutional-grade test suite covering:
 * - Pillar 1 (QVAC): EVM bytecode decompiler, Swahili AI Yako synthesis,
 *                    Threat Radar interception of 0x095ea7b3 infinite drainer.
 * - Pillar 2 (WDK):  2-of-2 Dual ECDSA signatures, EIP-712 hashing, HTLC vault,
 *                    State Sandbox delta simulation, and Merkle reasoning chain.
 * - Pillar 3 (Pears): Local P2P swarm packet serialization & Optical QR SVG matrix.
 * ============================================================================
 */

const assert = require('assert');
const { engine, qvacEngine, disassembleCalldata } = require('../src/qvac_core/engine');
const { signer, wdkVault, htlcEngine, merkleAuditLogger, keccak256 } = require('../src/wdk_vault/signer');
const { mesh, localMeshNode, generateQRCodeSVG } = require('../src/pears_p2p/mesh');

async function runSovereignTestSuite() {
  console.log('================================================================================');
  console.log('🛡️  AegisMesh QVAC: Sovereign 3-Pillar Autonomous Test Suite');
  console.log('    Tether "AI Yako: Own Your AI | QVAC Hackathon" - 100% Offline');
  console.log('================================================================================\n');

  let passed = 0;
  let total = 0;

  function runTest(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ [PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] Test ${total}: ${name}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  async function runAsyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] Test ${total}: ${name}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // PILLAR 1: QVAC NEURAL ENGINE & EVM BYTECODE DECOMPILER
  // --------------------------------------------------------------------------
  console.log('--- PILLAR 1: QVAC LOCAL NEURAL ENGINE & EVM DISASSEMBLER ---');

  runTest('Pure Keccak-256 Vector & 4-Byte Selector Verification', () => {
    assert.strictEqual(keccak256(''), '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
    assert.strictEqual(keccak256('transfer(address,uint256)').slice(0, 10), '0xa9059cbb');
    assert.strictEqual(keccak256('approve(address,uint256)').slice(0, 10), '0x095ea7b3');
    assert.strictEqual(keccak256('transferFrom(address,address,uint256)').slice(0, 10), '0x23b872dd');
  });

  runTest('Offline Bytecode Decompiler on Standard Transfer Calldata', () => {
    const calldata = '0xa9059cbb00000000000000000000000071c8364437a9238f156d600934e0a35c2317e667000000000000000000000000000000000000000000000000000000004a817c80';
    const decoded = disassembleCalldata(calldata);
    assert.strictEqual(decoded.selector, '0xa9059cbb');
    assert.strictEqual(decoded.functionType, 'ERC20_TRANSFER');
    assert.strictEqual(decoded.params[0].decoded.toLowerCase(), '0x71c8364437a9238f156d600934e0a35c2317e667');
    assert.strictEqual(decoded.isInfiniteApproval, false);
  });

  await runAsyncTest('English Intent Synthesis for Safe Escrow (Scenario 1)', async () => {
    const prompt = 'Lock 1250 USDt in a 24-hour escrow for supplier 0x71C8364437a9238f156d600934E0a35c2317E667 after invoice check';
    const audit = await engine.auditIntent({ naturalLanguagePrompt: prompt });
    assert.strictEqual(audit.detectedLanguage, 'en-US');
    assert.strictEqual(audit.intentSynthesis.amount, 1250);
    assert.strictEqual(audit.intentSynthesis.action, 'ESCROW_LOCK');
    assert.strictEqual(audit.evmDisassembly.selector, '0xa9059cbb');
    assert.ok(audit.riskAssessment.score <= 15, 'Risk score must be safe');
    assert.strictEqual(audit.aiGuardianCoSignAuthorized, true);
  });

  await runAsyncTest('Swahili "AI Yako" Native Intent Synthesis (Scenario 3)', async () => {
    const promptSw = 'Tuma 50 USDt kwa mfanyabiashara 0x71C8364437a9238f156d600934E0a35c2317E667 kwa usalama';
    const audit = await engine.auditIntent({ naturalLanguagePrompt: promptSw });
    assert.strictEqual(audit.detectedLanguage, 'sw-KE');
    assert.strictEqual(audit.intentSynthesis.amount, 50);
    assert.strictEqual(audit.intentSynthesis.action, 'ESCROW_LOCK');
    assert.strictEqual(audit.aiGuardianCoSignAuthorized, true);
  });

  await runAsyncTest('QVAC Interception of Malicious 0x095ea7b3 Infinite Approval Drainer', async () => {
    const drainerPayload = '0x095ea7b3000000000000000000000000deadbeefdeadbeefdeadbeefdeadbeefdeadbeefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const audit = await engine.auditIntent({
      naturalLanguagePrompt: 'Claim 0 USDt gas refund to verify account balance',
      rawCalldata: drainerPayload
    });

    assert.strictEqual(audit.evmDisassembly.selector, '0x095ea7b3');
    assert.strictEqual(audit.evmDisassembly.isInfiniteApproval, true);
    assert.ok(audit.riskAssessment.score >= 95, 'Must trigger critical threat score >= 95');
    assert.strictEqual(audit.verdict, 'BLOCKED_MALICIOUS');
    assert.strictEqual(audit.aiGuardianCoSignAuthorized, false);
  });

  // --------------------------------------------------------------------------
  // PILLAR 2: TETHER WDK 2-OF-2 MULTISIG, STATE SANDBOX & HTLC VAULT
  // --------------------------------------------------------------------------
  console.log('\n--- PILLAR 2: TETHER WDK SELF-CUSTODIAL VAULT & HTLC ENGINE ---');

  runTest('WDK 2-of-2 Dual ECDSA Co-Signing under Safe QVAC Authorization', () => {
    const fakeSafeAudit = {
      aiGuardianCoSignAuthorized: true,
      verdict: 'SAFE_TO_SIGN',
      riskAssessment: { score: 5, verdict: 'SAFE_TO_SIGN', aiGuardianAuthorized: true },
      reasoningTrace: ['Pre-execution check passed', 'Recipient verified'],
      reasoningTraceHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      evmDisassembly: { rawHex: '0xa9059cbb' }
    };
    const signResult = signer.coSign({
      transactionPayload: {
        action: 'ESCROW_LOCK',
        amount: 1250,
        recipient: '0x71C8364437a9238f156d600934E0a35c2317E667',
        token: 'USDt'
      },
      qvacAuditResult: fakeSafeAudit
    });

    assert.strictEqual(signResult.success, true);
    assert.strictEqual(signResult.status, 'DUAL_COSIGNED_VALIDATED');
    assert.ok(signResult.userSigner.signature.r.length > 0);
    assert.ok(signResult.userSigner.signature.s.length > 0);
    assert.ok(signResult.aiGuardianSigner.signature.fullSignature.startsWith('0x'));
    assert.ok(signResult.merkleAudit.merkleRoot.startsWith('0x'));
  });

  runTest('WDK Co-Signer Refusal & Vault Lock on Malicious Drainer', () => {
    const maliciousAudit = {
      aiGuardianCoSignAuthorized: false,
      verdict: 'BLOCKED_MALICIOUS',
      riskAssessment: { score: 99, verdict: 'BLOCKED_MALICIOUS', aiGuardianAuthorized: false },
      reasoningTrace: ['Critical unlimited allowance trap detected'],
      evmDisassembly: { rawHex: '0x095ea7b3' }
    };

    const lockResult = signer.coSign({
      transactionPayload: { action: 'INFINITE_APPROVE', amount: 0 },
      qvacAuditResult: maliciousAudit
    });

    assert.strictEqual(lockResult.success, false);
    assert.strictEqual(lockResult.status, 'VAULT_LOCK_ENGAGED');
    assert.ok(lockResult.error.includes('AI Guardian Policy Violation'));
  });

  runTest('Pre-Execution State Delta Simulation (Safe Escrow vs. Drainer)', () => {
    // Safe simulation
    const safeSim = engine.simulateState({ action: 'ESCROW_LOCK', amount: 1250 });
    assert.strictEqual(safeSim.preState.balanceUSDT, 25000);
    assert.strictEqual(safeSim.postState.balanceUSDT, 23750);
    assert.strictEqual(safeSim.delta.balanceDeltaUSDt, -1250);
    assert.strictEqual(safeSim.delta.escrowDeltaUSDt, 1250);

    // Malicious drainer simulation
    const drainSim = engine.simulateState({
      action: 'APPROVE',
      amount: 0,
      calldataDisassembly: { isInfiniteApproval: true }
    });
    assert.strictEqual(drainSim.delta.isCriticalExposure, true);
    assert.strictEqual(drainSim.delta.severity, 'CRITICAL');
  });

  runTest('HTLC Offline Voucher Generation & Cryptographic Secret Claim', () => {
    const voucher = signer.createHtlcVoucher({
      sender: '0x10B981F54B3E03411a7eEa1dAc40428E2cDe1462',
      recipient: '0x71C8364437a9238f156d600934E0a35c2317E667',
      amount: 1250,
      timelockHours: 24,
      memo: 'Solar Hardware Escrow'
    });

    assert.strictEqual(voucher.status, 'LOCKED_IN_ESCROW');
    assert.ok(voucher.hashLock.startsWith('0x'));
    assert.ok(voucher.secret.startsWith('0x'));

    // Claim with secret
    const claim = signer.claimHtlcVoucher(voucher.voucherId, voucher.secret);
    assert.strictEqual(claim.success, true);
    assert.strictEqual(claim.proof.revealedSecret, voucher.secret);
  });

  runTest('Merkle Audit Log Reasoning Chain Consistency', () => {
    const root1 = signer.getMerkleRoot();
    assert.ok(root1.startsWith('0x'));
    assert.strictEqual(root1.length, 66); // 32-byte hex with 0x
  });

  // --------------------------------------------------------------------------
  // PILLAR 3: PEARS LOCAL P2P SWARM & OPTICAL AIR-GAP QR STREAMER
  // --------------------------------------------------------------------------
  console.log('\n--- PILLAR 3: PEARS LOCAL P2P SWARM & OPTICAL AIR-GAP QR ---');

  runTest('Pears Local P2P Packet Serialization & Swarm Broadcast', () => {
    const payload = {
      type: 'AEGIS_WDK_VOUCHER_V1',
      voucherId: 'vch_001',
      amount: 1250,
      token: 'USDt',
      hashLock: '0xabcdef'
    };
    const broadcastResult = mesh.broadcast('aegis-mesh-settlements', payload);
    assert.strictEqual(broadcastResult.success, true);
    assert.ok(broadcastResult.packetHash.startsWith('0x'));

    const status = mesh.getStatus();
    assert.ok(status.peersConnected >= 1);
    assert.strictEqual(status.airGapEnforced, true);
  });

  runTest('Optical QR High-Density SVG Generation (Zero-RF Air-Gap)', () => {
    const testData = JSON.stringify({ action: 'EIP712_SIGNATURE', v: 27, r: '0x123', s: '0x456' });
    const svg = mesh.generateOpticalQR(testData, { size: 300 });
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('</svg>'));
    assert.ok(svg.length > 500);
  });

  console.log('\n================================================================================');
  console.log(`🎉 ALL ${passed} / ${total} SOVEREIGN TESTS PASSED PERFECTLY (100% OFFLINE)`);
  console.log('================================================================================\n');
}

if (require.main === module) {
  runSovereignTestSuite().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = { runSovereignTestSuite };
