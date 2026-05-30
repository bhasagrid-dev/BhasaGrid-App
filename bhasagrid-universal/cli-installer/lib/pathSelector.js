'use strict';

const chalk    = require('chalk');
const inquirer = require('inquirer');
const path     = require('path');
const os       = require('os');

const DEFAULT_WIN_PATH = 'C:\\Program Files\\BhasaGrid';

async function selectInstallPath() {
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log(chalk.white.bold('  INSTALLATION PATH'));
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log('');
  console.log(chalk.gray(`  Default: ${chalk.white(DEFAULT_WIN_PATH)}`));
  console.log(chalk.gray('  Press ENTER to use default, or type a custom path.'));
  console.log('');

  const { installPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'installPath',
      message: chalk.white('  Install path:'),
      default: DEFAULT_WIN_PATH,
      validate: (v) => v.trim().length > 0 ? true : 'Path cannot be empty.'
    }
  ]);

  const resolved = path.resolve(installPath.trim());
  console.log('');
  console.log(chalk.green(`  ✔  Install path set: ${chalk.white.bold(resolved)}`));
  console.log('');

  return resolved;
}

module.exports = { selectInstallPath };
