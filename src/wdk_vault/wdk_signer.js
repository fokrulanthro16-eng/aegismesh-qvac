/**
 * AegisMesh QVAC - Tether WDK Self-Custodial Cold Signer & Vault
 * Built on Tether's Wallet Development Kit (@tetherto/wdk) standards
 * Integrates Offline EVM Shadow-State Sandbox & Cryptographic Merkle Audit Log
 * Zero external web3 bloat - Native crypto + pure Keccak-256
 */

const crypto = require('crypto');
const { keccak256 } = require('./keccak256');
const { shadowSandbox } = require('../qvac_engine/state_sandbox');
const { merkleAuditLogger } = require('./merkle_audit');

class WDKColdSigner {
  constructor(config = {}) {
    this.vaultName = config.vaultName || 'AegisMesh Sovereign Cold Vault';
    this.network = config.network || 'Ethereum / Arbitrum Tether USDt';
    this.safetyThreshold = config.safetyThreshold || 40;

    // Initialize deterministic keys for User Cold Key & QVAC Guardian Key
    // using native Node crypto secp256k1
    this.userKeys = this._generateOrDeriveKeyPair('user-cold-seed-aegismesh-master-key-2026');
    this.guardianKeys = this._generateOrDeriveKeyPair('qvac-ai-guardian-sovereign-attestation-key');

    // Local account state tracking for USDt
    this.accountState = {
      address: this.userKeys.address,
      guardianAddress: this.guardianKeys.address,
      balances: {
        'USDt': 25000.00, // Available self-custodial balance in local vault
        'USDt_LOCKED_ESCROW': 0.00
      },
      nonce: 104,
      settlementLedger: []
    };
  }

  /**
   * Deterministic secp256k1 key generation and EVM address derivation
   */
  _generateOrDeriveKeyPair(seedPhrase) {
    const seedBuffer = crypto.pbkdf2Sync(seedPhrase, 'aegismesh-salt', 2048, 32, 'sha512');
    
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(seedBuffer);
    const uncompressedPubKey = ecdh.getPublicKey(); // 65 bytes: 0x04 + 32 bytes X + 32 bytes Y

    const pubKeyWithoutPrefix = uncompressedPubKey.subarray(1);
    const addressHash = keccak256(pubKeyWithoutPrefix);
    const evmAddress = '0x' + addressHash.slice(-40);

    const derPrefix = Buffer.from('302e0201010420', 'hex');
    const derMid = Buffer.from('a00706052b8104000a', 'hex');
    const derSuffix = Buffer.from('a144034200', 'hex');
    const privateKeyDer = Buffer.concat([
      derPrefix,
      seedBuffer,
      derMid,
      derSuffix,
      uncompressedPubKey
    ]);

    const privateKeyObj = crypto.createPrivateKey({
      key: privateKeyDer,
      format: 'der',
      type: 'sec1'
    });

    return {
      address: evmAddress,
      privateKey: privateKeyObj,
      rawPrivateKeyHex: '0x' + seedBuffer.toString('hex'),
      uncompressedPubKeyHex: '0x' + uncompressedPubKey.toString('hex')
    };
  }

  /**
   * Converts ASN.1 DER signature to standard EVM { r, s, v }
   */
  _derToRSV(derSignature, recoveryParam = 27) {
    let offset = 3;
    let rLen = derSignature[offset++];
    let r = derSignature.subarray(offset, offset + rLen);
    offset += rLen + 1;
    let sLen = derSignature[offset++];
    let s = derSignature.subarray(offset, offset + sLen);

    if (r.length === 33 && r[0] === 0) r = r.subarray(1);
    if (s.length === 33 && s[0] === 0) s = s.subarray(1);

    const rHex = '0x' + r.toString('hex').padStart(64, '0');
    const sHex = '0x' + s.toString('hex').padStart(64, '0');

    return {
      r: rHex,
      s: sHex,
      v: recoveryParam,
      fullSignature: rHex + sHex.slice(2) + recoveryParam.toString(16).padStart(2, '0')
    };
  }

  /**
   * Signs a 32-byte digest using secp256k1
   */
  signDigest(digestHex, keyPair, recoveryParam = 27) {
    const cleanDigest = digestHex.startsWith('0x') ? digestHex.slice(2) : digestHex;
    const digestBuf = Buffer.from(cleanDigest, 'hex');

    const sign = crypto.createSign('SHA256');
    sign.update(digestBuf);
    const derSig = sign.sign(keyPair.privateKey);

    return this._derToRSV(derSig, recoveryParam);
  }

