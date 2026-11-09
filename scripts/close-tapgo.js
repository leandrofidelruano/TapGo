const { execFileSync } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");

const DEBUG_PORT = 9223;
const WAIT_TIMEOUT_MS = 6000;
const POLL_INTERVAL_MS = 300;

function resolveElectronDistPath() {
    const defaultPath = path.join(__dirname, "..", "node_modules", "electron", "dist");
    try {
        return fs.realpathSync(defaultPath);
    } catch (error) {
        return defaultPath;
    }
}

const electronDistPath = resolveElectronDistPath();
const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";

function run(command, args) {
    try {
        return execFileSync(command, args, {
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true,
        }).toString();
    } catch (error) {
        return (error.stdout || "").toString();
    }
}

function parsePids(output) {
    return output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^\d+$/.test(line));
}

function escapePowerShellWildcards(value) {
    return value.replace(/[[\]?*]/g, (character) => `[${character}]`);
}

function getDevInstancePidsWindows() {
    const pathPattern = `*${escapePowerShellWildcards(electronDistPath)}*`;
    const portPattern = `*remote-debugging-port=${DEBUG_PORT}*`;
    const query =
        "Get-CimInstance Win32_Process | " +
        `Where-Object { $_.Name -eq 'electron.exe' -and (($_.CommandLine -like '${pathPattern}') -or ($_.CommandLine -like '${portPattern}')) } | ` +
        "ForEach-Object { $_.ProcessId }";
    const output = run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", query]);
    return parsePids(output);
}

function getDevInstancePidsMac() {
    const byPort = parsePids(run("pgrep", ["-f", `remote-debugging-port=${DEBUG_PORT}`]));
    const byPath = parsePids(run("pgrep", ["-f", electronDistPath]));
    return [...new Set([...byPort, ...byPath])];
}

function getDevInstancePids() {
    if (isWindows) {
        return getDevInstancePidsWindows();
    }
    if (isMac) {
        return getDevInstancePidsMac();
    }
    return [];
}

function isPortInUse(port) {
    return new Promise((resolve) => {
        let settled = false;
        const done = (value) => {
            if (!settled) {
                settled = true;
                resolve(value);
            }
        };
        const socket = net.connect({ port, host: "127.0.0.1" });
        socket.once("connect", () => {
            socket.destroy();
            done(true);
        });
        socket.once("error", () => done(false));
        socket.setTimeout(500, () => {
            socket.destroy();
            done(false);
        });
    });
}

async function isDevInstanceRunning() {
    if (getDevInstancePids().length > 0) {
        return true;
    }
    return isPortInUse(DEBUG_PORT);
}

function isInstalledAppRunning() {
    if (isWindows) {
        const output = run("tasklist", ["/FI", "IMAGENAME eq TapGo.exe", "/NH"]);
        return output.toLowerCase().includes("tapgo.exe");
    }
    if (isMac) {
        return run("pgrep", ["-f", "TapGo.app/Contents"]).trim().length > 0;
    }
    return false;
}

function closeInstances() {
    if (isWindows) {
        run("taskkill", ["/F", "/T", "/IM", "TapGo.exe"]);
        getDevInstancePidsWindows().forEach((pid) => run("taskkill", ["/F", "/T", "/PID", pid]));
        return;
    }
    if (isMac) {
        run("pkill", ["-f", "TapGo.app/Contents"]);
        run("pkill", ["-f", `remote-debugging-port=${DEBUG_PORT}`]);
        run("pkill", ["-f", electronDistPath]);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    if (!isWindows && !isMac) {
        console.log(`Closing TapGo instances is not supported on ${process.platform}, skipping.`);
        return;
    }

    const installedAppWasRunning = isInstalledAppRunning();
    const devInstanceWasRunning = await isDevInstanceRunning();

    if (!installedAppWasRunning && !devInstanceWasRunning) {
        console.log("No running TapGo instance found.");
        return;
    }

    console.log("Closing running TapGo instances...");
    closeInstances();

    const deadline = Date.now() + WAIT_TIMEOUT_MS;
    let installedAppRunning = installedAppWasRunning;
    let devInstanceRunning = devInstanceWasRunning;

    do {
        installedAppRunning = isInstalledAppRunning();
        devInstanceRunning = await isDevInstanceRunning();
        if (!installedAppRunning && !devInstanceRunning) {
            break;
        }
        await sleep(POLL_INTERVAL_MS);
    } while (Date.now() < deadline);

    if (installedAppWasRunning) {
        console.log(
            installedAppRunning
                ? "The installed TapGo instance is still running."
                : "Closed the installed TapGo instance.",
        );
    }

    if (devInstanceWasRunning) {
        console.log(
            devInstanceRunning
                ? "A previous development instance is still running."
                : "Closed the previous development instance.",
        );
    }

    if (devInstanceRunning) {
        console.error("Could not close the previous development instance, aborting.");
        process.exitCode = 1;
    } else if (installedAppRunning) {
        console.warn("Warning: the installed TapGo instance is still running and may capture the global shortcuts.");
    }
}

main();
