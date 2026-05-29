/**
 * Crypto Utilities Module
 * Provides cryptographic functions for the BhasaGrid Portal.
 */

window.CryptoUtils = (function () {
    /**
     * Generates a SHA-256 hash of a string.
     * @param {string} message - The message to hash.
     * @returns {Promise<string>} The hex-encoded hash.
     */
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    return {
        sha256
    };
})();
