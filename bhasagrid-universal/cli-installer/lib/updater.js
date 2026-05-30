'use strict';
const chalk = require('chalk');
const https = require('https');
const pkg   = require('../package.json');

async function checkForUpdates() {
  const spinner_text = chalk.gray('  Checking for updates...');
  process.stdout.write(spinner_text);

  return new Promise((resolve) => {
    https.get('https://bhasagrid.in/version.json', (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        process.stdout.write('\r' + ' '.repeat(spinner_text.length) + '\r');
        try {
          const remote  = JSON.parse(data);
          const current = pkg.version;
          const latest  = remote.version;
          const purple  = chalk.hex('#7C3AED');
          console.log('');
          console.log(purple('  ─────────────────────────────────────────────────'));
          if (current === latest) {
            console.log(chalk.green(`  ✔  You are on the latest version (${current})`));
          } else {
            console.log(chalk.yellow(`  ↑  Update available: ${current} → ${chalk.white.bold(latest)}`));
            console.log(chalk.gray(`     Run ${chalk.white('bhasagrid --install')} to update.`));
          }
          console.log(purple('  ─────────────────────────────────────────────────'));
          console.log('');
        } catch {
          console.log(chalk.red('  ✖  Could not fetch update info.'));
        }
        resolve();
      });
    }).on('error', () => {
      process.stdout.write('\r');
      console.log(chalk.red('  ✖  Network error. Check your connection.\n'));
      resolve();
    });
  });
}

module.exports = { checkForUpdates };
