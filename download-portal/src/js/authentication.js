/**
 * InnerOrbit Authentication Module
 * Handles session verification and security checks.
 */

(function () {
    const AUTH_CONFIG = {
        LOGIN_PAGE: 'index.html'
    };

    /**
     * Main authentication check loop
     */
    function checkAuthentication() {
        // 1. Wait for Firebase Auth to initialize from window.auth (set in firebase-config.js)
        if (!window.auth) {
            console.warn("Waiting for Firebase Auth initialization...");
            setTimeout(checkAuthentication, 100);
            return;
        }

        const path = window.location.pathname;
        const isLoginPage = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('index') || path === '';

        // 2. Listen for authentication state changes (Firebase handles cross-tab sync automatically)
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                // SUCCESS - Authenticated
                console.log("Portal Session: Secure [" + user.email + "]");
                window.ALREADY_AUTHENTICATED = true;
                
                // Unlock UI components
                unlockPortal();

            } else {
                // Not authenticated
                window.ALREADY_AUTHENTICATED = false;
                
                if (!isLoginPage) {
                    console.warn("Access denied: Redirecting to login.");
                    window.location.replace(AUTH_CONFIG.LOGIN_PAGE);
                } else {
                    // We are on login page and logged out - ensure UI is visible to user
                    document.body.style.visibility = 'visible';
                }
            }
        });

        /**
         * Global Logout Handler
         * Used by navigation buttons and session timeouts.
         */
        window.logout = function () {
            console.log("Initiating logout sequence...");
            window.auth.signOut().then(() => {
                // Note: No localStorage needed. Firebase Auth triggers onAuthStateChanged in ALL tabs.
                window.location.href = AUTH_CONFIG.LOGIN_PAGE;
            }).catch(err => {
                console.error("Logout error:", err);
                window.location.href = AUTH_CONFIG.LOGIN_PAGE;
            });
        };
    }

    /**
     * Manages UI state transitions from Login to Portal
     */
    function unlockPortal() {
        const applyStyles = () => {
            // If we are currently transitioning from the login page, 
            // let the transition module handle the view swapping to maintain the background animation.
            if (window.isTransitioning) {
                console.log("Portal Session: Transition in progress, skipping auto-unlock.");
                return;
            }

            // Apply authenticated class for CSS hooks
            document.body.classList.add('authenticated');
            document.body.style.visibility = 'visible';

            // Toggle views
            const loginView = document.getElementById('login-view');
            if (loginView) loginView.style.display = 'none';

            const portalView = document.getElementById('portal-view');
            if (portalView) {
                portalView.style.display = 'block';
                portalView.style.opacity = '1';
                portalView.style.pointerEvents = 'all';
            }
            
            // Notify components (like React/GSAP) that auth is ready
            window.dispatchEvent(new CustomEvent('auth-success'));
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyStyles);
        } else {
            applyStyles();
        }
    }

    // Start initialization
    checkAuthentication();

    /**
     * Failsafe: If authentication logic hangs for > 3s, force visibility 
     * to prevent users from being stuck on a blank screen.
     */
    setTimeout(() => {
        if (!document.body.classList.contains('authenticated') && document.body.style.visibility !== 'visible') {
             console.warn("Authentication failsafe triggered.");
             document.body.style.visibility = 'visible';
        }
    }, 3000);

})();
