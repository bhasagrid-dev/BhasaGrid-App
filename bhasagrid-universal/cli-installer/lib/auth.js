'use strict';

const chalk    = require('chalk');
const inquirer = require('inquirer');
const fetch    = require('node-fetch');

// Firebase REST API — BhasaGrid Portal project (innerorbit-portal)
const FIREBASE_API_KEY = process.env.BHASAGRID_FIREBASE_API_KEY || 'AIzaSyBZIRJuQ4Ltn_c8ciqykG5KUvHXSFzTy_w';
const SIGNIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

const SIGNUP_URL = 'https://bhasagrid.in/signup';
const RESET_URL  = 'https://bhasagrid.in/reset';

async function authenticate() {
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log(chalk.white.bold('  SIGN IN TO YOUR BHASAGRID ACCOUNT'));
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log('');
  console.log(chalk.gray('  Your BhasaGrid account links this install to your'));
  console.log(chalk.gray('  encrypted identity. New user? Create an account at:'));
  console.log(`  ${chalk.cyan('→')} ${chalk.underline.blue(SIGNUP_URL)}`);
  console.log('');

  let user = null;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  while (!user && attempts < MAX_ATTEMPTS) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: chalk.white('  Email    :'),
        validate: (v) => v.includes('@') ? true : 'Please enter a valid email address.'
      },
      {
        type: 'password',
        name: 'password',
        message: chalk.white('  Password :'),
        mask: '•',
        validate: (v) => v.length >= 6 ? true : 'Password must be at least 6 characters.'
      }
    ]);

    console.log('');
    process.stdout.write(chalk.gray('  ⠸ Authenticating...'));

    try {
      const res = await fetch(SIGNIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: answers.email,
          password: answers.password,
          returnSecureToken: true
        })
      });

      const data = await res.json();

      if (data.idToken) {
        process.stdout.write('\r');
        console.log(chalk.green(`  ✔  Authenticated as ${chalk.white.bold(answers.email)}`));
        console.log(chalk.green('  ✔  License verified — BhasaGrid account active'));
        console.log('');
        user = { email: answers.email, token: data.idToken };
      } else {
        process.stdout.write('\r');
        attempts++;
        const remaining = MAX_ATTEMPTS - attempts;
        console.log(chalk.red(`  ✖  Invalid credentials.${remaining > 0 ? ` ${remaining} attempt(s) remaining.` : ''}`));
        if (remaining > 0) {
          console.log(chalk.gray(`     Forgot your password? ${chalk.underline.blue(RESET_URL)}\n`));
        }
      }
    } catch (err) {
      process.stdout.write('\r');
      console.log(chalk.red('  ✖  Network error. Please check your internet connection.\n'));
      attempts++;
    }
  }

  if (!user) {
    console.log(chalk.red('\n  ✖  Too many failed attempts. Installation cancelled.\n'));
    process.exit(1);
  }

  return user;
}

module.exports = { authenticate };
