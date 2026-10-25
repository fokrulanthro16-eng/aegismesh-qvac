/**
 * AegisMesh QVAC - Offline EVM Bytecode & Calldata Disassembler
 * 100% Offline execution, zero external web3 dependencies
 */

const fs = require('fs');
const path = require('path');

// Load offline threat intel
let threatIntel = {};
try {
  const threatPath = path.join(__dirname, '../data/offline_threat_intel.json');
  threatIntel = JSON.parse(fs.readFileSync(threatPath, 'utf8'));
} catch (e) {
  console.warn('[EVM Disassembler] Could not load offline threat intel:', e.message);
}

const SELECTOR_REGISTRY = {
  '0xa9059cbb': {
    name: 'transfer(address to, uint256 value)',
    type: 'ERC20_TRANSFER',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ]
  },
  '0x095ea7b3': {
    name: 'approve(address spender, uint256 value)',
    type: 'ERC20_APPROVE',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' }
    ]
  },
  '0x23b872dd': {
    name: 'transferFrom(address from, address to, uint256 value)',
    type: 'ERC20_TRANSFER_FROM',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ]
  },
  '0xd505accf': {
    name: 'permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
    type: 'EIP2612_PERMIT',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ]
  },
  '0xac9650d8': {
    name: 'multicall(bytes[] data)',
    type: 'MULTICALL_BATCH',
    inputs: [
      { name: 'data', type: 'bytes[]' }
    ]
  },
  '0x1cff79cd': {
    name: 'execute(address to, bytes data, uint256 value)',
    type: 'PROXY_EXECUTE',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'value', type: 'uint256' }
    ]
  }
};

const MAX_UINT256_HEX = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

function toChecksumAddress(address) {
  if (!address || typeof address !== 'string') return address;
  const clean = address.toLowerCase().replace('0x', '');
  if (clean.length !== 40) return address;
  return '0x' + clean;
}

/**
 * Disassembles raw hex transaction payload
 * @param {string} rawCalldata - 0x-prefixed hex string
 * @param {object} options - optional context (e.g., targetToken)
 */
function disassembleCalldata(rawCalldata, options = {}) {
  const normalized = (rawCalldata || '').trim().toLowerCase();
  const hex = normalized.startsWith('0x') ? normalized.slice(2) : normalized;

  if (hex.length < 8) {
    return {
      isValid: false,
      error: 'Calldata too short: minimum 4 bytes (8 hex characters) required for function selector',
      selector: null,
      params: [],
      threatFlags: ['MALFORMED_CALLDATA_UNDERFLOW']
    };
  }

  const selectorHex = '0x' + hex.slice(0, 8);
  const dataPayload = hex.slice(8);
  const registryEntry = SELECTOR_REGISTRY[selectorHex];

  const result = {
    isValid: true,
    rawHex: '0x' + hex,
    selector: selectorHex,
    functionName: registryEntry ? registryEntry.name : 'Unknown / Custom Function (' + selectorHex + ')',
    functionType: registryEntry ? registryEntry.type : 'UNKNOWN_CALLDATA',
    chunks: [],
    params: [],
    threatFlags: [],
    isInfiniteApproval: false,
    drainerSignatureDetected: false,
    decodedSummary: '',
    riskAdditions: 0
  };

  // Split remainder into 32-byte (64 hex char) words
  const words = [];
  for (let i = 0; i < dataPayload.length; i += 64) {
    words.push(dataPayload.slice(i, i + 64));
  }
  result.chunks = words;

  // Process standard ERC20 / Permit selectors
  if (selectorHex === '0xa9059cbb') { // transfer(address to, uint256 value)
    if (words.length >= 2) {
      const recipientRaw = words[0];
      const amountRaw = words[1];
      const recipientAddress = toChecksumAddress('0x' + recipientRaw.slice(24));
      
      let amountBigInt;
      try {
        amountBigInt = BigInt('0x' + amountRaw);
      } catch {
        amountBigInt = BigInt(0);
      }

      const amountFormattedUSDT = (Number(amountBigInt) / 1e6).toFixed(2);

      result.params = [
        {
          name: 'to',
          type: 'address',
          rawHex: '0x' + recipientRaw,
          decoded: recipientAddress,
          isAddress: true
        },
        {
          name: 'value',
          type: 'uint256',
          rawHex: '0x' + amountRaw,
          decoded: amountBigInt.toString(),
          formattedUSDt: amountFormattedUSDT + ' USDt',
          isAmount: true
        }
      ];

      result.decodedSummary = `Direct transfer of ${amountFormattedUSDT} USDt to ${recipientAddress}`;

      // Check recipient against offline threat intel
      checkAddressThreats(recipientAddress, result);
    } else {
      result.threatFlags.push('TRUNCATED_TRANSFER_PAYLOAD');
      result.riskAdditions += 50;
    }
  } else if (selectorHex === '0x095ea7b3') { // approve(address spender, uint256 value)
    if (words.length >= 2) {
      const spenderRaw = words[0];
      // Check word 1 or trailing word for max uint
      let valueRaw = words[1];
      if (words.length > 2) {
        result.threatFlags.push('UNEXPECTED_TRAILING_CALLDATA_WORDS');
        result.riskAdditions += 25;
        // If trailing word is max uint, use it
        for (let w = 1; w < words.length; w++) {
          if (words[w].toLowerCase().startsWith('ffffffffffffffffffffffffff')) {
            valueRaw = words[w];
            break;
          }
        }
      }
      const spenderAddress = toChecksumAddress('0x' + spenderRaw.slice(24));

      const isMaxUint = valueRaw.toLowerCase() === MAX_UINT256_HEX ||
                        valueRaw.toLowerCase().startsWith('ffffffffffffffffffffffffff');

      let amountFormatted = '0 USDt';
      if (isMaxUint) {
        amountFormatted = 'UNLIMITED / INFINITE (2^256 - 1)';
        result.isInfiniteApproval = true;
        result.drainerSignatureDetected = true;
        result.threatFlags.push('CRITICAL: INFINITE_ALLOWANCE_TRAP_DETECTED');
        result.threatFlags.push('BLIND_SIGNING_DRAINER_EXPLOIT');
        result.riskAdditions += 95;
      } else {
        try {
          const valBig = BigInt('0x' + valueRaw);
          amountFormatted = (Number(valBig) / 1e6).toFixed(2) + ' USDt';
        } catch {
          amountFormatted = 'Malformed Value';
        }
      }

      result.params = [
        {
          name: 'spender',
          type: 'address',
          rawHex: '0x' + spenderRaw,
          decoded: spenderAddress,
          isAddress: true
        },
        {
          name: 'value',
          type: 'uint256',
          rawHex: '0x' + valueRaw,
          decoded: isMaxUint ? '2^256 - 1 (MaxUint256)' : amountFormatted,
          formattedUSDt: amountFormatted,
          isCriticalTrap: isMaxUint
        }
      ];

      result.decodedSummary = isMaxUint
        ? `🚨 DANGEROUS: Grants full unlimited permission to ${spenderAddress} to drain all USDt tokens!`
        : `Approval of ${amountFormatted} allowance to ${spenderAddress}`;

      checkAddressThreats(spenderAddress, result);
    } else {
      result.threatFlags.push('TRUNCATED_APPROVE_PAYLOAD');
      result.riskAdditions += 50;
    }
  } else if (selectorHex === '0x23b872dd') { // transferFrom(address from, address to, uint256 value)
    if (words.length >= 3) {
      const fromAddr = toChecksumAddress('0x' + words[0].slice(24));
      const toAddr = toChecksumAddress('0x' + words[1].slice(24));
      const val = BigInt('0x' + words[2]);
      const formatted = (Number(val) / 1e6).toFixed(2);

      result.params = [
        { name: 'from', type: 'address', decoded: fromAddr },
        { name: 'to', type: 'address', decoded: toAddr },
        { name: 'value', type: 'uint256', decoded: formatted + ' USDt' }
      ];
      result.decodedSummary = `TransferFrom ${fromAddr} to ${toAddr} of ${formatted} USDt`;
      checkAddressThreats(toAddr, result);
    }
  } else if (selectorHex === '0xac9650d8' || selectorHex === '0x1cff79cd') {
    result.drainerSignatureDetected = true;
    result.threatFlags.push('UNAUDITED_COMPLEX_PROXY_MULTICALL');
    result.riskAdditions += 75;
    result.decodedSummary = 'High-risk multicall proxy payload detected. Blind execution could drain vault.';
  } else {
    // Unknown selector
    result.threatFlags.push('UNKNOWN_4BYTE_SELECTOR');
    result.riskAdditions += 35;
    result.decodedSummary = `Unrecognized EVM function selector ${selectorHex}. Manual audit required.`;
  }

  return result;
}

