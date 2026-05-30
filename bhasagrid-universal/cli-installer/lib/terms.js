'use strict';

const chalk = require('chalk');
const inquirer = require('inquirer');

const TERMS_URL   = 'https://bhasagrid.in/terms';
const PRIVACY_URL = 'https://bhasagrid.in/privacy';
const LICENSE_URL = 'https://bhasagrid.in/license';

async function acceptTerms() {
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log(chalk.white.bold('  TERMS & CONDITIONS'));
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log('');
  console.log(chalk.gray('  Before continuing, please review our policies:'));
  console.log('');
  console.log(`  ${chalk.cyan('→')} Terms of Service  : ${chalk.underline.blue(TERMS_URL)}`);
  console.log(`  ${chalk.cyan('→')} Privacy Policy    : ${chalk.underline.blue(PRIVACY_URL)}`);
  console.log(`  ${chalk.cyan('→')} License           : ${chalk.underline.blue(LICENSE_URL)}`);
  console.log('');
  console.log(chalk.gray('  By continuing, you agree to all of the above.'));
  console.log('');
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log('');

  const { accepted } = await inquirer.prompt([
    {
      type: 'input',
      name: 'accepted',
      message: chalk.white('  Do you accept the Terms & Conditions?') + chalk.gray(' (yes/y  no/n):'),
      validate: (input) => {
        const v = input.trim().toLowerCase();
        if (['yes', 'y', 'no', 'n'].includes(v)) return true;
        return chalk.red('Please type yes/y to accept or no/n to decline.');
      }
    }
  ]);

  const v = accepted.trim().toLowerCase();
  if (v === 'no' || v === 'n') {
    console.log('');
    console.log(chalk.red('  ✖  Installation cancelled.'));
    console.log(chalk.gray('     You must accept the Terms & Conditions to use BhasaGrid.\n'));
    process.exit(0);
  }

  console.log('');
  console.log(chalk.green('  ✔  Terms & Conditions accepted.'));
  console.log('');
}

module.exports = { acceptTerms };
