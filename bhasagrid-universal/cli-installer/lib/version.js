'use strict';
const chalk = require('chalk');
const pkg   = require('../package.json');

function checkVersion() {
  const purple = chalk.hex('#7C3AED');
  console.log('');
  console.log(purple('  ─────────────────────────────────────────────────'));
  console.log(`  ${chalk.white('BhasaGrid CLI')}  ${chalk.hex('#A78BFA')(pkg.version)}`);
  console.log(`  ${chalk.gray('© 2026 BhasaGrid. All rights reserved.')}`);
  console.log(`  ${chalk.gray('bhasagrid.in')}`);
  console.log(purple('  ─────────────────────────────────────────────────'));
  console.log('');
}

module.exports = { checkVersion };
