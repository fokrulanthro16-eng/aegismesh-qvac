# Contributing to AegisMesh QVAC

Thank you for contributing to AegisMesh QVAC! We welcome institutional-grade contributions, audit improvements, and hardware optimizations.

## Core Development Standards

1. **Strict Zero-CDN Rule:**
   Never introduce `<script src="https://...">` or external font/CSS links. All assets must remain 100% locally bundled.
2. **Deterministic Cryptography:**
   Cryptographic routines must use standard algorithms (Keccak-256, secp256k1, SHA-256) without non-deterministic side effects.
3. **Hardware Constraint Compliance:**
   The entire system must execute comfortably on an Intel Core i5 processor with $\le 250\text{ MB}$ total RAM usage.

## Development Workflow

1. Fork the repository and clone your branch:
   ```bash
   git clone https://github.com/fokrulanthro16-eng/aegismesh-qvac.git
   cd aegismesh-qvac
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the automated test suite:
   ```bash
   npm test
   ```
4. Start the local server:
   ```bash
   npm start
   ```
5. Ensure all 12 sovereign test vectors pass before submitting a pull request.
