# University of InnerOrbit: Ecosystem Syllabus

## Course Overview

This syllabus provides a structured curriculum for mastering the InnerOrbit ecosystem. It is designed to take a developer from basic React Native fundamentals to advanced stealth mode architecture and secure communications.

> **Last Updated:** May 2026 — Reflects security hardening, local AI workflows,
> and independent development roadmap.

---

## Chapter 0: Core Foundation Subjects

### Subject 0.1: JavaScript (ES6+) Mastery

- **Topics**: Arrow functions, Template literals, Destructuring, Promises, and Module system (import/export).
- **Concepts**: Scope, Closures, Hoisting, and the Event Loop in Node.js vs. Browser.
- **Related Implementation Examples**:
  - [encryption.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/encryption.ts) (Complex Async/Await and Promises)
  - [auth-service.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/auth-service.js) (Modular function exports)

### Subject 0.2: React & React Native Essentials

- **Topics**: Virtual DOM, Component Lifecycle, Props vs State, and Reconciliation.
- **Subtopics**: Fundamental Hooks (`useState`, `useEffect`, `useContext`, `useRef`).
- **Related Implementation Examples**:
  - [auth-context.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/context/auth-context.js) (Context & provider pattern)
  - [login.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/app/login.js) (State management & Hooks in action)

### Subject 0.3: CSS, Flexbox & Theming Architecture

- **Topics**: Flexbox (Align, Justify, Direction), Absolute vs Relative positioning, and Z-index management.
- **Subtopics**: Design Tokens, Theme-aware styles, and Responsive Scaling.
- **Related Implementation Examples**:
  - [auth.styles.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/styles/auth.styles.js) (Externalized style sheets)
  - [login.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/app/login.js) (Inline responsive styling & platform overrides)

---

## Chapter 1: Foundations of Mobile Architecture

### Subject 1.1: Modern JavaScript & Component Lifecycle

- **Topics**: ES6+ Syntax, Hooks Mastery (`useMemo`, `useCallback`), and Functional Programming.
- **Subtopics**: Closures for Theme management, Async/Await for Firebase/Storage.
- **Related Files**:
  - [utils.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/utils.ts)
  - [auth-context.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/context/auth-context.js) (Provider Logic)

### Subject 1.2: Global State & Context API

- **Topics**: Provider patterns, Context consumers, and Performance optimization.
- **Subtopics**: Avoiding re-render loops in high-frequency data streams.
- **Related Files**:
  - [auth-context.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/context/auth-context.js)

---

## Chapter 2: The Stealth Ecosystem

### Subject 2.1: Calculator Masking Architecture

- **Topics**: Mode Switching, Navigation Hijacking, and Conditional Rendering.
- **Subtopics**: Mathematical evaluation logic vs. Navigation sequences.
- **Related Files**:
  - [Calculator.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/components/Calculator.js)
  - [_layout.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/app/_layout.js) (Root Router)

### Subject 2.2: Leak Prevention & Security Masking

- **Topics**: Notification Suppression, App Preview masking, and Stealth updates.
- **Subtopics**: Background sync isolation in decoy mode.
- **Related Files**:
  - [notification-service.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/notification-service.js)
  - [background-tasks.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/background-tasks.js)

---

## Chapter 3: Security & Cryptography ✅ Updated May 2026

### Subject 3.1: Secure Credential Storage

- **Topics**: Platform Secure Storage (KeyStore/KeyChain), Sync vs Async caching.
- **What changed**: Migrated `deviceKey`, `deviceSalt`, `userPassphrase` from `AsyncStorage` to `expo-secure-store` (hardware-backed). Includes auto-migration for existing users and legacy `@`-prefixed key cleanup.
- **Related Files**:
  - [secure-storage-service.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/secure-storage-service.ts)
  - [encryption.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/encryption.ts) (`getSecureItem` / `setSecureItem` helpers)

### Subject 3.2: The 5-Level Encryption Stack