  /**
   * 2-of-2 AI Guardian Co-Signing Pipeline
   */
  coSignTransaction({ transactionPayload, qvacAuditResult }) {
    if (!qvacAuditResult) {
      throw new Error('MISSING_QVAC_AUDIT: Transaction cannot be signed without sovereign neural audit.');
    }

    const { score, verdict, aiGuardianAuthorized } = qvacAuditResult.riskAssessment;

    // Run Pre-Execution Offline EVM Shadow-State Sandbox
    const stateSimulation = shadowSandbox.simulateExecution({
      action: transactionPayload.action,
      recipient: transactionPayload.recipient,
      amount: transactionPayload.amount,
      calldataDisassembly: qvacAuditResult.evmDisassembly
    });

    // Enforce 2-of-2 Policy
    if (!aiGuardianAuthorized || score > this.safetyThreshold) {
      // Append blocked attempt to Merkle Audit Log
      const auditEntry = merkleAuditLogger.appendAuditEntry({
        intentHash: keccak256(Buffer.from(JSON.stringify(transactionPayload))),
        calldataDigest: qvacAuditResult.evmDisassembly?.rawHex ? keccak256(qvacAuditResult.evmDisassembly.rawHex) : '0x00',
        reasoningHash: keccak256(Buffer.from(JSON.stringify(qvacAuditResult.reasoningTrace))),
        signatures: null,
        riskScore: score,
        verdict: 'BLOCKED_BY_AI_GUARDIAN',
        metadata: { stateSimulation }
      });

      return {
        success: false,
        status: 'VAULT_LOCK_ENGAGED',
        error: `AI Guardian Policy Violation: Risk score of ${score} exceeds safety threshold of ${this.safetyThreshold}. AI Guardian co-signature refused.`,
        riskScore: score,
        verdict,
        signatures: null,
        stateSimulation,
        merkleAudit: auditEntry
      };
    }

    // Step 1: User Signs Digest
    const txDigest = keccak256(Buffer.from(JSON.stringify(transactionPayload)));
    const userSignature = this.signDigest(txDigest, this.userKeys, 27);

    // Step 2: QVAC AI Guardian Appends Second Signature
    const guardianDigest = keccak256(
      Buffer.from(txDigest + ':QVAC_GUARDIAN_APPROVED:RISK=' + score)
    );
    const guardianSignature = this.signDigest(guardianDigest, this.guardianKeys, 28);

    // Update internal ledger state
    const amount = transactionPayload.amount || 0;
    if (this.accountState.balances['USDt'] >= amount) {
      this.accountState.balances['USDt'] -= amount;
      this.accountState.balances['USDt_LOCKED_ESCROW'] += amount;
      this.accountState.nonce++;
    }

    // Append verified transaction to Merkle Audit Tree
    const reasoningHash = keccak256(Buffer.from(JSON.stringify(qvacAuditResult.reasoningTrace)));
    const auditEntry = merkleAuditLogger.appendAuditEntry({
      intentHash: txDigest,
      calldataDigest: qvacAuditResult.evmDisassembly?.rawHex ? keccak256(qvacAuditResult.evmDisassembly.rawHex) : '0x00',
      reasoningHash,
      signatures: {
        user_r: userSignature.r,
        user_s: userSignature.s,
        guardian_r: guardianSignature.r,
        guardian_s: guardianSignature.s
      },
      riskScore: score,
      verdict,
      metadata: { stateSimulation }
    });

    return {
      success: true,
      status: 'DUAL_COSIGNED_VALIDATED',
      txDigest,
      userSigner: {
        address: this.accountState.address,
        signature: userSignature
      },
      aiGuardianSigner: {
        address: this.accountState.guardianAddress,
        signature: guardianSignature,
        attestation: `Attested Risk Score: ${score}/100. Verdict: ${verdict}`
      },
      stateSimulation,
      merkleAudit: auditEntry,
      rawSignedTxPacket: this._formatVerifiablePacket({
        transactionPayload,
        txDigest,
        userSignature,
        guardianSignature,
        riskScore: score,
        stateSimulation,
        merkleAudit: auditEntry
      })
    };
  }

  _formatVerifiablePacket({ transactionPayload, txDigest, userSignature, guardianSignature, riskScore, stateSimulation, merkleAudit }) {
    return {
      protocol: 'TETHER_WDK_V1_SOVEREIGN',
      version: '1.4.0-deep-tech',
      vaultAddress: this.accountState.address,
      guardianAddress: this.accountState.guardianAddress,
      digest: txDigest,
      payload: transactionPayload,
      signatures: {
        user_r: userSignature.r,
        user_s: userSignature.s,
        user_v: userSignature.v,
        guardian_r: guardianSignature.r,
        guardian_s: guardianSignature.s,
        guardian_v: guardianSignature.v
      },
      dualSignedHex: '0x01' + userSignature.fullSignature.slice(2) + guardianSignature.fullSignature.slice(2),
      riskScoreAtSigning: riskScore,
      stateSimulation: stateSimulation || null,
      merkleAudit: merkleAudit || null,
      signedAt: new Date().toISOString()
    };
  }

  getVaultState() {
    return {
      ...this.accountState,
      safetyThreshold: this.safetyThreshold,
      merkleTreeStatus: merkleAuditLogger.getTreeStatus()
    };
  }
}

module.exports = {
  WDKColdSigner,
  wdkVault: new WDKColdSigner()
};
