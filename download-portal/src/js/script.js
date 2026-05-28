// Firebase Configuration & Initialization
// Config is now managed centrally in js/firebase-config.js
var db = window.db;

// --- REACT LOGIC ---
const { useState, useEffect, useLayoutEffect, useRef } = React;

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// --- STYLES & UTILS ---
const styles = {
    glass: {
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
    },
    glassHover: {
        background: 'var(--glass-bg-hover)',
        borderColor: 'var(--accent-cyan)',
        transform: 'translateY(-5px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
    },
    gradientText: {
        background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-orange))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        backgroundSize: '200% auto',
        animation: 'gradientShift 5s ease infinite'
    }
};

// --- COMPONENTS ---

const PRIVACY_LEVELS = [
    {
        id: 0,
        title: "Normal Chat",
        desc: "Standard E2E Encryption",
        color: "#22d3ee",
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
    },
    {
        id: 1,
        title: "Private Language",
        desc: "Anti-Peek Text Reversal",
        color: "#a855f7",
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 21l21-9-9-2.1L12 3 9.9 9.9 3 12l9 2.1z"></path></svg>
    },
    {
        id: 2,
        title: "Camouflage Mode",
        desc: "Disguised UI (Calc/News)",
        color: "#f59e0b",
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
    },
    {
        id: 3,
        title: "Auto Safety",
        desc: "Auto-Screen Shield",
        color: "#ef4444",
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
    },
    {
        id: 4,
        title: "Emergency",
        desc: "Decoy mode activated",
        color: "#f43f5e",
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
    }
];

// Legacy backgrounds removed

