/**
 * AegisMesh QVAC - Offline EVM Shadow-State Sandbox & Balance Delta Simulator
 * 100% Offline execution, deterministic state simulation & Keccak-256 state roots
 */

const { keccak256 } = require('../wdk_vault/keccak256');

class ShadowStateSandbox {
  constructor(initialState = {}) {
    this.initialBalanceUSDT = initialState.balance || 25000.00;
    this.vaultAddress = (initialState.vaultAddress || '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045').toLowerCase();
    
    // Internal shadow ledger state
    this.ledger = {
      accounts: {
        [this.vaultAddress]: {
          balanceUSDT: this.initialBalanceUSDT,
          lockedEscrowUSDT: 0.00,
          nonce: 104,
          allowances: {} // spender -> amount
        }
      },
      blockNumber: 21045920,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Computes deterministic State Root Hash via Keccak-256
   */
  computeStateRoot() {
    const serialized = JSON.stringify(this.ledger.accounts);
    return keccak256(Buffer.from(serialized, 'utf8'));
  }

  /**
   * Simulates a transaction against the shadow ledger without altering live state
   * Returns complete before/after balance and approval delta
   */
  simulateExecution({ action, recipient, amount = 0, calldataDisassembly = null }) {
    const preStateRoot = this.computeStateRoot();
    const vault = this.ledger.accounts[this.vaultAddress];

    const sim = {
      vaultAddress: this.vaultAddress,
      recipient: (recipient || '0x0000000000000000000000000000000000000000').toLowerCase(),
      preState: {
        balanceUSDT: vault.balanceUSDT,
        lockedEscrowUSDT: vault.lockedEscrowUSDT,
        approvalExposure: this._getSpenderApproval(vault, recipient),
        stateRoot: preStateRoot
      },
      postState: {
        balanceUSDT: vault.balanceUSDT,
        lockedEscrowUSDT: vault.lockedEscrowUSDT,
        approvalExposure: 0,
        stateRoot: null
      },
      delta: {
        balanceDeltaUSDt: 0,
        escrowDeltaUSDt: 0,
        approvalExposureText: '$0.00 (No New Exposure)',
        isCriticalExposure: false,
        severity: 'SAFE'
      },
      executionGasEstimate: 21000,
      stateReverted: false,
      revertReason: null
    };

    // Case 1: Infinite Approval Drainer
    if (calldataDisassembly && calldataDisassembly.isInfiniteApproval) {
      sim.delta.approvalExposureText = 'UNLIMITED / INFINITE (2^256 - 1) [CRITICAL EXPOSURE]';
      sim.delta.isCriticalExposure = true;
      sim.delta.severity = 'CRITICAL';
      sim.postState.approvalExposure = '2^256 - 1 (MaxUint256)';
      sim.executionGasEstimate = 45000;
      // In shadow sandbox, unlimited approval creates catastrophic exposure risk
      sim.warning = 'CRITICAL DRAIN RISK: Spender contract granted permission to sweep 100% of vault assets ($' + vault.balanceUSDT.toFixed(2) + ' USDt).';
      
      // Calculate simulated post-state root with the dangerous allowance
      const dummyAccounts = JSON.parse(JSON.stringify(this.ledger.accounts));
      dummyAccounts[this.vaultAddress].allowances[sim.recipient] = 'MaxUint256';
      sim.postState.stateRoot = keccak256(Buffer.from(JSON.stringify(dummyAccounts), 'utf8'));
      return sim;
    }

    // Case 2: Standard Escrow Lock
    if (action === 'ESCROW_LOCK') {
      const lockAmount = parseFloat(amount) || 0;
      if (vault.balanceUSDT < lockAmount) {
        sim.stateReverted = true;
        sim.revertReason = 'INSUFFICIENT_FUNDS: Requested escrow exceeds available vault balance';
        sim.postState.stateRoot = preStateRoot;
        return sim;
      }

      sim.postState.balanceUSDT = parseFloat((vault.balanceUSDT - lockAmount).toFixed(2));
      sim.postState.lockedEscrowUSDT = parseFloat((vault.lockedEscrowUSDT + lockAmount).toFixed(2));
      sim.delta.balanceDeltaUSDt = -lockAmount;
      sim.delta.escrowDeltaUSDt = lockAmount;
      sim.delta.approvalExposureText = `+$${lockAmount.toFixed(2)} USDt (Secured via 24h HTLC)`;
      sim.delta.severity = 'SAFE';
      sim.executionGasEstimate = 65000; // HTLC contract deployment/lock

      const dummyAccounts = JSON.parse(JSON.stringify(this.ledger.accounts));
      dummyAccounts[this.vaultAddress].balanceUSDT = sim.postState.balanceUSDT;
      dummyAccounts[this.vaultAddress].lockedEscrowUSDT = sim.postState.lockedEscrowUSDT;
      sim.postState.stateRoot = keccak256(Buffer.from(JSON.stringify(dummyAccounts), 'utf8'));
      return sim;
    }

    // Case 3: Direct Transfer
    const sendAmount = parseFloat(amount) || 0;
    if (vault.balanceUSDT < sendAmount) {
      sim.stateReverted = true;
      sim.revertReason = 'INSUFFICIENT_FUNDS: Transfer amount exceeds available balance';
      sim.postState.stateRoot = preStateRoot;
      return sim;
    }

    sim.postState.balanceUSDT = parseFloat((vault.balanceUSDT - sendAmount).toFixed(2));
    sim.delta.balanceDeltaUSDt = -sendAmount;
    sim.delta.approvalExposureText = '$0.00 (Zero Allowance Granted)';
    sim.delta.severity = 'SAFE';
    sim.executionGasEstimate = 21000;

    const dummyAccounts = JSON.parse(JSON.stringify(this.ledger.accounts));
    dummyAccounts[this.vaultAddress].balanceUSDT = sim.postState.balanceUSDT;
    sim.postState.stateRoot = keccak256(Buffer.from(JSON.stringify(dummyAccounts), 'utf8'));
    return sim;
  }

  _getSpenderApproval(vault, spender) {
    if (!spender || !vault.allowances[spender.toLowerCase()]) return '$0.00';
    return vault.allowances[spender.toLowerCase()];
  }
}

module.exports = {
  ShadowStateSandbox,
  shadowSandbox: new ShadowStateSandbox()
};
