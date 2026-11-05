import { join } from "path";

export interface UserDataPathOptions {
    isDev: boolean;
    appDataPath: string;
    overridePath?: string;
    useRealConfig?: boolean;
}

/**
 * Resolves which userData folder Electron should use.
 *
 * Returns undefined when the default Electron userData path must be kept,
 * which is always the case for production builds.
 *
 * In development it resolves to a dedicated folder so that the app starts
 * with the default configuration instead of the configuration of an
 * installed TapGo instance.
 */
export function resolveUserDataPath(options: UserDataPathOptions): string | undefined {
    if (options.overridePath) {
        return options.overridePath;
    }

    if (options.isDev && !options.useRealConfig) {
        return join(options.appDataPath, "TapGoDev");
    }

    return undefined;
}

export function getUserDataPathOverrideFromArgs(args: string[]): string | undefined {
    const prefix = "--tapgo-user-data-dir=";
    const argument = args.find((a) => a.startsWith(prefix));

    if (!argument) {
        return undefined;
    }

    const value = argument.substring(prefix.length).trim();

    return value.length > 0 ? value : undefined;
}

export function useRealConfigFromArgs(args: string[]): boolean {
    return args.includes("--use-real-config");
}