const Navbar = (props) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navRef = useRef(null);
    const containerRef = useRef(null);

    // Smooth Scroll Shrinking Effect
    useLayoutEffect(() => {
        // If menu is open, we don't want the shrinking effect to interfere with full-screen menu
        if (menuOpen) return;

        const ctx = gsap.context(() => {
            // Animate Outer Navbar Layout on Scroll
            gsap.to(navRef.current, {
                scrollTrigger: {
                    trigger: "body",
                    start: "top top",
                    end: "100",
                    scrub: true, // Switched to true for direct mapping (removes trailing lag)
                    onUpdate: (self) => {
                        // Toggle 'scrolled' class for CSS-based effects
                        if (self.progress > 0.2) {
                            navRef.current.classList.add('scrolled');
                        } else {
                            navRef.current.classList.remove('scrolled');
                        }
                    }
                },
                top: 8,
                width: "calc(100% - 24px)",
                maxWidth: 960,
                borderRadius: 100,
                left: "50%",
                xPercent: -50,
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                ease: "power2.out" // Smoother easing for the end
            });

            // Animate Inner Container Padding
            gsap.to(containerRef.current, {
                scrollTrigger: {
                    trigger: "body",
                    start: "top top",
                    end: "100",
                    scrub: true,
                },
                padding: "8px 16px",
                ease: "power2.out"
            });
        });

        return () => ctx.revert();
    }, [menuOpen, props.revealed]);

    // Body scroll lock effect
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none'; // Prevent touch moves
        } else {
            document.body.style.overflow = 'auto';
            document.body.style.touchAction = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
            document.body.style.touchAction = 'auto';
        };
    }, [menuOpen]);

    const NavLink = ({ href, children, mobile }) => (
        <a href={href}
            onClick={() => mobile && setMenuOpen(false)}
            style={{
                color: 'var(--text-primary)',
                opacity: mobile ? 1 : 0.8,
                textDecoration: 'none',
                fontSize: mobile ? '1.5rem' : '0.95rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                padding: mobile ? '10px 0' : '0',
                display: 'block'
            }}
            onMouseOver={e => e.target.style.opacity = '1'}
            onMouseOut={e => e.target.style.opacity = mobile ? '1' : '0.8'}
        >
            {children}
        </a>
    );

    return (
        <>
            <nav
                ref={navRef}
                className={`navbar-main crystal-card ${menuOpen ? 'menu-open' : ''}`}
                style={{
                    position: 'fixed',
                    top: menuOpen ? '0' : '0',
                    left: menuOpen ? '0' : '0',
                    transform: menuOpen ? 'none' : 'none',
                    width: menuOpen ? '100%' : '100%',
                    maxWidth: menuOpen ? '100%' : '100%',
                    zIndex: 1000,
                    borderRadius: menuOpen ? '0' : '0',
                    borderTop: 'none',
                    padding: '0',
                    transition: menuOpen ? 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none', // Critical: Disable transition while GSAP is scrubbing
                    willChange: 'transform, width, top, border-radius' // Performance hint
                }}
            >
                <div
                    ref={containerRef}
                    className="container"
                    style={{
                        width: '100%',
                        padding: menuOpen ? '12px 24px' : '20px 5%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: menuOpen ? 'padding 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none', // Disable for GSAP
                        willChange: 'padding'
                    }}
                >
                    {/* Logo */}
                    <div style={{
                        fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        letterSpacing: '-0.02em',
                        zIndex: 1002,
                        marginRight: '15px'
                    }}>
                        <div id="nav-logo-landing-pad" style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: props.revealed ? 1 : 0,
                            transition: 'opacity 0.1s ease'
                        }}>
                            <img src="assets/InnerOrbit-Logo.webp" alt="InnerOrbit Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <span className={props.revealed ? 'reveal-visible' : 'reveal-hidden'} style={{
                            whiteSpace: 'nowrap',
                            transitionDelay: '0.4s',
                            fontWeight: '600',
                            fontSize: '1.2rem',
                            background: 'linear-gradient(90deg, #fff, #06b6d4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>InnerOrbit</span>
                    </div>

                    {/* Desktop Links */}
                    <div className="desktop-nav" style={{
                        display: 'flex',
                        gap: '2rem',
                        alignItems: 'center',
                        opacity: props.revealed ? 1 : 0,
                        transform: props.revealed ? 'translateY(0)' : 'translateY(10px)',
                        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
                        transitionDelay: '0.8s',
                        pointerEvents: props.revealed ? 'auto' : 'none'
                    }}>

                        <NavLink href="#hero">Home</NavLink>
                        <NavLink href="docs.html">Docs</NavLink>
                        <NavLink href="https://github.com/innerorbit-dev/InnerOrbit-Project">GitHub</NavLink>

                        {/* NEW: Permanent Secure Logout */}
                        <button
                            onClick={() => window.logout()}
                            style={{
                                padding: '10px 18px',
                                fontSize: '0.85rem',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                fontWeight: 600
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                            }}
                        >
                            <span>Logout</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </button>

                        {/* Integrated Pill Theme Toggler */}
                        <div
                            onClick={props.toggleTheme}
                            aria-label="Toggle Theme"
                            data-tooltip={props.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '100px',
                                padding: '3px',
                                width: '68px',
                                height: '34px',
                                position: 'relative',
                                cursor: 'pointer',
                                outline: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                marginRight: '15px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                            }}
                        >
                            {/* Sliding Highlight Indicator */}
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: props.theme === 'dark' ? '36px' : '2px',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-orange))',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s'
                            }} />

                            {/* Sun Icon */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2,
                                color: props.theme === 'light' ? '#ffffff' : 'var(--text-secondary)',
                                transition: 'color 0.3s'
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                            </div>

                            {/* Moon Icon */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2,
                                color: props.theme === 'dark' ? '#ffffff' : 'var(--text-secondary)',
                                transition: 'color 0.3s'
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                            </div>
                        </div>

                    </div>

                    <button className="mobile-menu-btn"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle Menu"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            zIndex: 2000,
                            position: 'relative',
                            opacity: props.revealed ? 1 : 0,
                            transform: props.revealed ? 'translateY(0)' : 'translateY(10px)',
                            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                            transitionDelay: '1s'
                        }}>
                        <div style={{
                            width: '24px', height: '2px', background: 'white',
                            marginBottom: '6px', transition: '0.3s',
                            transform: menuOpen ? 'rotate(45deg) translate(5px, 6px)' : 'none'
                        }}></div>
                        <div style={{
                            width: '24px', height: '2px', background: 'white',
                            marginBottom: '6px', transition: '0.3s',
                            opacity: menuOpen ? 0 : 1
                        }}></div>
                        <div style={{
                            width: '24px', height: '2px', background: 'white',
                            transition: '0.3s',
                            transform: menuOpen ? 'rotate(-45deg) translate(5px, -6px)' : 'none'
                        }}></div>
                    </button>
                </div>
            </nav>

            {/* Mobile Dropdown Menu Drawer - Completely outside nav to prevent clipping */}
            <div className={`mobile-nav-drawer ${menuOpen ? 'open' : ''}`} style={{ zIndex: 1500 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="assets/InnerOrbit-Logo.webp" alt="Logo" style={{ width: '28px', height: '28px' }} />
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>InnerOrbit</span>
                    </div>
                    <button onClick={() => setMenuOpen(false)} style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                        width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem'
                    }}>&times;</button>
                </div>

                {[
                    { label: 'Home', href: '#hero', icon: '→' },
                    { label: 'Documentation', href: 'docs.html', icon: '↗' },
                    { label: 'GitHub', href: 'https://github.com/innerorbit-dev/InnerOrbit-Project', icon: '↗' }
                ].map((item, idx) => (
                    <a
                        key={idx}
                        href={item.href}
                        className="mobile-nav-item"
                        onClick={() => setMenuOpen(false)}
                        target={item.href.startsWith('http') ? '_blank' : '_self'}
                    >
                        <span>{item.label}</span>
                        <div className="icon">{item.icon}</div>
                    </a>
                ))}

                <div style={{ margin: '10px 0', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>

                {/* Mobile Theme Toggle Card */}
                <div
                    className="mobile-nav-item"
                    style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.5rem'
                    }}
                >
                    <span style={{ color: 'var(--text-primary)' }}>Theme Mode</span>
                    
                    {/* Integrated Pill Theme Toggler for Mobile */}
                    <div
                        onClick={props.toggleTheme}
                        aria-label="Toggle Theme"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '100px',
                            padding: '3px',
                            width: '68px',
                            height: '34px',
                            position: 'relative',
                            cursor: 'pointer',
                            outline: 'none',
                            WebkitTapHighlightColor: 'transparent',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        {/* Sliding Highlight Indicator */}
                        <div style={{
                            position: 'absolute',
                            top: '2px',
                            left: props.theme === 'dark' ? '36px' : '2px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-orange))',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />

                        {/* Sun Icon */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                            color: props.theme === 'light' ? '#ffffff' : 'var(--text-secondary)',
                            transition: 'color 0.3s'
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>
                        </div>

                        {/* Moon Icon */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                            color: props.theme === 'dark' ? '#ffffff' : 'var(--text-secondary)',
                            transition: 'color 0.3s'
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                        </div>
                    </div>
                </div>

                <a href="#" className="mobile-nav-item" onClick={(e) => { e.preventDefault(); window.logout(); }} style={{ borderColor: 'rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.08)' }}>
                    <span style={{ color: '#ff4a4a', WebkitTextFillColor: '#ff4a4a', background: 'none', backgroundClip: 'unset', WebkitBackgroundClip: 'unset' }}>Logout</span>
                    <div className="icon" style={{ opacity: 1 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </div>
                </a>
            </div>
        </>
    );
};

// Card components removed

// --- COMPONENTS REMOVED (WindowsPreview, MobilePreview) ---

const HeroSection = () => {
    const componentRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Text Animations
            gsap.from("#hero-text > *:not(#privacy-levels-preview)", {
                y: 40,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: "power3.out"
            });

            gsap.from("#privacy-levels-preview", { y: 30, opacity: 0, duration: 1, delay: 0.5, ease: "power3.out" });

            // Scroll Down Indicator Animation (CSS handled)
        }, componentRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="hero" className="bg-hero" ref={componentRef} style={{ paddingTop: '80px' }}>
            <div style={{ width: '100%', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, textAlign: 'center' }}>

                <div id="hero-text" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: 'clamp(2.2rem, 10vw, 5.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                        The Future of <br />
                        <span style={{
                            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-orange), var(--accent-pink))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            backgroundSize: '200% auto',
                            animation: 'gradientShift 5s ease infinite'
                        }}>Social Privacy.</span>
                    </h1>
                    <p style={{ fontSize: 'clamp(1rem, 4vw, 1.3rem)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '800px', margin: '0 auto 2.5rem' }}>
                        More than just encryption. Control who sees what with 5 levels of social stealth—from casual chats to complete invisibility.
                    </p>

                    <div style={{ width: '100%', margin: '0 auto' }}>

                        {/* Privacy Levels Preview Marquee */}
                        <div id="privacy-levels-preview" style={{
                            marginBottom: '3rem',
                            width: '100%',
                            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                            overflow: 'hidden'
                        }}>
                            <div className="marquee-content" style={{
                                display: 'flex', gap: '15px', width: 'max-content',
                                animation: 'marquee 25s linear infinite',
                                margin: '0 auto' // Center the marquee content wrapper if possible, though marquee itself moves
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
                                onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
                            >
                                {[...PRIVACY_LEVELS, ...PRIVACY_LEVELS].map((level, i) => (
                                    <div key={i} title={level.title} style={{
                                        padding: '12px 16px', borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${level.color}30`,
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        minWidth: '140px', backdropFilter: 'blur(5px)',
                                        textAlign: 'left' // Keep text aligned left inside cards
                                    }}>
                                        <div style={{ color: level.color }}>{level.icon}</div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{level.title}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{level.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>


                        <style>{`
                        @keyframes marquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        @keyframes gradientShift {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }
                        @keyframes shine {
                            0% { left: -100%; }
                            100% { left: 100%; }
                        }
                        .btn-comparison {
                            background: rgba(255, 255, 255, 0.05) !important;
                            backdrop-filter: blur(10px);
                            -webkit-backdrop-filter: blur(10px);
                            border: 2px solid rgba(255, 255, 255, 0.2) !important;
                            color: var(--text-primary) !important;
                            position: relative;
                            overflow: hidden;
                            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            text-decoration: none;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            gap: 10px;
                            font-size: 0.95rem;
                            padding: 12px 24px;
                            border-radius: 12px;
                            font-weight: 600;
                        }
                        .btn-comparison::after {
                            content: '';
                            position: absolute;
                            top: 0;
                            height: 100%;
                            width: 30px;
                            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                            transform: skewX(-20deg);
                            left: -100%;
                            transition: none;
                        }
                        .btn-comparison:hover {
                            border-color: var(--accent-purple) !important;
                            background: rgba(168, 85, 247, 0.1) !important;
                            box-shadow: 0 0 25px rgba(168, 85, 247, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
                            transform: translateY(-3px);
                            color: white !important;
                        }
                        .btn-comparison:hover::after {
                            animation: shine 0.8s ease-in-out;
                        }
                        @media (max-width: 640px) {
                            .flex-btn-group {
                                flex-direction: column !important;
                                align-items: center !important;
                                gap: 1rem !important;
                            }
                            .btn-comparison, .btn {
                                width: 100% !important;
                                max-width: 320px !important;
                                justify-content: center !important;
                                align-self: center !important;
                            }
                        }
                    `}</style>
 
                        <div className="flex-btn-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href="#download" className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.95rem', padding: '12px 24px' }}>
                                Download App
                            </a>
                            <a href="#social-privacy" className="btn-comparison">
                                See Comparison
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Down Indicator */}
            <div className="scroll-indicator" style={{
                position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                color: 'var(--text-secondary)', zIndex: 20, cursor: 'pointer',
                opacity: 0.8
            }} onClick={() => document.getElementById('social-privacy').scrollIntoView({ behavior: 'smooth' })}>
                <span style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Scroll</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'bounce 2s infinite' }}>
                    <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                </svg>
                <style>{`
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                        40% { transform: translateY(-10px); }
                        60% { transform: translateY(-5px); }
                    }
                `}</style>
            </div>
        </section>
    );
};

// --- NEW SOCIAL PRIVACY COMPARISON COMPONENT ---
const SocialPrivacyComparison = () => {
    useLayoutEffect(() => {
        gsap.utils.toArray('.comparison-card').forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: "top 85%",
                },
                y: 50,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
                delay: i * 0.2
            });
        });
    }, []);

    return (
        <section id="social-privacy" className="bg-social">
            <div style={{ width: '100%', padding: '0 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <h2 style={{ fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        Social Privacy vs. <span style={{ color: 'var(--text-secondary)' }}>Normal Apps</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
                        Most apps think privacy ends at encryption. We believe it begins with how you exist in the digital world.
                    </p>
                </div>

                <div className="responsive-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    {/* Standard Apps Card */}
                    <div className="comparison-card crystal-card" style={{ padding: '2.5rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            Normal Apps
                        </div>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: '#ef4444' }}>✕</span> Visible notifications on lock screen
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: '#ef4444' }}>✕</span> Anyone can see you're using the app
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: '#ef4444' }}>✕</span> Metadata is often logged
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: '#ef4444' }}>✕</span> "Delete" doesn't always mean delete
                            </li>
                        </ul>
                    </div>

                    {/* InnerOrbit Card */}
                    <div className="comparison-card crystal-card" style={{
                        padding: '2.5rem',
                        border: '1px solid var(--accent-purple)',
                        boxShadow: '0 0 30px rgba(168, 85, 247, 0.1)'
                    }}>
                        <style>{`
                            .main-content {
                                flex: 1;
                                padding: clamp(3rem, 8vw, 6rem) 5%;
                                min-height: 100vh;
                                background: var(--glass-bg);
                                backdrop-filter: blur(var(--glass-blur));
                                border-left: 1px solid var(--glass-border);
                                box-shadow: -10px 0 30px rgba(0,0,0,0.1);
                                width: 100%;
                                margin: 0;
                            }
                        `}</style>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {PRIVACY_LEVELS[2].icon}
                            InnerOrbit
                        </div>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-primary)' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>✓</span> <strong>Camouflage Mode:</strong> App looks like a calculator
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>✓</span> <strong>Private Language:</strong> Slang auto-translation
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>✓</span> <strong>Ghost Notifications:</strong> Discreet vibrations only
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>✓</span> <strong>Panic Wipe:</strong> Shake to destroy data
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FeaturesSection = () => {
    useEffect(() => {
        // Feature Cards Stagger
        gsap.utils.toArray('.feature-card').forEach((card, i) => {
            ScrollTrigger.create({
                trigger: card,
                start: "top 85%",
                onEnter: () => gsap.from(card, {
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    ease: "back.out(1.7)"
                })
            });
        });
    }, []);

    const features = [
        { title: "Stealth Mode", desc: "Disguised as a functional calculator.", icon: "calc" },
        { title: "Dual-Layer Encryption", desc: "AES-256 + RSA-2048 encryption.", icon: "lock" },
        { title: "Self-Destruct", desc: "Messages vanish without a trace.", icon: "bomb" },
        { title: "Cross-Platform", desc: "Seamless sync across all devices.", icon: "sync" },
        { title: "Anonymous ID", desc: "No phone number required.", icon: "user" },
        { title: "Panic Switch", desc: "Instant wipe with a secret gesture.", icon: "alert" }
    ];

    return (
        <section id="features" className="bg-features">
            <div style={{ width: '100%', padding: '0 24px', position: 'relative', zIndex: 10 }}>
                <div style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            Your Privacy, <span className="gradient-text">Your Control</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                            Built for those who demand absolute secrecy. Your data never leaves your device unencrypted.
                        </p>
                    </div>

                    <div className="responsive-grid">
                        {features.map((f, i) => (
                            <div key={i} className="feature-card crystal-card" style={{ padding: '2.5rem' }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '16px',
                                    background: 'var(--accent-purple)20', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                                    color: 'var(--accent-purple)'
                                }}>
                                    {/* Icons would go here */}
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{f.icon === 'calc' ? '±' : f.icon === 'lock' ? '🔒' : '★'}</div>
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{f.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const WebSection = () => {
    useEffect(() => {
        gsap.utils.toArray('.web-feature-card').forEach((card, i) => {
            ScrollTrigger.create({
                trigger: card,
                start: "top 85%",
                onEnter: () => gsap.from(card, {
                    y: 30,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    delay: i * 0.1
                })
            });
        });
    }, []);

    const webFeatures = [
        { title: "Zero Install", desc: "No download required. Launch instantly in any modern browser on any device.", icon: "🚀" },
        { title: "Instant Sync", desc: "Your messages and contacts are always updated and ready when you are.", icon: "⚡" },
        { title: "Privacy First", desc: "Built-in auto-lock and encrypted sessions for secure browsing anywhere.", icon: "🛡️" }
    ];

    return (
        <section id="web-version" className="bg-web">
            <div style={{ width: '100%', padding: '0 24px', position: 'relative', zIndex: 10 }}>
                <div style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>
                            Access Anywhere with <span className="gradient-text" style={{ fontSize: '3.5rem' }}>Web Version</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.3rem', maxWidth: '700px', margin: '0 auto' }}>
                            Experience the full power of InnerOrbit directly in your browser. Perfect for shared environments or quick access on any machine.
                        </p>
                    </div>

                    <div className="responsive-grid" style={{ marginBottom: '4rem' }}>
                        {webFeatures.map((f, i) => (
                            <div key={i} className="web-feature-card crystal-card" style={{
                                padding: '2.5rem',
                                transition: 'transform 0.3s'
                            }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>{f.icon}</div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>{f.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <button
                            onClick={() => window.launchWebApp()}
                            className="btn"
                            style={{
                                padding: '18px 48px',
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                boxShadow: '0 0 30px rgba(147, 51, 234, 0.2)'
                            }}
                        >
                            Launch Web Application
                        </button>
                    </div>
                </div>
            </div>

            {/* Background elements */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(147, 51, 234, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none'
            }}></div>
        </section>
    );
};

const DownloadSection = () => {
    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from("#download-container", {
                scrollTrigger: {
                    trigger: "#download-container",
                    start: "top 80%",
                },
                y: 80,
                opacity: 0,
                scale: 0.95,
                duration: 1.2,
                ease: "power3.out"
            });
        });
        return () => ctx.revert();
    }, []);

    return (
        <section id="download" className="bg-download">
            <div className="download-wrapper">
                <div id="download-container" className="crystal-card">
                    <h2 style={{ color: 'var(--text-primary)' }}>
                        Start Your <span className="gradient-text">Secure Journey</span>
                    </h2>
                    <p>
                        Be among the first to reclaim your digital privacy.
                        Available on Android, Windows, macOS, and Linux.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                        {/* Play Store Button */}
                        <button
                            onClick={() => window.downloadFile('playstore')}
                            className="btn"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '15px',
                                padding: '16px 32px', fontSize: '1.1rem',
                                background: 'linear-gradient(135deg, #0ea5e9, #2563eb)'
                            }}
                        >
                            <img src="assets/download-icons/playstore.webp" alt="Play Store" style={{ width: 30, height: 30 }} />
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase' }}>Get it on</div>
                                <div style={{ fontWeight: 700 }}>Google Play</div>
                            </div>
                        </button>

                        {/* Windows Button */}
                        <button
                            onClick={() => window.downloadFile('windows')}
                            className="btn"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '15px',
                                padding: '16px 32px', fontSize: '1.1rem',
                                background: 'linear-gradient(135deg, #0f172a, #334155)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <img src="assets/download-icons/window.png" alt="Windows" style={{ width: 30, height: 30 }} />
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase' }}>Download for</div>
                                <div style={{ fontWeight: 700 }}>Windows 10/11</div>
                            </div>
                        </button>

                        {/* macOS App Store Button */}
                        <button
                            onClick={() => window.downloadFile('macos')}
                            className="btn"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '15px',
                                padding: '16px 32px', fontSize: '1.1rem',
                                background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                                border: '1px solid rgba(255,255,255,0.15)'
                            }}
                        >
                            <div style={{ fontSize: '1.8rem', lineHeight: '1' }}>🍎</div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase' }}>Download on the</div>
                                <div style={{ fontWeight: 700 }}>Mac App Store</div>
                            </div>
                        </button>

                        {/* Linux Button */}
                        <button
                            onClick={() => window.downloadFile('linux')}
                            className="btn"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '15px',
                                padding: '16px 32px', fontSize: '1.1rem',
                                background: 'linear-gradient(135deg, #27272a, #09090b)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ fontSize: '1.8rem', lineHeight: '1' }}>🐧</div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase' }}>Download for</div>
                                <div style={{ fontWeight: 700 }}>Linux / Tarball</div>
                            </div>
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem', color: '#64748b', fontSize: '0.9rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ✓ v2.4.0 Stable
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ✓ 64-bit Optimized
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ✓ Verified Secure
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Footer = () => {

    return (
        <footer className="bg-footer" style={{ position: 'relative', padding: '6rem 0 2rem', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 10, width: '100%', padding: '0 5%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.5rem' }}>
                            <div className="nav-logo-container" style={{ width: 32, height: 32 }}></div>
                            InnerOrbit
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                            Redefining privacy in the digital age.
                            Secure, fast, and completely anonymous.
                        </p>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '1.5rem' }}>Product</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--text-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Features</a>
                            <a href="#download" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--text-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Download</a>
                            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--text-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Changelog</a>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '1.5rem' }}>Legal</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <a href="privacy-policy.html" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--text-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Privacy Policy</a>
                            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--text-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Terms of Service</a>
                            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--text-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Security</a>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '1.5rem' }}>Connect</h4>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[
                                { id: 'x', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
                                { id: 'gh', url: 'https://github.com/innerorbit-dev/InnerOrbit-Project', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg> },
                                { id: 'dc', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" /></svg> }
                            ].map(social => (
                                <a key={social.id} href={social.url || "#"} target={social.url ? "_blank" : undefined} rel={social.url ? "noopener noreferrer" : undefined} style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'rgba(128, 128, 128, 0.1)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--text-primary)', textDecoration: 'none',
                                    transition: 'all 0.3s',
                                }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.background = 'rgba(128, 128, 128, 0.2)';
                                        e.currentTarget.style.color = 'var(--accent-cyan)';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.background = 'rgba(128, 128, 128, 0.1)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{
                    paddingTop: '2rem',
                    borderTop: '1px solid var(--card-border)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        © 2026 InnerOrbit Inc. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
};

const App = () => {
    const [revealed, setRevealed] = useState(window.ALREADY_AUTHENTICATED || false);
    const [theme, setTheme] = useState(localStorage.getItem('innerorbit-theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('innerorbit-theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleLogoImpact = () => {
            // Immediate reveal for seamless handoff
            setRevealed(true);
        };

        const handleAuthSuccess = () => {
            // Reveal immediately if already authenticated (no flight needed)
            setRevealed(true);
        };

        window.addEventListener('logo-impact', handleLogoImpact);
        window.addEventListener('auth-success', handleAuthSuccess);

        // Final check for state that might have set before listener attached
        if (window.ALREADY_AUTHENTICATED) {
            setRevealed(true);
        }

        // Signal ready
        window.PORTAL_READY = true;
        window.dispatchEvent(new CustomEvent('portal-ready'));

        return () => {
            window.removeEventListener('logo-impact', handleLogoImpact);
            window.removeEventListener('auth-success', handleAuthSuccess);
        };
    }, []);

    return (
        <div style={{ overflowX: 'hidden' }}>
            <Navbar revealed={revealed} theme={theme} toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} />
            <div className={revealed ? 'reveal-visible' : 'reveal-hidden'} style={{ transitionDelay: '1.2s' }}>
                <HeroSection />
                <SocialPrivacyComparison />
                <FeaturesSection />
                <WebSection />
                <DownloadSection />
                <Footer />
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('react-root'));
root.render(<App />);

// --- Move Angular Root Logic --- 
// We append the Angular root inside React's DOM flow after render or just keep it separate
// For simplicity, it stays in its own div #angular-docs-root which is visually placed above via CSS or moved




// --- LEGACY LOGIC ---
// Smooth Scroll
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
    direction: 'vertical', // vertical, horizontal
    gestureDirection: 'vertical', // vertical, horizontal, both
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});

// Connect Lenis to ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);
// Download & Configuration Logic
// Dynamically fetch portal configuration from Firestore (app/version)
async function getPortalConfig() {
    try {
        const docRef = db.collection('app').doc('version');
        const snap = await docRef.get();
        if (snap.exists) {
            return snap.data();
        }
        return null;
    } catch (err) {
        console.error('Failed to fetch portal configuration:', err);
        return null;
    }
}

// --- Custom Modal Logic ---
function showCustomModal(title, message, icon = '✨') {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('customModalTitle');
    const modalMessage = document.getElementById('customModalMessage');
    const modalIcon = document.getElementById('customModalIcon');
    const closeBtn = document.getElementById('closeCustomModal');

    if (modal && modalTitle && modalMessage) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalIcon.textContent = icon;
        modal.style.display = 'flex';

        // Animation
        gsap.fromTo(modal.firstElementChild,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );

        const closeHandler = () => {
            gsap.to(modal.firstElementChild, {
                scale: 0.8, opacity: 0, duration: 0.2,
                onComplete: () => modal.style.display = 'none'
            });
            closeBtn.removeEventListener('click', closeHandler);
        };

        closeBtn.addEventListener('click', closeHandler);

        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) closeHandler();
        };
    } else {
        // Fallback if modal elements missing
        alert(`${title}\n\n${message}`);
    }
}

window.downloadFile = async function (platform) {
    try {
        showCustomModal('Checking Version...', 'Retrieving the latest secure link...', '🔄');

        // Try to get dynamic config from Firestore
        const config = await getPortalConfig();
        let url = "";
        let isExternal = false;

        if (platform === 'windows') {
            url = (config && config.downloadUrl) || "downloads/InnerOrbit_Setup.zip";
        } else if (platform === 'playstore') {
            url = (config && config.androidUrl) || "https://your-storage.com/cipherplay.apk";
            isExternal = true;
        } else if (platform === 'macos') {
            url = (config && config.macUrl) || "https://apps.apple.com/app/innerorbit";
            isExternal = true;
        } else if (platform === 'linux') {
            url = (config && config.linuxUrl) || "downloads/InnerOrbit_Linux.tar.gz";
        }

        if (isExternal) {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showCustomModal('Redirecting...', 'Opening the secure download page...', '📱');
        } else {
            const fileName = url.split('/').pop() || 'InnerOrbit_Setup.zip';
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showCustomModal('Downloading...', `Your download has started.\n\n📂 Please follow the installation guide.`, '📦');
        }
    } catch (e) {
        console.error(e);
        showCustomModal('Download Error', 'Something went wrong while starting the download. Please try again.', '❌');
    }
};

window.launchWebApp = async function () {
    const fallbackUrl = 'https://innerorbit-bc8ce.web.app/';
    try {
        // Simple direct launch: Fetch config and redirect immediately
        const config = await getPortalConfig();
        const url = (config && config.webAppUrl) || fallbackUrl;
        window.open(url, '_blank');
    } catch (e) {
        console.error('Launch error:', e);
        window.open(fallbackUrl, '_blank');
    }
};
