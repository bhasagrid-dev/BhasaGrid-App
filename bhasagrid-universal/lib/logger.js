/** Purpose: CommonJS logger implementation for Electron main process and Node.js-compatible environments. */
/**
 * CommonJS Logger for BhasaGrid (Main Process)
 * This provides JS compatibility for the Electron main process.
 */

const Logger = {
    log: (message) => {
        console.log(`[BhasaGrid] ℹ️ ${message}`);
    },
    success: (message) => {
        console.log(`[BhasaGrid] ✅ ${message}`);
    },
    warn: (message, ...args) => {
        if (args.length > 0) {
            console.warn(`[BhasaGrid] ⚠️ ${message}`, ...args);
        } else {
            console.warn(`[BhasaGrid] ⚠️ ${message}`);
        }
    },
    error: (message, errorObj = null) => {
        console.error(`[BhasaGrid] ❌ ${message}`);
        if (errorObj) {
            console.error(errorObj);
        }
    },
    trace: (module, file, fn, status, message = "") => {
        const msg = message ? `: ${message}` : "";
        const icon = status === 'SUCCESS' ? '✅' : (status === 'FAILED' ? '❌' : 'ℹ️');
        console.log(`[${module}][${file}][${fn}] ${icon} ${status}${msg}`);
    },
    // Add self-reference
    Logger: null
};

Logger.Logger = Logger;


module.exports = { Logger };
// Adding default for Babel/ESM interop
module.exports.default = Logger;

// Initialization check log
console.log("[BhasaGrid][logger.js] 🚀 CommonJS Module loaded");
