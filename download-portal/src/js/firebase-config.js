/**
 * BhasaGrid Firebase Configuration (Automatically Sync'd)
 */
window.BhasaGrid_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBZIRJuQ4Ltn_c8ciqykG5KUvHXSFzTy_w",
    authDomain: "innerorbit-portal.firebaseapp.com",
    projectId: "innerorbit-portal",
    storageBucket: "innerorbit-portal.firebasestorage.app",
    messagingSenderId: "616184841875",
    appId: "1:616184841875:web:133ebb0b367f983e2d6f66",
    measurementId: "G-FRBP7HBBGD"
};

// Auto-Init
(function() {
    try {
        if (typeof firebase !== 'undefined') {
            if (!firebase.apps || !firebase.apps.length) {
                firebase.initializeApp(window.BhasaGrid_FIREBASE_CONFIG);
                console.log("[Firebase] App initialized successfully");
            }
            if (typeof firebase.auth === 'function') window.auth = firebase.auth();
            if (typeof firebase.firestore === 'function') window.db = firebase.firestore();
        }
    } catch (error) {
        console.error("[Firebase] Init error:", error);
    }
})();
