# Security Policy & Cryptographic Assurance

## Sovereign Air-Gap Guarantee

AegisMesh QVAC is designed under the **Strict Sovereign Air-Gap Mandate**:
- **0.0 KB/s External Network Activity:** The application code, cryptographic signer, and local AI auditor make **zero** external HTTP/HTTPS, DNS, STUN/TURN, or cloud RPC calls.
- **Zero-CDN Architecture:** All stylesheets, JavaScript runtime logic, and SVG icons are strictly bundled offline. No third-party scripts or CDNs are permitted.
- **Deterministic Key Isolation:** Master private keys are held in local memory during session operations and never transmitted across physical boundaries except via user-mediated optical QR or audio FSK channels.

## Threat Model & Policy

1. **AI Guardian Co-Signing Threshold:**
   Transactions with a computed Threat Score $> 40/100$ will automatically engage the **Vault Lock**. The AI Guardian enclave refuses to issue the secondary ECDSA signature.
2. **State Simulation Required:**
   Prior to signing, every transaction must pass the pre-execution state delta sandbox. Unbounded allowance sweeps (`MaxUint256`) trigger critical exposure flags and immediate revocation of co-signing authorization.
3. **Merkle Reasoning Binding:**
   The AI reasoning trace hash and the transaction digest are bound cryptographically into the Merkle audit tree. Modifying the payload post-audit invalidates the inclusion proof.

## Reporting a Vulnerability

If you discover any vulnerability in the offline cryptographic routines or bytecode decompiler:
1. Do **NOT** file a public GitHub issue.
2. Submit a detailed report with reproduction vectors to: `security@aegismesh.network` (or via private security advisory).
3. We operate a coordinated vulnerability disclosure policy with a 48-hour initial response SLA.
