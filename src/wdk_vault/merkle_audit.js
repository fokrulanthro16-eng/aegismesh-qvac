/**
 * AegisMesh QVAC - Cryptographic Merkle Audit Log & Tamper-Proof Reasoning Chain
 * 100% Offline execution, pure Keccak-256 Merkle tree implementation
 * Mathematically binds local QVAC reasoning traces to WDK cryptographic co-signatures
 */

const { keccak256 } = require('./keccak256');

class MerkleAuditTree {
  constructor() {
    this.leaves = [];
    this.auditEntries = [];
    this.root = this._computeEmptyRoot();
  }

  _computeEmptyRoot() {
    return keccak256('AEGISMESH_GENESIS_AUDIT_LOG_2026');
  }

  /**
   * Appends an audit event to the Merkle tree
   */
  appendAuditEntry({ intentHash, calldataDigest, reasoningHash, signatures, riskScore, verdict, metadata = {} }) {
    const timestamp = new Date().toISOString();
    const leafIndex = this.auditEntries.length;

    const auditLeafData = {
      leafIndex,
      timestamp,
      intentHash: intentHash || '0x00',
      calldataDigest: calldataDigest || '0x00',
      reasoningHash: reasoningHash || '0x00',
      signatures: signatures || null,
      riskScore,
      verdict,
      metadata
    };

    // Deterministic leaf hash: Keccak256(leaf payload)
    const leafPayloadString = JSON.stringify(auditLeafData);
    const leafHash = keccak256(Buffer.from(leafPayloadString, 'utf8'));

    this.auditEntries.push(auditLeafData);
    this.leaves.push(leafHash);

    // Recompute Merkle root
    this.root = this._buildTreeAndGetRoot(this.leaves);

    return {
      leafIndex,
      leafHash,
      merkleRoot: this.root,
      totalEntries: this.auditEntries.length,
      timestamp
    };
  }

  _buildTreeAndGetRoot(leafHashes) {
    if (leafHashes.length === 0) return this._computeEmptyRoot();
    if (leafHashes.length === 1) return leafHashes[0];

    let currentLevel = [...leafHashes];

    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = (i + 1 < currentLevel.length) ? currentLevel[i + 1] : left; // Duplicate last if odd
        
        // Combine hashes in lexicographical order for canonical tree
        const combined = left < right ? (left + right.slice(2)) : (right + left.slice(2));
        const parentHash = keccak256(Buffer.from(combined, 'hex'));
        nextLevel.push(parentHash);
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  /**
   * Generates Merkle inclusion proof for a given leaf index
   */
  getProof(leafIndex) {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      return null;
    }

    const proof = [];
    let currentLevel = [...this.leaves];
    let index = leafIndex;

    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = (i + 1 < currentLevel.length) ? currentLevel[i + 1] : left;
        
        if (i === index || i + 1 === index) {
          const sibling = (index % 2 === 0) ? right : left;
          const position = (index % 2 === 0) ? 'right' : 'left';
          proof.push({ position, sibling });
        }

        const combined = left < right ? (left + right.slice(2)) : (right + left.slice(2));
        const parentHash = keccak256(Buffer.from(combined, 'hex'));
        nextLevel.push(parentHash);
      }
      index = Math.floor(index / 2);
      currentLevel = nextLevel;
    }

    return {
      leafHash: this.leaves[leafIndex],
      leafIndex,
      proof,
      merkleRoot: this.root
    };
  }

  getTreeStatus() {
    return {
      merkleRoot: this.root,
      leafCount: this.leaves.length,
      recentEntries: this.auditEntries.slice(-5)
    };
  }
}

module.exports = {
  MerkleAuditTree,
  merkleAuditLogger: new MerkleAuditTree()
};
