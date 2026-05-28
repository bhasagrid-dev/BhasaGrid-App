/**
 * PortalLoader Module
 * Handles dynamic fetching and injection of main-portal.html content
 * for a seamless SPA transition.
 */

window.PortalLoader = (function () {
    const CONFIG = {
        SOURCE_URL: 'main-portal.html',
        TARGET_SELECTOR: '#portal-view',
        LOGIN_SELECTOR: '#login-view'
    };

    let isLoaded = false;

    /**
     * Fetches and prepares the portal content in the background
     */
    async function preloadPortal() {
        if (isLoaded) return;
        
        try {
            const response = await fetch(CONFIG.SOURCE_URL);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const targetContainer = document.querySelector(CONFIG.TARGET_SELECTOR);
            if (!targetContainer) return;

            // Extract body children excluding scripts (since they are in the shell)
            const bodyChildren = Array.from(doc.body.children);
            
            // Clear existing if any (except react-root and angular-docs-root if they were already there)
            Array.from(targetContainer.children).forEach(child => {
                if (child.id !== 'react-root' && child.id !== 'angular-docs-root') {
                    targetContainer.removeChild(child);
                }
            });
            
            bodyChildren.forEach(child => {
                if (child.tagName !== 'SCRIPT' && child.id !== 'react-root' && child.id !== 'angular-docs-root') {
                    targetContainer.appendChild(child.cloneNode(true));
                }
            });

            // Ensure #react-root exists
            if (!document.getElementById('react-root')) {
                const reactRoot = document.createElement('div');
                reactRoot.id = 'react-root';
                targetContainer.appendChild(reactRoot);
            }

            isLoaded = true;
            console.log("Portal content preloaded and injected.");
        } catch (error) {
            console.error("Failed to preload portal content:", error);
        }
    }

    /**
     * Coordinates the full transition
     */
    async function transition() {
        if (!isLoaded) await preloadPortal();

        const portalView = document.querySelector(CONFIG.TARGET_SELECTOR);
        const loginView = document.querySelector(CONFIG.LOGIN_SELECTOR);
        const portalIconContainer = document.getElementById('portalIconContainer');
        const animatedLogo = document.getElementById('animatedLogo');
        const portalText = portalIconContainer.querySelector('.portal-text');

        // 1. Wait for React-rendered landing pad (since we removed the static one)
        let targetEl = document.getElementById('nav-logo-landing-pad');
        let retries = 0;
        while (!targetEl && retries < 30) {
            await new Promise(r => setTimeout(r, 100));
            targetEl = document.getElementById('nav-logo-landing-pad');
            retries++;
        }

        if (!targetEl || !animatedLogo) {
            console.warn("Transition targets missing, falling back to simple reveal.");
            revealPortal();
            return;
        }

        // Stage 1: Preparation - Switch views and position logo
        loginView.style.opacity = '0';
        loginView.style.pointerEvents = 'none';
        portalView.style.display = 'block';
        portalView.style.opacity = '1';
        
        // Hide the "Access Granted" text instantly for a clean background travel
        if (portalText) {
            portalText.style.opacity = '0';
            portalText.style.display = 'none';
        }
        
        // Hide all children of portal-view except react-root initially
        for (let child of portalView.children) {
            if (child.id !== 'react-root') {
                child.style.opacity = '0';
                child.style.pointerEvents = 'none';
            }
        }

        // 3. Calculate Precise Positions
        const targetRect = targetEl.getBoundingClientRect();
        const logoRect = animatedLogo.getBoundingClientRect();

        const deltaX = targetRect.left - logoRect.left;
        const deltaY = targetRect.top - logoRect.top;

        // Ensure animated logo is on top of everything during flight
        animatedLogo.style.zIndex = "10001";
        animatedLogo.style.position = "relative";

        const tl = gsap.timeline({
            onComplete: () => {
                loginView.style.display = 'none';
                portalIconContainer.style.display = 'none';
                portalView.style.pointerEvents = 'auto';
                document.body.classList.add('authenticated');
                if (window.ScrollTrigger) window.ScrollTrigger.refresh();
            }
        });

        // Stage 1: Fade out "Access Granted" text immediately and completely
        tl.to(portalText, {
            opacity: 0,
            y: -10,
            filter: "blur(10px)",
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                if (portalText) portalText.style.display = 'none';
            }
        });

        // Stage 2: The "Flight" - Smooth trajectory to target with gentle arrival
        tl.to(animatedLogo, {
            x: deltaX,
            y: deltaY,
            width: targetRect.width,
            height: targetRect.height,
            duration: 1.4,
            ease: "expo.inOut",
            onStart: () => {
                animatedLogo.classList.add('no-pulse');
                animatedLogo.style.filter = "drop-shadow(0 0 30px rgba(6, 182, 212, 0.8))";
            }
        }, "-=0.3");


        // Background blur adjustment during flight
        tl.to(portalIconContainer, {
            backgroundColor: 'rgba(0, 0, 0, 0)',
            backdropFilter: 'blur(0px)',
            duration: 1.0
        }, "-=1.2");

        // Stage 3: The "Impact" - Dynamic Ring and Handoff
        tl.add(() => {
            // A. Trigger Impact Visual Effect
            createImpactEffect(targetRect);

            // B. Quick Scale Bounce for Tactile Feel
            gsap.fromTo(targetEl, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: "back.out(2)" });

            // C. Signal to React App to show its logo and content
            window.dispatchEvent(new CustomEvent('logo-impact'));
            
            // D. Fade out animated logo over a tiny fraction to prevent "snap" gap
            gsap.to(animatedLogo, { opacity: 0, duration: 0.1 });
            
            // E. Reveal all portal content (excluding react-root which has its own React logic)
            for (let child of portalView.children) {
                if (child.id !== 'react-root') {
                    child.style.opacity = '1';
                    child.style.pointerEvents = 'auto';
                }
            }
        });
    }

    function createImpactEffect(targetRect) {
        const ring = document.createElement('div');
        ring.className = 'impact-ring';
        
        const centerX = targetRect.left + (targetRect.width / 2);
        const centerY = targetRect.top + (targetRect.height / 2);
        
        ring.style.left = `${centerX}px`;
        ring.style.top = `${centerY}px`;
        ring.style.width = '10px';
        ring.style.height = '10px';
        ring.style.transform = 'translate(-50%, -50%)';
        ring.style.opacity = '1';
        
        document.body.appendChild(ring);
        
        gsap.to(ring, {
            width: 150,
            height: 150,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            onComplete: () => ring.remove()
        });
    }


    function revealPortal() {
        const portalView = document.querySelector(CONFIG.TARGET_SELECTOR);
        const loginView = document.querySelector(CONFIG.LOGIN_SELECTOR);
        
        if (portalView) {
            portalView.style.display = 'block';
            portalView.style.opacity = '1';
            portalView.style.pointerEvents = 'all';
        }
        if (loginView) loginView.style.display = 'none';
    }

    return {
        preloadPortal,
        transition,
        revealPortal
    };
})();
