/**
 * ============================================================================
 * PILLAR 2: TETHER WDK AIR-GAPPED 2-OF-2 MULTISIG & HTLC VAULT SIGNER
 * Module: src/wdk_vault/signer.js
 * Project: AegisMesh QVAC - Sovereign Air-Gapped AI Multisig Co-Signer
 * Built for Tether "AI Yako: Own Your AI | QVAC Hackathon"
 * ============================================================================
 * Architecture:
 * - Built around Tether's Wallet Development Kit (@tetherto/wdk self-custody standards)
 * - Pure Node.js native crypto implementation with zero external web3 dependencies
 * - Air-Gapped 2-of-2 multisig threshold:
 *     Key 1: User Sovereign Seed (BIP-44 m/44'/60'/0'/0/0)
 *     Key 2: QVAC AI Guardian Enclave (Offline Secure Subsystem)
 * - Deterministic secp256k1 ECDSA signatures (r, s, v) & EIP-712 structured data hashes
 * - SHA-256 Hash Time Locked Contracts (HTLC) for atomic off-chain settlements
 * - Tamper-proof Merkle Audit Tree binding AI reasoning hashes to wallet signatures
 * ============================================================================
 */

const { WdkSelfCustodySigner, wdkVault } = require('./wdk_signer');
const { HTLCEscrowEngine, htlcEngine } = require('./htlc_vault');
const { MerkleAuditLogger, merkleAuditLogger } = require('./merkle_audit');
const { keccak256, sha256 } = require('./keccak256');

class WdkSovereignSigner {
  constructor(options = {}) {
    this.vault = wdkVault;
    this.htlc = htlcEngine;
    this.auditLogger = merkleAuditLogger;
  }

  /**
   * Co-sign transaction with 2-of-2 dual ECDSA keys if QVAC AI authorizes
   */
  coSign(payload) {
    return this.vault.coSignTransaction(payload);
  }

  /**
   * Creates an offline HTLC settlement voucher with secret pre-image
   */
  createHtlcVoucher(params) {
    return this.htlc.createVoucher(params);
  }

  /**
   * Claims an HTLC settlement voucher offline by revealing secret
   */
  claimHtlcVoucher(voucherId, secret) {
    return this.htlc.claimVoucherWithSecret(voucherId, secret);
  }

  /**
   * Merkle audit log verification
   */
  getMerkleRoot() {
    return this.auditLogger.root || this.auditLogger.getTreeStatus().merkleRoot;
  }

  getProof(leafIndex) {
    return this.auditLogger.getProof(leafIndex);
  }
}

const signer = new WdkSovereignSigner();

module.exports = {
  WdkSovereignSigner,
  signer,
  wdkVault,
  htlcEngine,
  merkleAuditLogger,
  keccak256,
  sha256
};
