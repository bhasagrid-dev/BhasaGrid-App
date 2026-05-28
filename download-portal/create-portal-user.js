/**
 * One-time setup: Creates the portal@innerorbit.app user in Firebase Auth.
 * Run: node create-portal-user.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Use Application Default Credentials (firebase CLI already logged in)
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'innerorbit-bc8ce'
});

const auth = getAuth();

async function createPortalUser() {
    const email = 'portal@innerorbit.app';
    const password = '2026-io'; // matches login-transition.js finalPassword logic for "2026"

    try {
        // Try to get existing user first
        const existing = await auth.getUserByEmail(email);
        console.log('User already exists:', existing.uid);
        // Update password to make sure it's correct
        await auth.updateUser(existing.uid, { password });
        console.log('Password updated successfully.');
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            // Create new user
            const user = await auth.createUser({
                email,
                password,
                emailVerified: true,
                displayName: 'InnerOrbit Portal'
            });
            console.log('Portal user created! UID:', user.uid);
        } else {
            console.error('Error:', err.message);
        }
    }
    process.exit(0);
}

createPortalUser();
