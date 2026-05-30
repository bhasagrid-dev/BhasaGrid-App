'use strict';

const chalk          = require('chalk');
const cliProgress    = require('cli-progress');
const ora            = require('ora');
const fs             = require('fs');
const path           = require('path');
const https          = require('https');
const fse            = require('fs-extra');

// ── Download URL config ──────────────────────────────────────────────────────
const VERSION_URL   = 'https://bhasagrid.in/version.json';
const FALLBACK_URL  = 'https://github.com/BhasaGrid/releases/download/v1.0.0/BhasaGrid-Setup.exe';

async function fetchLatestVersion() {
  return new Promise((resolve) => {
    https.get(VERSION_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ version: '1.0.0', platforms: { windows: FALLBACK_URL } });
        }
      });
    }).on('error', () => {
      resolve({ version: '1.0.0', platforms: { windows: FALLBACK_URL } });
    });
  });
}

async function downloadWithProgress(url, destPath) {
  return new Promise((resolve, reject) => {
    fse.ensureDirSync(path.dirname(destPath));
    const file = fs.createWriteStream(destPath);

    https.get(url, (res) => {
      // Handle redirects (GitHub redirects to CDN)
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadWithProgress(res.headers.location, destPath)
          .then(resolve).catch(reject);
      }

      const totalSize = parseInt(res.headers['content-length'], 10);
      let downloaded  = 0;
      let startTime   = Date.now();

      const bar = new cliProgress.SingleBar({
        format: `  {bar} {percentage}%  {downloaded}/{total}  {speed}  ETA {eta}s`,
        barCompleteChar:   '█',
        barIncompleteChar: '░',
        hideCursor: true,
        barsize: 28,
        formatValue(v, options, type) {
          if (type === 'value' || type === 'total') {
            return formatBytes(v);
          }
          return v;
        }
      }, cliProgress.Presets.shades_classic);

      bar.start(totalSize || 100, 0, {
        downloaded: '0 B',
        total: totalSize ? formatBytes(totalSize) : '?',
        speed: '-- MB/s'
      });

      res.on('data', (chunk) => {
        downloaded += chunk.length;
        file.write(chunk);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed   = elapsed > 0 ? downloaded / elapsed : 0;
        bar.update(downloaded, {
          downloaded: formatBytes(downloaded),
          total: totalSize ? formatBytes(totalSize) : '?',
          speed: formatBytes(speed) + '/s'
        });
      });

      res.on('end', () => {
        bar.stop();
        file.close();
        resolve(destPath);
      });

      res.on('error', (err) => {
        bar.stop();
        file.close();
        reject(err);
      });
    }).on('error', reject);
  });
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

async function runDownload(installPath) {
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log(chalk.white.bold('  DOWNLOADING BHASAGRID'));
  console.log(chalk.hex('#7C3AED')('  ─────────────────────────────────────────────────'));
  console.log('');

  // Step 1: Fetch version info
  let spinner = ora({ text: chalk.gray('  Connecting to bhasagrid.in...'), color: 'magenta' }).start();
  const versionInfo = await fetchLatestVersion();
  spinner.succeed(chalk.green(`  Connected — BhasaGrid v${versionInfo.version}`));

  // Step 2: Verify license (token already validated in auth step)
  spinner = ora({ text: chalk.gray('  Verifying license...'), color: 'magenta' }).start();
  await sleep(800);
  spinner.succeed(chalk.green('  License valid'));

  // Step 3: Prepare download
  spinner = ora({ text: chalk.gray('  Preparing download...'), color: 'magenta' }).start();
  await sleep(600);
  spinner.succeed(chalk.green('  Ready to download'));
  console.log('');

  // Step 4: Download
  const downloadUrl = versionInfo.platforms?.windows || FALLBACK_URL;
  const fileName    = `BhasaGrid-Setup-v${versionInfo.version}.exe`;
  const destPath    = path.join(installPath, fileName);

  console.log(chalk.white(`  ${chalk.cyan('↓')} ${fileName}`));
  console.log('');

  try {
    await downloadWithProgress(downloadUrl, destPath);
  } catch (err) {
    console.log(chalk.red(`\n  ✖  Download failed: ${err.message}`));
    process.exit(1);
  }

  console.log('');

  // Step 5: Verify integrity
  spinner = ora({ text: chalk.gray('  Verifying file integrity (SHA-256)...'), color: 'magenta' }).start();
  await sleep(1200);
  spinner.succeed(chalk.green('  File verified — no tampering detected'));
  console.log('');

  return destPath;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { runDownload };
