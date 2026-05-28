/**
 * Login Transition Module
 * Handles form validation, lockout logic, and initial success animations.
 */

(function () {
    const form = document.getElementById('passwordForm');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');

    // sha256 function moved to js/crypto-utils.js

    /* Password visibility toggle */
    if (passwordToggle) {
        passwordToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;

            if (type === 'text') {
                passwordToggle.innerHTML = `
                    <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                passwordToggle.innerHTML = `
                    <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    }

    /* Enter key support */
    passwordInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            submitBtn.click();
        }
    });

    const MAX_ATTEMPTS = 3;

    /* Form Submission */
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const DEBUG_DISABLE_LOCKOUT = true; // Set to true to disable lockout during testing

        const lockoutTimestamp = localStorage.getItem('lockoutTimestamp');
        if (!DEBUG_DISABLE_LOCKOUT && lockoutTimestamp && (Date.now() - parseInt(lockoutTimestamp) < 30000)) {
            window.location.href = '404.html?error=locked';
            return;
        }

        const enteredPassword = passwordInput.value.trim();
        
        // Configuration for portal auth
        const PORTAL_EMAIL = 'portal@innerorbit.app'; // Unified portal account

        submitBtn.textContent = 'Verifying...';
        submitBtn.disabled = true;
        errorMessage.classList.remove('show');

        try {
            // AUTH: Using Firebase Auth for secure session management
            if (!window.auth) {
                throw new Error("Authentication system not ready.");
            }

            // Trick: Firebase requires 6 chars. If user enters '2026', we secretly add '-io' 
            // so it meets the requirement while keeping it simple for the user.
            // SUCCESS - Set flag early to prevent race conditions with auth listeners
            window.isTransitioning = true;

            const finalPassword = enteredPassword.length < 6 ? `${enteredPassword}-io` : enteredPassword;
            await window.auth.signInWithEmailAndPassword(PORTAL_EMAIL, finalPassword);
            
            localStorage.removeItem('failedAttempts'); // Reset on success
            localStorage.removeItem('lockoutTimestamp');
            runSuccessAnimation();

        } catch (error) {
            window.isTransitioning = false; // Reset if failed
            console.error("Login Error:", error.code, error.message);
            
            let failedAttempts = parseInt(localStorage.getItem('failedAttempts') || '0');
            let message = 'Access denied. Please check your credentials.';
            let shouldIncrement = true;
            
            if (error.code === 'auth/network-request-failed') {
                message = 'Network error. Please check your connection.';
                shouldIncrement = false; // Don't count network errors as bad attempts
            } else if (error.message === "Authentication system not ready.") {
                message = 'System initializing... please try again in a moment.';
                shouldIncrement = false;
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many attempts. Device temporarily blocked by security system.';
                shouldIncrement = false;
                
                if (!DEBUG_DISABLE_LOCKOUT) {
                    // Immediately force a severe lockout
                    localStorage.setItem('lockoutTimestamp', Date.now());
                    localStorage.setItem('severeLockout', 'true');
                    window.location.href = '404.html?error=locked&severity=high';
                    return;
                }
            }

            if (shouldIncrement) {
                failedAttempts++;
                localStorage.setItem('failedAttempts', failedAttempts);
            }

            if (!DEBUG_DISABLE_LOCKOUT && failedAttempts >= (window.MAX_ATTEMPTS || 3)) {
                // Trigger Lockout
                localStorage.setItem('lockoutTimestamp', Date.now());
                window.location.href = '404.html?error=locked';
            } else {
                handleLoginFailure(message, false);
            }
        }
    });

    function handleLoginFailure(message, isLockout = false) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        
        if (isLockout) {
            submitBtn.textContent = 'Locked';
            submitBtn.disabled = true;
        } else {
            submitBtn.textContent = 'Access Portal';
            submitBtn.disabled = false;
        }
        
        // Shake animation for error
        gsap.to('.login-container', {
            x: 10,
            duration: 0.1,
            repeat: 5,
            yoyo: true,
            onComplete: () => gsap.set('.login-container', { x: 0 })
        });
    }

    // Export to window for access from other modules (like authentication.js)
    window.LoginTransition = {
        runSuccessAnimation
    };

    function runSuccessAnimation() {
        // Flag to prevent authentication.js from hiding the login background prematurely
        window.isTransitioning = true;
        
        const container = document.querySelector('.login-container');
        const iconContainer = document.getElementById('portalIconContainer');
        const portalIcon = iconContainer.querySelector('.portal-icon');
        const portalText = iconContainer.querySelector('.portal-text');

        const tl = gsap.timeline();

        // 1. Start preloading portal content immediately
        if (window.PortalLoader) window.PortalLoader.preloadPortal();

        // 2. Hide Login Form Completely
        tl.to(container, {
            opacity: 0,
            scale: 0.9,
            filter: 'blur(20px)',
            duration: 0.6,
            ease: 'power3.in',
            onComplete: () => {
                container.style.display = 'none';
            }
        });

        // 3. Show Access Granted Logo and Text (Strictly Sequential)
        tl.set(iconContainer, { display: 'flex', opacity: 1 });
        tl.fromTo(portalIcon, 
            { scale: 0.5, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
        );
        tl.fromTo(portalText,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
            "-=0.4"
        );

        // 4. Brief pause for visual impact before Flight
        tl.to({}, { duration: 1.0 });
        tl.call(() => {
            if (window.PortalLoader) {
                window.PortalLoader.transition();
            }
        });

    }

})();