function checkAddressThreats(address, resultObj) {
  const cleanAddr = address.toLowerCase();

  // 1. Zero address check
  if (cleanAddr === '0x0000000000000000000000000000000000000000') {
    resultObj.threatFlags.push('ZERO_ADDRESS_BURN_TRAP');
    resultObj.riskAdditions += 90;
    return;
  }

  // 2. Known drainer blacklist
  const drainers = threatIntel.known_drainer_addresses || [];
  if (drainers.map(d => d.toLowerCase()).includes(cleanAddr)) {
    resultObj.threatFlags.push('CONFIRMED_DRAINER_BLACKLISTED_ADDRESS');
    resultObj.drainerSignatureDetected = true;
    resultObj.riskAdditions += 99;
  }

  // 3. Address poisoning check
  const poisoningDB = threatIntel.address_poisoning_db || [];
  for (const item of poisoningDB) {
    if (cleanAddr.startsWith(item.target_prefix.toLowerCase()) && 
        cleanAddr.endsWith(item.target_suffix.toLowerCase()) && 
        cleanAddr !== item.legitimate.toLowerCase()) {
      resultObj.threatFlags.push(item.warning || 'ADDRESS_POISONING_MIMIC_DETECTED');
      resultObj.riskAdditions += 92;
      break;
    }
  }

  // 4. Sanctioned list
  const sanctioned = threatIntel.sanctioned_entities || [];
  for (const s of sanctioned) {
    if (s.address.toLowerCase() === cleanAddr) {
      resultObj.threatFlags.push(`SANCTIONED_ENTITY: ${s.label}`);
      resultObj.riskAdditions += 100;
      break;
    }
  }

  // 5. Check if verified counterparty
  const verified = threatIntel.verified_counterparties || [];
  for (const v of verified) {
    if (v.address.toLowerCase() === cleanAddr) {
      resultObj.isVerifiedCounterparty = true;
      resultObj.verifiedLabel = v.label;
      resultObj.riskAdditions -= 15;
      break;
    }
  }
}

module.exports = {
  disassembleCalldata,
  toChecksumAddress,
  SELECTOR_REGISTRY
};
