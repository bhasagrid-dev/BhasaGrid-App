'use strict';
const chalk = require('chalk');

function showHelp() {
  const purple = chalk.hex('#7C3AED');
  const accent = chalk.hex('#A78BFA');
  console.log('');
  console.log(purple('  ─────────────────────────────────────────────────'));
  console.log(chalk.white.bold('  BhasaGrid CLI  ') + accent('v1.0.0'));
  console.log(purple('  ─────────────────────────────────────────────────'));
  console.log('');
  console.log(chalk.white('  COMMANDS'));
  console.log('');
  console.log(`  ${chalk.cyan('bhasagrid --install')}    Download & install BhasaGrid`);
  console.log(`  ${chalk.cyan('bhasagrid --version')}    Show installed version`);
  console.log(`  ${chalk.cyan('bhasagrid --check')}      Check for updates`);
  console.log(`  ${chalk.cyan('bhasagrid --help')}       Show this help screen`);
  console.log('');
  console.log(chalk.white('  LINKS'));
  console.log('');
  console.log(`  ${chalk.gray('Website  :')} ${chalk.underline.blue('https://bhasagrid.in')}`);
  console.log(`  ${chalk.gray('Support  :')} ${chalk.underline.blue('https://bhasagrid.in/support')}`);
  console.log(`  ${chalk.gray('Terms    :')} ${chalk.underline.blue('https://bhasagrid.in/terms')}`);
  console.log('');
  console.log(purple('  ─────────────────────────────────────────────────'));
  console.log(chalk.gray('  © 2026 BhasaGrid. All rights reserved.'));
  console.log('');
}

module.exports = { showHelp };
