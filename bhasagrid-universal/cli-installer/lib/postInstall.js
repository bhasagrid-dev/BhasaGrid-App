'use strict';

const chalk    = require('chalk');
const inquirer = require('inquirer');
const ora      = require('ora');
const { exec } = require('child_process');

async function postInstallOptions(installPath, exePath) {
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log(chalk.white.bold('  INSTALLATION COMPLETE'));
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log('');

  // Electron-style checkboxes
  const { options } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'options',
      message: chalk.white('  Select post-install options:'),
      choices: [
        {
          name: `${chalk.cyan('Launch BhasaGrid now')}`,
          value: 'launch',
          checked: true
        },
        {
          name: `${chalk.cyan('Create Desktop shortcut')}`,
          value: 'desktop',
          checked: true
        },
        {
          name: `${chalk.cyan('Launch BhasaGrid on system startup')}`,
          value: 'startup',
          checked: false
        }
      ]
    }
  ]);

  console.log('');

  // Create desktop shortcut (Windows)
  if (options.includes('desktop')) {
    const spinner = ora({ text: chalk.gray('  Creating desktop shortcut...'), color: 'magenta' }).start();
    try {
      // PowerShell shortcut creation
      const desktop    = require('os').homedir() + '\\Desktop';
      const psCommand  = `$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('${desktop}\\BhasaGrid.lnk'); $s.TargetPath = '${exePath}'; $s.Save()`;
      await runCommand(`powershell -Command "${psCommand}"`);
      spinner.succeed(chalk.green('  Desktop shortcut created'));
    } catch {
      spinner.warn(chalk.yellow('  Could not create shortcut (run as admin if needed)'));
    }
  }

  // Add to startup (Windows registry)
  if (options.includes('startup')) {
    const spinner = ora({ text: chalk.gray('  Adding to startup...'), color: 'magenta' }).start();
    try {
      await runCommand(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v BhasaGrid /t REG_SZ /d "${exePath}" /f`);
      spinner.succeed(chalk.green('  Added to system startup'));
    } catch {
      spinner.warn(chalk.yellow('  Could not add to startup (run as admin if needed)'));
    }
  }

  // Success banner
  console.log('');
  console.log(chalk.hex('#7C3AED')('  ╔══════════════════════════════════════════════════╗'));
  console.log(chalk.hex('#7C3AED')('  ║                                                  ║'));
  console.log(chalk.hex('#7C3AED')('  ║  ') + chalk.green.bold('  ✔  BhasaGrid installed successfully!        ') + chalk.hex('#7C3AED')('║'));
  console.log(chalk.hex('#7C3AED')('  ║                                                  ║'));
  console.log(chalk.hex('#7C3AED')('  ║  ') + chalk.gray(`  Version  : ${chalk.white('v1.0.0')}                            `) + chalk.hex('#7C3AED')('║'));
  console.log(chalk.hex('#7C3AED')('  ║  ') + chalk.gray(`  Location : ${chalk.white(installPath.substring(0, 28))}`) + chalk.hex('#7C3AED')('         ║'));
  console.log(chalk.hex('#7C3AED')('  ║                                                  ║'));
  console.log(chalk.hex('#7C3AED')('  ║  ') + chalk.gray('  → bhasagrid --version     Check version       ') + chalk.hex('#7C3AED')('║'));
  console.log(chalk.hex('#7C3AED')('  ║  ') + chalk.gray('  → bhasagrid --check       Check for updates   ') + chalk.hex('#7C3AED')('║'));
  console.log(chalk.hex('#7C3AED')('  ║  ') + chalk.gray('  → bhasagrid --help        Show all commands   ') + chalk.hex('#7C3AED')('║'));
  console.log(chalk.hex('#7C3AED')('  ║                                                  ║'));
  console.log(chalk.hex('#7C3AED')('  ╚══════════════════════════════════════════════════╝'));
  console.log('');

  // Launch app
  if (options.includes('launch')) {
    console.log(chalk.gray('  Opening BhasaGrid...'));
    await sleep(1000);
    try {
      exec(`"${exePath}"`);
    } catch {
      console.log(chalk.yellow(`  Could not auto-launch. Please open manually:\n  ${exePath}`));
    }
  }

  console.log('');
}

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { postInstallOptions };
