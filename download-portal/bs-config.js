
module.exports = {
    server: "src",
    port: 5679,
    files: ["src"],
    noNotify: true,
    ui: false,
    open: false,
    middleware: [
        {
            route: "/js/firebase-config.js",
            handle: function (req, res, next) {
                res.setHeader("Content-Type", "application/javascript");
                res.end("/**\n * BhasaGrid Firebase Configuration (Automatically Sync'd)\n */\nwindow.BhasaGrid_FIREBASE_CONFIG = {\n    apiKey: \"AIzaSyBZIRJuQ4Ltn_c8ciqykG5KUvHXSFzTy_w\",\n    authDomain: \"innerorbit-portal.firebaseapp.com\",\n    projectId: \"innerorbit-portal\",\n    storageBucket: \"innerorbit-portal.firebasestorage.app\",\n    messagingSenderId: \"616184841875\",\n    appId: \"1:616184841875:web:133ebb0b367f983e2d6f66\",\n    measurementId: \"G-FRBP7HBBGD\"\n};\n\n// Auto-Init\n(function() {\n    try {\n        if (typeof firebase !== 'undefined') {\n            if (!firebase.apps || !firebase.apps.length) {\n                firebase.initializeApp(window.BhasaGrid_FIREBASE_CONFIG);\n                console.log(\"[Firebase] App initialized successfully\");\n            }\n            if (typeof firebase.auth === 'function') window.auth = firebase.auth();\n            if (typeof firebase.firestore === 'function') window.db = firebase.firestore();\n        }\n    } catch (error) {\n        console.error(\"[Firebase] Init error:\", error);\n    }\n})();\n");
            }
        }
    ]
};
