/**
 * Pure JavaScript Keccak-256 implementation (EVM standard)
 * 100% Offline execution, exact EVM bytecode and selector compatibility
 */

const RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
];

const RHO = [
  0,  1, 62, 28, 27,
 36, 44,  6, 55, 20,
  3, 10, 43, 25, 39,
 41, 45, 15, 21,  8,
 18,  2, 61, 56, 14
];

const PI = [
  0, 10, 20,  5, 15,
 16,  1, 11, 21,  6,
  7, 17,  2, 12, 22,
 23,  8, 18,  3, 13,
 14, 24,  9, 19,  4
];

function rotl(x, n) {
  const bn = BigInt(n);
  return ((x << bn) | (x >> (64n - bn))) & 0xFFFFFFFFFFFFFFFFn;
}

function keccakF1600(state) {
  for (let round = 0; round < 24; round++) {
    // Theta
    const C = new Array(5);
    for (let x = 0; x < 5; x++) {
      C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    const D = new Array(5);
    for (let x = 0; x < 5; x++) {
      D[x] = C[(x + 4) % 5] ^ rotl(C[(x + 1) % 5], 1);
    }
    for (let i = 0; i < 25; i++) {
      state[i] ^= D[i % 5];
    }

    // Rho and Pi
    const B = new Array(25);
    for (let i = 0; i < 25; i++) {
      B[PI[i]] = rotl(state[i], RHO[i]);
    }

    // Chi
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const idx = y * 5 + x;
        state[idx] = B[idx] ^ ((~B[y * 5 + ((x + 1) % 5)]) & B[y * 5 + ((x + 2) % 5)]);
      }
    }

    // Iota
    state[0] ^= RC[round];
  }
}

function keccak256(data) {
  let buf;
  if (Buffer.isBuffer(data)) {
    buf = data;
  } else if (typeof data === 'string') {
    if (data.startsWith('0x') && data.length % 2 === 0) {
      buf = Buffer.from(data.slice(2), 'hex');
    } else {
      buf = Buffer.from(data, 'utf8');
    }
  } else {
    buf = Buffer.from(data);
  }

  const rate = 136; // 1088 bits / 8
  const state = new Array(25).fill(0n);
  const q = rate - (buf.length % rate);
  const padded = Buffer.alloc(buf.length + q);
  buf.copy(padded);

  if (q === 1) {
    padded[buf.length] = 0x81;
  } else {
    padded[buf.length] = 0x01;
    padded[padded.length - 1] = 0x80;
  }

  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let i = 0; i < rate / 8; i++) {
      state[i] ^= padded.readBigUInt64LE(offset + i * 8);
    }
    keccakF1600(state);
  }

  const out = Buffer.alloc(32);
  for (let i = 0; i < 4; i++) {
    out.writeBigUInt64LE(state[i], i * 8);
  }

  return '0x' + out.toString('hex');
}

module.exports = {
  keccak256
};
