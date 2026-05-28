
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
                res.end("\nwindow.INNERORBIT_FIREBASE_CONFIG = {\n    apiKey: \"AIzaSyCiwrFuaTfqoeQ3hEdhtbDwapE7Mr6gl4U\",\n    authDomain: \"innerorbit-bc8ce.firebaseapp.com\",\n    projectId: \"innerorbit-bc8ce\",\n    storageBucket: \"innerorbit-bc8ce.firebasestorage.app\",\n    messagingSenderId: \"323992704792\",\n    appId: \"1:323992704792:web:6a1924069a6679c3c5306d\",\n    measurementId: \"G-8PKWV7QE0V\"\n};\n\n// Auto-Init\n(function() {\n    if (typeof firebase !== 'undefined' && !firebase.apps.length) {\n        firebase.initializeApp(window.INNERORBIT_FIREBASE_CONFIG);\n        window.auth = firebase.auth();\n        window.db = firebase.firestore();\n    }\n})();\n");
            }
        }
    ]
};
