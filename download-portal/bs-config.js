
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
                res.end("\nwindow.INNERORBIT_FIREBASE_CONFIG = {\n    apiKey: \"\",\n    authDomain: \"\",\n    projectId: \"innerorbit-portal\",\n    storageBucket: \"\",\n    messagingSenderId: \"\",\n    appId: \"\",\n    measurementId: \"\"\n};\n\n// Auto-Init\n(function() {\n    if (typeof firebase !== 'undefined' && !firebase.apps.length) {\n        firebase.initializeApp(window.INNERORBIT_FIREBASE_CONFIG);\n        window.db = firebase.firestore();\n    }\n})();\n");
            }
        }
    ]
};
