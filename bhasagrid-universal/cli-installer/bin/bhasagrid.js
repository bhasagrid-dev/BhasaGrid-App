#!/usr/bin/env node
'use strict';

const args = process.argv.slice(2);
const command = args[0];

const { showHelp } = require('../lib/help');
const { runInstaller } = require('../lib/installer');
const { checkVersion } = require('../lib/version');
const { checkForUpdates } = require('../lib/updater');

(async () => {
  switch (command) {
    case '--install':
    case 'install':
      await runInstaller();
      break;

    case '--version':
    case '-v':
    case 'version':
      await checkVersion();
      break;

    case '--check':
    case 'check':
      await checkForUpdates();
      break;

    case '--help':
    case '-h':
    case 'help':
    case undefined:
      showHelp();
      break;

    default:
      const chalk = require('chalk');
      console.log(chalk.red(`\n  ✖ Unknown command: ${command}`));
      console.log(chalk.gray(`  Run ${chalk.white('bhasagrid --help')} to see available commands.\n`));
      process.exit(1);
  }
})();
