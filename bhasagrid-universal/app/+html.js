import React from 'react';

// This file is web-only and customizes the root HTML document in Expo Router.
export default function HTML({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Enforce premium custom domain over default Firebase subdomains */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var host = window.location.hostname;
            if (host.endsWith('.web.app') || host.endsWith('.firebaseapp.com')) {
              var targetDomain = host.includes('web.') ? 'web.bhasagrid.com' : 'bhasagrid.com';
              window.location.replace('https://' + targetDomain + window.location.pathname + window.location.search);
            }
          })();
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
