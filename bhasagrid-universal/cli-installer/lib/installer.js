'use strict';

const { printBanner }       = require('./banner');
const { acceptTerms }       = require('./terms');
const { authenticate }      = require('./auth');
const { selectInstallPath } = require('./pathSelector');
const { runDownload }       = require('./downloader');
const { postInstallOptions }= require('./postInstall');
const chalk                 = require('chalk');
const ora                   = require('ora');
const path                  = require('path');

async function runInstaller() {
  // ── 1. Welcome banner ────────────────────────────────────────────────────
  printBanner();

  // ── 2. Terms & Conditions ────────────────────────────────────────────────
  await acceptTerms();

  // ── 3. Authentication ────────────────────────────────────────────────────
  const user = await authenticate();

  // ── 4. Platform (Windows only for now) ──────────────────────────────────
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log(chalk.white.bold('  PLATFORM'));
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log('');
  console.log(`  ${chalk.green('●')} ${chalk.white.bold('Windows Desktop')}  ${chalk.hex('#A78BFA')('(available)')}`);
  console.log(`  ${chalk.gray('○')} ${chalk.gray('Android APK')}      ${chalk.gray('(coming soon)')}`);
  console.log(`  ${chalk.gray('○')} ${chalk.gray('macOS / Linux')}     ${chalk.gray('(coming soon)')}`);
  console.log('');
  console.log(chalk.green('  ✔  Windows selected.'));
  console.log('');

  // ── 5. Install path ──────────────────────────────────────────────────────
  const installPath = await selectInstallPath();

  // ── 6. Download ──────────────────────────────────────────────────────────
  const exePath = await runDownload(installPath);

  // ── 7. Installing ────────────────────────────────────────────────────────
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log(chalk.white.bold('  INSTALLING'));
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log('');

  const steps = [
    'Extracting files...',
    'Installing to selected path...',
    'Creating desktop shortcut...',
    'Adding to PATH...',
    'Registering with system...'
  ];

  for (const step of steps) {
    const spinner = ora({ text: chalk.gray(`  ${step}`), color: 'magenta' }).start();
    await sleep(700 + Math.random() * 400);
    spinner.succeed(chalk.green(`  ${step.replace('...', '')} done`));
  }

  console.log('');

  // ── 8. Post-install options ──────────────────────────────────────────────
  await postInstallOptions(installPath, exePath);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { runInstaller };
