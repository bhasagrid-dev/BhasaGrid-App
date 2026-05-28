// InnerOrbit Firebase Configuration
// This file uses environment variables injected via middleware (see bs-config.js)
// Or falls back to the hardcoded config for production deployment

const firebaseConfig = window.INNERORBIT_FIREBASE_CONFIG || {
    apiKey: "AIzaSyBZIRJuQ4Ltn_c8ciqykG5KUvHXSFzTy_w",
    authDomain: "innerorbit-portal.firebaseapp.com",
    projectId: "innerorbit-portal",
    storageBucket: "innerorbit-portal.firebasestorage.app",
    messagingSenderId: "616184841875",
    appId: "1:616184841875:web:133ebb0b367f983e2d6f66",
    measurementId: "G-FRBP7HBBGD"
};

if (!firebaseConfig) {
    console.error("Firebase Configuration Error: Environment variables not found. Ensure the dev server is running with the correct middleware.");
}

// Initialize Firebase for the Portal
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    // Export globally for index.html login logic
    if (typeof firebase.auth === 'function') {
        window.auth = firebase.auth();
    }
    if (typeof firebase.firestore === 'function') {
        window.db = firebase.firestore();
    }
    console.log("Firebase initialized for project: " + firebaseConfig.projectId);
}

