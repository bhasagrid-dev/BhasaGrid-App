/**
 * BhasaGrid Firebase Configuration
 * Initializes Firebase Auth and Firestore
 * Exposes window.auth and window.db for use in other modules
 */

(function () {
    // Firebase Configuration
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyCiwrFuaTfqoeQ3hEdhtbDwapE7Mr6gl4U",
        authDomain: "bhasagrid-bc8ce.firebaseapp.com",
        projectId: "bhasagrid-bc8ce",
        storageBucket: "bhasagrid-bc8ce.firebasestorage.app",
        messagingSenderId: "323992704792",
        appId: "1:323992704792:web:6a1924069a6679c3c5306d",
        measurementId: "G-8PKWV7QE0V"
    };

    // Initialize Firebase (if not already initialized)
    try {
        if (typeof firebase !== 'undefined') {
            // Check if any compat scripts are declared in the DOM but not executed yet
            const hasAuthScript = Array.from(document.querySelectorAll('script')).some(s => s.src.includes('firebase-auth-compat.js'));
            const hasFirestoreScript = Array.from(document.querySelectorAll('script')).some(s => s.src.includes('firebase-firestore-compat.js'));

            const authReady = !hasAuthScript || typeof firebase.auth === 'function';
            const firestoreReady = !hasFirestoreScript || typeof firebase.firestore === 'function';

            if (!authReady || !firestoreReady) {
                console.warn("[Firebase] Compat SDKs still loading. Retrying configuration...");
                setTimeout(arguments.callee, 50);
                return;
            }

            // Initialize Firebase app if no apps are already initialized
            if (!firebase.apps || !firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
                console.log("[Firebase] App initialized successfully");
            } else {
                console.log("[Firebase] App already initialized");
            }

            // Export Auth and Firestore to global scope if available
            if (typeof firebase.auth === 'function') {
                window.auth = firebase.auth();
            } else {
                console.warn("[Firebase] Auth service not loaded.");
            }

            if (typeof firebase.firestore === 'function') {
                window.db = firebase.firestore();
            } else {
                console.warn("[Firebase] Firestore service not loaded.");
            }

            console.log("[Firebase] Auth and Firestore exposed to window object");
        } else {
            console.warn("[Firebase] Firebase library not loaded yet. Will retry...");
            // Retry after a short delay
            setTimeout(arguments.callee, 100);
        }
    } catch (error) {
        console.error("[Firebase] Initialization error:", error);
    }
})();
