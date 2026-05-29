# BhasaGrid Project Operations & Verification Work Log

This log serves as a permanent, high-fidelity ledger of all engineering operations, credential cleanups, script refactorings, configuration adjustments, and Firebase deployments performed on **May 29, 2026**.

---

## 🛠️ Summary of Operations Done Today

### 1. Root & Sub-project Git Rebranding (Kumar Sreyan Pattanayak / BhasaGrid)
* **Objective**: Remove all personal/outdated branding ("InnerOrbit" / "GupShup") and set correct Git identities.
* **Git Local Author Name Updated**: Changed from `Kumar Sreyan Pattanayak` to `BhasaGrid` for branding.
* **Git Local Author Email**: `bhasagrid.dev@gmail.com`
* **Command Verification**: `git config user.name "BhasaGrid"` & `git config user.email "bhasagrid.dev@gmail.com"` executed locally inside `C:\BhasaGrid-Application-Project`.

### 2. Old Credentials & SSH Keys Cleanup
* **Objective**: Safely wipe traces of the deprecated `innerorbit-dev` account without affecting the user's personal `Ksreyan0725` account.
* **Deleted Files**:
  * `C:\Users\sreya\.ssh\id_ed25519_work` (deprecated work SSH private key)
  * `C:\Users\sreya\.ssh\id_ed25519_work.pub` (deprecated work SSH public key)
* **SSH Config Updated**: Cleaned up `C:\Users\sreya\.ssh\config` to map:
  * `github.com-personal` to use `id_ed25519_personal`
  * `github.com-bhasagrid` to use `id_ed25519_bhasagrid`
* **Windows Credential Manager Cleanup**:
  * Deleted `git:https://innerorbit-dev@github.com` cached credentials.
  * Verified that personal credentials (`GitHub - https://api.github.com/Ksreyan0725`) and `id_ed25519_personal` keys are **100% safe and untouched**.

### 3. Firebase Project Cleanup (`bhasagrid` project)
* **Objective**: Reset the reserved Firebase project (`bhasagrid`) to be completely clean and empty for the future mobile web application transfer.
* **Wiped Redirects & Service Worker**: Overwrote the old service worker cache using a clean temporary index file.
* **Disabled Hosting**: Completely disabled Hosting on the `bhasagrid` project so it serves no content and is ready for future app deployment.
  * Command: `firebase hosting:disable --project bhasagrid --force`

### 4. Flexibly Refactoring CLI Manager Script (`manager.py`)
* **Objective**: The manager script was locked to only verify and deploy `bhasagrid-universal`. We made it highly flexible to support both the **Main Application** and the **Download Portal** individually or together.
* **Updated `verify_firebase_project`**: Modified to dynamically accept a target directory (`directory=None`) to correctly read localized `.env` variables and active Firebase CLI project.
* **Updated `deploy_firebase`**:
  * **CLI Mode**: Accepts an optional second parameter: `orbit firebase app`, `orbit firebase portal`, or `orbit firebase both`.
  * **Interactive Console Mode**: Added a beautiful HSL-colored menu allowing developers to select:
    1. Main Application (`bhasagrid-universal`)
    2. Download Portal (`download-portal`)
    3. Both Targets
* **Added Position Parsing**: Expanded `argparse` configuration in `manager.py` to parse an optional second parameter `target` without throwing unrecognized argument errors.

### 5. Dedicated Portal `.env` & Config Sync Resolution
* **Objective**: Fix the authentication failure (`auth/invalid-credential` / Bad Request 400) on the secure download portal.
* **The Root Cause**: The portal was incorrectly receiving the main application's Firebase keys (`innerorbit-bc8ce` project) where the portal user `portal@bhasagrid.app` does not exist.
* **Created Portal `.env`**: Created a dedicated, decoupled environment file at [download-portal/.env](file:///C:/BhasaGrid-Application-Project/download-portal/.env) containing standard `FIREBASE_` variables for the portal project (`innerorbit-portal`).
* **Upgraded `sync_env_to_portal()`**: 
  * Prioritizes the local [download-portal/.env](file:///C:/BhasaGrid-Application-Project/download-portal/.env) file first and falls back to the root `.env`.
  * Generates JS configuration with dynamic portal-key mapping fallbacks.
  * Writes directly to the physical [src/js/firebase-config.js](file:///C:/BhasaGrid-Application-Project/download-portal/src/js/firebase-config.js) to ensure deployments are perfectly configured.
* **Portal Deployment Successful**: Sync'd and deployed the portal cleanly to the Firebase project `innerorbit-portal`, which successfully resolves the login transition.

---

## 📈 Git Commit Ledger (May 29, 2026)

The following table represents the sequential history of commits pushed to the repository today:

| Commit Hash | Exact Date & Timestamp | Author | Commit Message |
| :--- | :--- | :--- | :--- |
| **`80921fed45233bd699d2e708ed06203d886092ef`** | May 29, 2026, 18:43:11 (+0530) | `BhasaGrid` <bhasagrid.dev@gmail.com> | `fix: Correct portal Firebase credentials to use innerorbit-portal project` |
| **`56547a86ea30f13130a4c03bea20d3f58c8d3d51`** | May 29, 2026, 17:13:33 (+0530) | `Ksreyan0725` <161938633+Ksreyan0725@users.noreply.github.com> | `chore: Update Firebase target project configurations` |
| **`2556a1b320e83f04696241ec51d55674f07d6f9a`** | May 29, 2026, 16:06:53 (+0530) | `Ksreyan0725` <161938633+Ksreyan0725@users.noreply.github.com> | `chore: Rebrand InnerOrbit and GupShup to BhasaGrid globally` |

---

## 🔒 Safety and Backup Precautions

> [!IMPORTANT]
> To prevent any accidental data losses or destructive overrides like past `git clean -fdx` or hard resets, we have implemented the following structural guards:
> 
> 1. **Decoupled Local `.env` Stores**: Both the main app `bhasagrid-universal/.env` and the portal `download-portal/.env` are isolated locally. The root `.env` now serves purely as a reference/backup template.
> 2. **Physical Configuration Writing**: Synchronization scripts now physically write configurations to disk before deploying, removing any dependencies on volatile in-memory middleware that might disappear after directory cleanup.
> 3. **Non-destructive Deployments**: Interactive commands verify and warn before executing any remote updates to prevent accidental cross-project overwrites.
