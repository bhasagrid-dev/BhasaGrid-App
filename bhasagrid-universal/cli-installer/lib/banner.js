'use strict';

const chalk = require('chalk');

function printBanner() {
  const purple = chalk.hex('#7C3AED');
  const dim    = chalk.hex('#A78BFA');
  const white  = chalk.white.bold;

  console.log('');
  console.log(purple('  ╔══════════════════════════════════════════════════════╗'));
  console.log(purple('  ║                                                      ║'));
  console.log(purple('  ║  ') + white(' ██████╗ ██╗  ██╗ █████╗ ███████╗ █████╗  ') + purple('  ║'));
  console.log(purple('  ║  ') + white(' ██╔══██╗██║  ██║██╔══██╗██╔════╝██╔══██╗ ') + purple('  ║'));
  console.log(purple('  ║  ') + white(' ██████╔╝███████║███████║███████╗███████║  ') + purple('  ║'));
  console.log(purple('  ║  ') + white(' ██╔══██╗██╔══██║██╔══██║╚════██║██╔══██║  ') + purple('  ║'));
  console.log(purple('  ║  ') + white(' ██████╔╝██║  ██║██║  ██║███████║██║  ██║  ') + purple('  ║'));
  console.log(purple('  ║  ') + white(' ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ') + purple(' ║'));
  console.log(purple('  ║                                                      ║'));
  console.log(purple('  ║  ') + dim('         G  R  I  D                              ') + purple('║'));
  console.log(purple('  ║                                                      ║'));
  console.log(purple('  ║  ') + chalk.gray('       Secure. Encrypted. Private.              ') + purple('║'));
  console.log(purple('  ║  ') + chalk.gray('              Installer  v1.0.0                 ') + purple('║'));
  console.log(purple('  ║                                                      ║'));
  console.log(purple('  ╚══════════════════════════════════════════════════════╝'));
  console.log('');
  console.log(chalk.gray('  © 2026 BhasaGrid. All rights reserved.'));
  console.log('');
}

module.exports = { printBanner };