The app uses a tiered encryption system — each message is encrypted at the **highest level both peers support**:

| Level | Version | Algorithm | Description |
| --- | --- | --- | --- |
| **v5** | Double Ratchet | PQXDH + ML-KEM-768 + AES-256-GCM | Per-message key rotation + Quantum-safe handshake |
| **v4** | Quantum Hybrid | ML-KEM-768 + AES-256-GCM | Post-Quantum encapsulation + symmetric encrypt |
| **v3** | Elite AES-GCM | AES-256-GCM + Argon2id | Authenticated encryption with memory-hard KDF |
| **v2** | AES-GCM | AES-256-GCM + PBKDF2 | Standard authenticated encryption |
| **legacy** | AES-CBC | CryptoJS AES-CBC | Backward-compatible fallback |

- **Related Files**:
  - [encryption.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/encryption.ts)
  - [ratchet.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/ratchet.ts)
  - [crypto-wrapper.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/crypto-wrapper.ts)

### Subject 3.3: Post-Quantum Cryptography (ML-KEM-768 / Kyber768)

- **Topics**: Key Encapsulation Mechanisms (KEM), Lattice-based cryptography, Hybrid key derivation.
- **How it works**:
  - On first message, sender calls `ml_kem768.encapsulate(remotePqcPublicKey)` → gets `cipherText` + `sharedSecret`
  - Receiver calls `ml_kem768.decapsulate(cipherText, ownSecretKey)` → recovers same `sharedSecret`
  - `sharedSecret` is combined with classical ECDH output via SHA-256 → hybrid key
- **Why hybrid**: If quantum computers break Kyber, classical ECDH still protects; if ECDH is broken, Kyber still protects.
- **Related Files**:
  - [crypto-wrapper.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/crypto-wrapper.ts) (`ml_kem768` export)
  - [encryption.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/encryption.ts) (`getPQCKeypair`, `encrypt` v4 path)

### Subject 3.4: Double Ratchet Protocol (v5)

- **Topics**: Signal Protocol, Forward Secrecy, Break-in Recovery (Post-Compromise Security).
- **Two ratchet types**:
  - **DH Ratchet** (asymmetric): Rotates keys each time communication direction changes. Uses X25519 `diffieHellman`.
  - **Symmetric Chain Ratchet**: Rotates keys for every single message in sequence using HMAC-SHA256 (`kdfCK`).
- **KDF chains**:
  - `kdfRK(rootKey, dhOut, pqcSecret?)` — advances the Root Key chain, outputs new Root Key + Chain Key
  - `kdfCK(chainKey)` — advances a sending/receiving chain, outputs next Chain Key + Message Key
- **Out-of-order handling**: Skipped message keys are stored in `skippedMessageKeys` (max 1000) to handle delivery gaps.
- **PQ Extension**: On each DH ratchet step, a new ML-KEM-768 ciphertext (`pqcCt`) is included in the header, keeping Quantum Resistance active throughout the conversation.
- **Related Files**:
  - [ratchet.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/ratchet.ts) (`initializeRatchet`, `ratchetEncrypt`, `ratchetDecrypt`, `dhRatchet`)

### Subject 3.5: Key Derivation Functions (KDF)

- **Topics**: PBKDF2, Argon2id, HKDF patterns, salt management.
- **Argon2id** (Level 3+): Memory-hard password hashing used for user passphrases. Resists GPU/ASIC brute-force.
- **PBKDF2** (Level 2): Iterations increased from `10,000` → `210,000` (OWASP 2024 recommended for SHA-256).
- **SHA-256 as HKDF**: `createHash('sha256').update(pqcSecret).update(classicalKey).digest()` — combines PQC and classical secrets into one hybrid key.
- **Device Keys**: 32-byte random `deviceKey` + 16-byte `deviceSalt` generated once, stored in Secure Enclave.
- **Related Files**:
  - [encryption.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/encryption.ts) (`getDeviceKeys`, `setUserPassphrase`)

