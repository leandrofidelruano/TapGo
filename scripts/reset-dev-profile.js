/**
 * Deletes the development userData folder so that the next `pnpm start`
 * runs with the default TapGo configuration.
 *
 * Usage:
 *   node scripts/reset-dev-profile.js
 *   node scripts/reset-dev-profile.js --tapgo-user-data-dir=<path>
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

function getAppDataPath() {
    if (process.platform === "win32") {
        if (!process.env.APPDATA) {
            throw new Error("APPDATA environment variable is not set");
        }
        return process.env.APPDATA;
    }

    if (process.platform === "darwin") {
        return path.join(os.homedir(), "Library", "Application Support");
    }

    if (process.env.XDG_DATA_HOME) {
        return process.env.XDG_DATA_HOME;
    }

    return path.join(os.homedir(), ".local", "share");
}

function getProfilePath() {
    const argument = process.argv.find((a) => a.startsWith("--tapgo-user-data-dir="));

    if (argument) {
        const value = argument.substring("--tapgo-user-data-dir=".length).trim();
        if (value.length > 0) {
            return value;
        }
    }

    return path.join(getAppDataPath(), "TapGoDev");
}

const profilePath = getProfilePath();

if (!fs.existsSync(profilePath)) {
    console.log(`Development profile does not exist, nothing to delete: ${profilePath}`);
    process.exit(0);
}

fs.rmSync(profilePath, { recursive: true, force: true });

console.log(`Deleted development profile: ${profilePath}`);
console.log("The next start will use the default TapGo configuration.");
