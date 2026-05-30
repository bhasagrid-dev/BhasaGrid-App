#!/usr/bin/env bash
# BhasaGrid Installer Bootstrap — Linux / macOS / Android Termux
# Usage: curl -fsSL https://bhasagrid.in/get | bash

set -e

PURPLE='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
RESET='\033[0m'

echo ""
echo -e "${PURPLE}  ╔══════════════════════════════════════════════╗${RESET}"
echo -e "${PURPLE}  ║        BhasaGrid — Secure. Encrypted.        ║${RESET}"
echo -e "${PURPLE}  ║          CLI Installer Bootstrap             ║${RESET}"
echo -e "${PURPLE}  ╚══════════════════════════════════════════════╝${RESET}"
echo ""

# ── Detect platform ──────────────────────────────────────────────────────────
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
  OS="macos"
elif [[ -d "/data/data/com.termux" ]]; then
  OS="termux"
else
  OS="linux"
fi

echo -e "${GRAY}  Detected platform: ${CYAN}${OS}${RESET}"
echo ""

# ── Check / install Node.js ──────────────────────────────────────────────────
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  echo -e "${GREEN}  ✔ Node.js found: ${NODE_VER}${RESET}"
else
  echo -e "${YELLOW}  Node.js not found. Installing...${RESET}"

  if [[ "$OS" == "termux" ]]; then
    pkg install nodejs -y
  elif [[ "$OS" == "macos" ]]; then
    if command -v brew &>/dev/null; then
      brew install node
    else
      echo -e "${RED}  ✖ Homebrew not found. Install from https://brew.sh then re-run.${RESET}"
      exit 1
    fi
  else
    # Linux — use nvm
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install --lts
  fi

  echo -e "${GREEN}  ✔ Node.js installed.${RESET}"
fi

# ── Install BhasaGrid CLI ────────────────────────────────────────────────────
echo ""
echo -e "${GRAY}  Installing BhasaGrid CLI via npm...${RESET}"
npm install -g bhasagrid --silent
echo -e "${GREEN}  ✔ BhasaGrid CLI installed.${RESET}"

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${PURPLE}  ╔══════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}  ║   ✔  Bootstrap complete!                     ║${RESET}"
echo -e "${PURPLE}  ║                                              ║${RESET}"
echo -e "${CYAN}  ║   Run: bhasagrid --install                   ║${RESET}"
echo -e "${CYAN}  ║        bhasagrid --help                      ║${RESET}"
echo -e "${PURPLE}  ╚══════════════════════════════════════════════╝${RESET}"
echo ""

# Auto-launch installer
bhasagrid --install