### Subject 3.6: Encryption Version Negotiation & Telemetry

- **Topics**: Capability exchange, version resolution, graceful degradation.
- **How it works**: Each peer advertises `EncryptionCapabilities` (`v5: bool`, `minReadable`, `maxWritable`). `resolveSendVersion()` picks the highest mutually supported version.
- **Telemetry**: `sendVersion`, `fallbackReasons`, and `decryptFailures` counters tracked in-memory via `getEncryptionTelemetrySnapshot()` for debugging.
- **Related Files**:
  - [encryption.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/encryption.ts) (`resolveSendVersion`, `normalizeCapabilities`, `DEFAULT_ENCRYPTION_CAPABILITIES`)

### Subject 3.7: Multi-Strategy Decryption & Platform Fallbacks

- **Topics**: Cross-platform compatibility, Web Crypto API (`SubtleCrypto`), CryptoJS fallbacks.
- **Why needed**: Native AES-256-GCM (Node.js `crypto`) behaves differently than browser `SubtleCrypto` and CryptoJS polyfills. Messages encrypted on mobile must still decrypt on web and desktop.
- **Strategy cascade for v3/v4**:
  1. Native GCM with SHA-256 hashed key
  2. Native GCM with raw hex key (legacy)
  3. CryptoJS CTR mode (GCM counter recovery: suffix `02`, `01`, `00`)
  4. CryptoJS CBC mode (last resort legacy)
  5. `SubtleCrypto` (browser-native async, for web only)
- **Web fallback format**: Ciphertext prefixed with `web:` uses CryptoJS AES-CBC with random IV + HMAC-SHA256 integrity tag.
- **Related Files**:
  - [encryption.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/encryption.ts) (`decrypt`, `decryptAsync`)
  - [ratchet.ts](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/ratchet.ts) (`decryptWithKey`)

### Subject 3.8: Firestore Security Rules ✅ Hardened

- **Topics**: Granular access control, Document ownership validation.
- **What changed**: Removed all `|| true` clauses. Conversations now require `request.auth.uid in resource.data.participantIds`. Connection requests scoped to sender/receiver only.
- **Related Files**:
  - [firestore.rules](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/firestore.rules)

### Subject 3.9: Credential Hygiene & Git History

- **Topics**: Removing secrets from version control, orphan branch technique.
- **What changed**: Hardcoded Firebase keys removed from `firebase-config.js`. `google-services.json` added to `.gitignore`. Entire git history replaced with a single clean commit via `git checkout --orphan`.
- **Related Files**:
  - [firebase-config.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/scripts/firebase-config.js)
  - [.gitignore](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/.gitignore)

---

## Chapter 4: Real-time Communication

### Subject 4.1: Real-time Database & Firestore

- **Topics**: NoSQL Schema design, High-frequency listeners, and Pagination.
- **Subtopics**: Optimistic UI updates for instant messaging feedback.
- **Related Files**:
  - [firebase.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/firebase.js)
  - [firestore-service.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/firestore-service.js)

---

## Chapter 5: Advanced UI/UX & Reliability

### Subject 5.1: Dynamic Design System

- **Topics**: Dark/Light mode tokens, Adaptive typography, Haptic feedback.
- **Subtopics**: Glassmorphism and micro-animations in an OLED Black theme.
- **Related Files**:
  - [split-auth-layout.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/components/split-auth-layout.js)
  - [logo-base64.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/logo-base64.js)

### Subject 5.2: Error Boundaries & Debugging

- **Topics**: Global Error Catching, RedBox suppression, Production logging.
- **Related Files**:
  - [suppress-redbox.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/suppress-redbox.js)
  - [logger.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/logger.js)

---

## Chapter 6: Ecosystem & Portals ✅ Updated May 2026

### Subject 6.1: Portal Architecture

