import { isDev } from "./is-dev";

describe(isDev, () => {
    it("should return true when process exec path ends with 'electron' or 'electron.exe'", () => {
        const processExecPaths = [
            "electron",
            "electron.exe",
            "C:\\Users\\TapGo\\projects\\TapGo\\node_modules\\.bin\\electron.exe",
            "C:\\Users\\TapGo\\projects\\TapGo\\node_modules\\.bin\\electron",
            "/Users/TapGo/project/TapGo/node_modules/.bin/electron",
        ];

        processExecPaths.forEach((processExecPath) => {
            expect(isDev(processExecPath)).toBe(true);
        });
    });

    it("should return false when process exec path does not end with 'electron' or 'electron.exe'", () => {
        const processExecPaths = [
            "TapGo",
            "TapGo.exe",
            "C:\\Users\\TapGo\\projects\\TapGo\\TapGo.exe",
            "C:\\Users\\TapGo\\projects\\TapGo\\TapGo",
            "/Users/TapGo/project/TapGo/node_modules/.bin/TapGo",
            "/Applications/TapGo/TapGo",
        ];

        processExecPaths.forEach((processExecPath) => {
            expect(isDev(processExecPath)).toBe(false);
        });
    });
});
