/**
 * Last Updated: 2026-05-30
 * Purpose: Post-build cleanup for Web/Firebase deployments. Standardizes script types in index.html
 * to 'module' to support modern ESM output common in Expo 54+ builds and injects premium domain redirects.
 */
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // 1. Inject Premium Domain Redirection Script (Hardcoded specifically for Web client)
  const redirectScript = `
    <script>
      // Enforce premium custom domain over default Firebase subdomains
      (function() {
        var host = window.location.hostname;
        var redirectMap = {
          'innerorbit-bc8ce.web.app': 'https://web.bhasagrid.com',
          'innerorbit-bc8ce.firebaseapp.com': 'https://web.bhasagrid.com',
          
        };
        if (redirectMap[host]) {
          window.location.replace(redirectMap[host] + window.location.pathname + window.location.search + window.location.hash);
        }
      })();
    </script>
  `;
  
  if (!html.includes('Enforce premium custom domain')) {
    html = html.replace('<head>', '<head>' + redirectScript);
    console.log('✅ Injected premium domain redirect script in dist/index.html');
  }

  // 2. Add type="module" to entry script tags
  // Required because Metro Web in Expo 54+ often outputs ESM (using import.meta)
  html = html.replace(/<script src/g, '<script type="module" src');

  fs.writeFileSync(indexPath, html);
  console.log('✅ Fixed paths and script types in dist/index.html');
} else {
  console.error('❌ Could not find dist/index.html to fix paths.');
  process.exit(1);
}