- **Topics**: Separation of concerns between the main app and download portals.
- **What changed**: Two clearly separated portals:
  - `download-portal-react/` — Vite/React portal on **port 5173**
  - `download-portal/` — Legacy static Browsersync portal on **port 5679**
- **Related Directories**:
  - [download-portal-react/](file:///c:/InnerOrbit-Mobile-Web-App/download-portal-react/)
  - [download-portal/](file:///c:/InnerOrbit-Mobile-Web-App/download-portal/)

### Subject 6.2: Node.js Backend & Updates

- **Topics**: Administrative functions, APK distribution, updates.json management.
- **Related Directories**:
  - [oracle-server-backend/](file:///c:/InnerOrbit-Mobile-Web-App/oracle-server-backend/)
  - [update-manager.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/update-manager.js)

---

## Chapter 7: Tooling & Development Workflow ✅ Updated May 2026

### Subject 7.1: manager.py — Project CLI

- **Topics**: Python-based CLI managing all builds, deployments, and dev server launches.
- **What changed**:
  - Animated ANSI splash screen with typewriter effect on startup
  - Terminal-choice prompt (current terminal / new window / GUI)
  - Fixed blank terminal bug on GUI launch (`DETACHED_PROCESS` flag)
  - Added `compat`, `gui`, `portal` CLI args
  - Option 18 now correctly launches Vite React portal (was wrongly calling Expo)
- **Related File**:
  - [manager.py](file:///c:/InnerOrbit-Mobile-Web-App/manager.py)

### Subject 7.2: GUI Project Console

- **Topics**: Tkinter-based visual manager as an alternative to the CLI.
- **What changed**:
  - Custom `GradientProgressBar` (blue to purple Canvas gradient)
  - Hover effects on all sidebar buttons
  - Richer dark/light theme color palettes
  - Added missing sidebar sections: Development, full System options
  - Responsive sidebar width binding on resize
- **Related File**:
  - [gui_manager.py](file:///c:/InnerOrbit-Mobile-Web-App/tools/gui/gui_manager.py)

### Subject 7.3: Expo & React Native Infrastructure

- **Topics**: Managed vs Bare workflow, `app.config.js` dynamic configuration, OTA updates.
- **Related Files**:
  - [app.config.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/app.config.js)
  - [package.json](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/package.json)

### Subject 7.4: Electron Desktop Framework

- **Topics**: Main Process, Renderer Process, Preload scripts, IPC.
- **Related Files**:
  - [main.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/desktop/main.js)

---

## Chapter 8: Quality Assurance & Testing ✅ Updated May 2026

### Subject 8.1: Unit Testing with Jest

- **Topics**: Test suites, Expectations, Mocking libraries, and Code Coverage.
- **What changed**: Fixed open handle issue in `network-resilience.js` (timeout IDs now cleared). Added mocks for `expo-secure-store` and `react-native` Platform. All **63 tests pass** across 7 suites.
- **Related Implementation**:
  - [lib/\_\_tests\_\_/](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/__tests__/)
  - [\_\_tests\_\_/integration/](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/__tests__/integration/)

### Subject 8.2: Firebase Integration Testing

- **Topics**: Testing Security Rules, Cloud Function triggers.
- **Related Rules**:
  - [firestore.rules](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/firestore.rules)

---

## Chapter 9: The Art of "Vibe Coding" 🎨

**Vibe Coding** is a modern software development approach where you use natural
language to describe your goals to an AI assistant, which then handles the
generation, refinement, and debugging of the code. You shift from being a
"writer" to a **"Director and Critic."**

### Subject 9.1: The Vibe Coding Workflow

- **Plan → Authorize → Review**: Never let the AI code without a plan. Ask for the "how" first, review the logic, then let it execute.
- **"Source of Truth" Files**: Maintain files like `todo.md` or `vision.md`. When the AI gets lost, point it back to these anchors.
- **Incremental Wins**: Don't ask for a whole feature at once. Ask for small, numbered steps. "Step 1: Create the button. Step 2: Add the logic."
- **Git as an "Undo" Button**: Always commit your code *before* running an AI agent. If the AI breaks your codebase, you can immediately revert.

### Subject 9.2: Community Tips for Success

- **Be "Stupidly Specific"**: Instead of "Make it look good," say "Add 12px border-radius and use a subtle #f5f5f5 shadow."
- **Loop Prevention (The Summary Reset)**: If the AI is stuck fixing the same bug for 3 turns, stop. Ask it to summarize the problem, then start a fresh chat with that summary to reset the context.
- **Strong Typing (TypeScript)**: Using TypeScript is a "superpower" for vibe coding because it generates explicit errors that the AI can easily understand and resolve.
- **AI as a Reviewer**: Use the AI to explain architecture back to you and review your work. If something breaks, provide the error message and ask for a proposed fix.

### Subject 9.3: The "Verified" Checklist

Before accepting AI code, run through this mental checklist:

1. **Security**: Does this introduce `eval()`, unsafe `innerHTML`, or hardcoded secrets?
2. **Side Effects**: Does this change files or state it wasn't supposed to touch?
3. **Complexity**: Did the AI add 50 lines of code for a 5-line problem?
4. **Logic**: Can I explain exactly what every line of this code does?

---

---

## Chapter 10: Safe AI Collaboration (The Privacy Shield) 🛡️

Coding a privacy-focused app like InnerOrbit requires a **Zero Trust** mindset
toward AI tools. You must ensure your unique ideas and user data are never
"leaked" to AI developers.

### Subject 10.1: Protecting Your "Secret Sauce"

- **Obfuscate Core Logic**: Never show the AI the actual math of your unique encryption algorithms. Show it the *interface* and let it write the UI/plumbing around it.
- **The .env Rule**: Keep all API keys and secrets in a `.env` file that is in your `.gitignore`. Never share these in a chat.
- **Zero-Width Character Alert**: Be careful when copy-pasting code from untrusted forums; hidden characters can inject malicious AI instructions.
- **Sanitize Context**: Before using `@codebase` or `@file` commands, ensure you haven't accidentally left credentials or PII in comments or logs.

### Subject 10.2: What AI is Good (and Bad) At

| Task Category | AI Rating | Best Practice |
| :--- | :---: | :--- |
| **Boilerplate & Layout** | ⭐⭐⭐⭐⭐ | Perfect for components and styling. |
| **Unit Testing** | ⭐⭐⭐⭐⭐ | Excellent for writing Jest suites. |
| **Refactoring** | ⭐⭐⭐⭐ | Great for cleaning up messy code. |
| **Security Algos** | ❌ | **Dangerous.** Write these yourself. |
| **Architecture** | ⭐⭐ | Can hallucinate. Cross-verify the plan. |

### Subject 10.3: Preventing Model Training (Privacy First)

- **Platform Opt-Out**:
  - **Cursor**: Go to `Settings` > `General` > `Privacy Mode` (Set to ON).
  - **GitHub Copilot**: Go to `Settings` > `Copilot` > Uncheck "Allow GitHub to use my code snippets for product improvements."
- **Local Inference**: For ultra-sensitive modules, use local models that never send code to the cloud.

### Subject 10.4: Local LLM Power Setup (Privacy Masterclass)

For a truly private environment, use **Continue.dev** or **RooCode** with
**Ollama**:

1. **Install Ollama**: Download from `ollama.com`.
2. **Pull Coding Models**:
   - `ollama pull qwen2.5-coder:7b` (High-quality coding reasoning)
   - `ollama pull deepseek-coder:6.7b` (Excellent alternative)
3. **Setup IDE Extension**:
   - Install **Continue** or **RooCode** in VS Code.
   - Configure it to use your local Ollama models as the backend.
4. **VRAM & Hardware**:
   - 8GB VRAM: Use 7B models with 4-bit quantization (GGUF).
   - 24GB+ VRAM: Can run larger 30B+ models for better logic.

### Subject 10.5: The "Interface-Only" Strategy

When you need help with a sensitive file, don't upload the whole file.
Create a "Skeleton" version:

```javascript
// skeleton-auth.js (What you show the AI)
export const encryptMessage = (plaintext, key) => {
  // TODO: I will implement the AES-GCM logic here locally
  // AI: Please help me write a function that calls this
  // and handles the UI loading state.
};
```

---

## Chapter 11: The Chat Application Blueprint 🏗️

This chapter provides the architectural roadmap for building InnerOrbit.

### Subject 11.1: The 4-Pillar Architecture

1. **Identity (Auth)**: Firebase Auth handles the "Who."
2. **Transport (Firestore)**: Real-time listeners handle the "When."
3. **Privacy (E2EE)**: The Encryption Stack handles the "Security."
4. **Stealth (Masking)**: The Calculator UI handles the "Visibility."

### Subject 11.2: Real-time Sync Patterns

To ensure a "Live" feel:

- Use **Firestore Snapshot Listeners** on the `messages` collection.
- Implement **Optimistic UI**: Append messages to local state *before*
  the server confirms.

### Subject 11.3: Advanced Features for Graduation

- **Persistence**: Use `AsyncStorage` or `SQLite` for offline history.
- **Media Handling**: Securely handle images via Firebase Storage with
  client-side encryption *before* upload.
- **Presence**: Use Realtime Database `.info/connected` to show online status.

### Subject 11.4: Identity Management (Secure Login Logic)

To balance convenience with high security, InnerOrbit implements 4 distinct persistence modes stored via `expo-secure-store`:

1. **Remember Email (Identity)**:
   - **Logic**: Saves only the `last_email`.
   - **User Experience**: App pre-fills the email field, but **requires a password** for every login.
2. **Remember Account**:
   - **Logic**: Saves both `email` and `encrypted_password`.
   - **User Experience**: Full credentials pre-filled.
3. **Secure Identity**:
   - **Logic**: Saves `custom_id` and `hashed_pin`.
   - **User Experience**: Quick-access via a 4-digit PIN pad.
4. **Auto-Login (The "Quick-Start" Toggle)**:
   - **Logic**: A global boolean that triggers `AuthContext.silentSignIn()`.
   - **Condition**: Only functions if the active mode has all required credentials stored.
   - **UI Guard Note**: *"Auto-login skipped: Requirements not met (e.g., Password required)."*

### Subject 11.5: Release Engineering & Stealth Distribution

- **Signed Builds**: Always use `eas build --platform android` for production APKs. Never share debug builds (`expo start`) with end users.
- **Stealth Obfuscation**:
  - Change the **App Icon** to a calculator icon in `app.json`.
  - Set the **Display Name** to "Calculator" or "System Utils" to hide it from the app drawer.
  - Package Name: Use generic names like `com.android.calculator.ext` instead of `com.innerorbit.app`.

---

## Practical Labs & Graduation Tasks

1. **Lab 1**: Create a new secret gesture in [Calculator.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/components/Calculator.js)
   to trigger Stealth mode login without a PIN.
2. **Lab 2**: Implement a "Panic" function in [auth-context.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/context/auth-context.js)
   that wipes [SecureStorage](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/secure-storage-service.ts)
   and triggers a hard reset.
3. **Lab 3**: Optimize [firestore-service.js](file:///c:/InnerOrbit-Mobile-Web-App/innerorbit-universal/lib/firestore-service.js)
   to load messages in groups of 20 with smooth auto-scroll.
4. **Lab 4**: Add a local **Ollama** model and use it via **Continue.dev** to
   refactor a non-sensitive utility function.
5. **Lab 5**: Finalize the "Remember Identity" settings logic to securely
   persist credentials in the platform's KeyChain/KeyStore.

---

*Graduation Objective: Independent development and maintenance of a highly
secure, privacy-first ecosystem.*
