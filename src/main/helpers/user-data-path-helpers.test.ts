import { join } from "path";
import { getUserDataPathOverrideFromArgs, resolveUserDataPath, useRealConfigFromArgs } from "./user-data-path-helpers";

describe(resolveUserDataPath.name, () => {
    const appDataPath = "C:\\Users\\test\\AppData\\Roaming";

    it("should return the development profile in development mode", () => {
        const actual = resolveUserDataPath({ isDev: true, appDataPath });

        expect(actual).toBe(join(appDataPath, "TapGoDev"));
    });

    it("should keep the default userData path in production", () => {
        const actual = resolveUserDataPath({ isDev: false, appDataPath });

        expect(actual).toBeUndefined();
    });

    it("should keep the default userData path when the real config is requested", () => {
        const actual = resolveUserDataPath({ isDev: true, appDataPath, useRealConfig: true });

        expect(actual).toBeUndefined();
    });

    it("should prefer an explicit path over any other option", () => {
        const overridePath = "D:\\tapgo-custom-profile";

        const actual = resolveUserDataPath({
            isDev: true,
            appDataPath,
            overridePath,
            useRealConfig: true,
        });

        expect(actual).toBe(overridePath);
    });

    it("should return undefined when no options are provided", () => {
        const actual = resolveUserDataPath({ isDev: false, appDataPath: "", overridePath: undefined });

        expect(actual).toBeUndefined();
    });
});

describe(getUserDataPathOverrideFromArgs.name, () => {
    it("should return the path of the --tapgo-user-data-dir argument", () => {
        const args = ["electron", ".", "--tapgo-user-data-dir=D:\\tapgo-profile"];

        expect(getUserDataPathOverrideFromArgs(args)).toBe("D:\\tapgo-profile");
    });

    it("should return undefined if the argument is not present", () => {
        const args = ["electron", ".", "--remote-debugging-port=9223"];

        expect(getUserDataPathOverrideFromArgs(args)).toBeUndefined();
    });

    it("should return undefined if the argument has no value", () => {
        const args = ["--tapgo-user-data-dir="];

        expect(getUserDataPathOverrideFromArgs(args)).toBeUndefined();
    });
});

describe(useRealConfigFromArgs.name, () => {
    it("should return true if the --use-real-config argument is present", () => {
        expect(useRealConfigFromArgs([".", "--use-real-config"])).toBe(true);
    });

    it("should return false if the --use-real-config argument is not present", () => {
        expect(useRealConfigFromArgs([".", "--remote-debugging-port=9223"])).toBe(false);
    });
});
