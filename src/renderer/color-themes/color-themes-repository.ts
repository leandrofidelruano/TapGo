import Store = require("electron-store");
import { ColorThemeOptions, defaultColorThemeOptions } from "../../common/config/color-theme-options";
import { isValidColorTheme } from "../../common/helpers/color-theme-helpers";
import { deepCopy } from "../../common/helpers/object-helpers";
import { colorThemes, defaultColorThemes, isDefaultColorTheme, tapGoTheme } from "./color-themes";

interface StoredColorThemeList {
    customThemes: ColorThemeOptions[];
    order: string[];
    removedDefaultThemes?: string[];
}

const colorThemeListStoreKey = "colorThemeList";

let store: Store | undefined;

function getStore(): Store {
    if (!store) {
        store = new Store();
    }
    return store;
}

function getStoredCustomThemes(storedColorThemeList: StoredColorThemeList): ColorThemeOptions[] {
    return storedColorThemeList.customThemes
        .filter((customTheme) => customTheme && typeof customTheme.name === "string" && customTheme.name.length > 0)
        .map((customTheme) => Object.assign(deepCopy(defaultColorThemeOptions), customTheme))
        .filter((customTheme) => isValidColorTheme(customTheme) && !isDefaultColorTheme(customTheme));
}

export function loadColorThemes(): void {
    const storedColorThemeList = getStore().get(colorThemeListStoreKey) as StoredColorThemeList;

    if (
        storedColorThemeList === undefined ||
        !Array.isArray(storedColorThemeList.customThemes) ||
        !Array.isArray(storedColorThemeList.order)
    ) {
        return;
    }

    const removedDefaultThemeNames = Array.isArray(storedColorThemeList.removedDefaultThemes)
        ? storedColorThemeList.removedDefaultThemes
        : [];
    const remainingDefaultColorThemes = defaultColorThemes.filter(
        (defaultColorTheme) => !removedDefaultThemeNames.includes(defaultColorTheme.name),
    );
    const availableColorThemes = [...remainingDefaultColorThemes, ...getStoredCustomThemes(storedColorThemeList)];
    const orderedColorThemes: ColorThemeOptions[] = [];

    storedColorThemeList.order.forEach((colorThemeName) => {
        const colorTheme = availableColorThemes.find(
            (availableColorTheme) => availableColorTheme.name === colorThemeName,
        );
        if (colorTheme !== undefined && !orderedColorThemes.includes(colorTheme)) {
            orderedColorThemes.push(colorTheme);
        }
    });

    availableColorThemes.forEach((colorTheme) => {
        if (!orderedColorThemes.includes(colorTheme)) {
            orderedColorThemes.push(colorTheme);
        }
    });

    colorThemes.splice(0, colorThemes.length, ...orderedColorThemes);
}

export function saveColorThemes(): void {
    const storedColorThemeList: StoredColorThemeList = {
        customThemes: colorThemes
            .filter((colorTheme) => !isDefaultColorTheme(colorTheme))
            .map((colorTheme) => deepCopy(colorTheme)),
        order: colorThemes.map((colorTheme) => colorTheme.name),
        removedDefaultThemes: defaultColorThemes
            .filter(
                (defaultColorTheme) => !colorThemes.some((colorTheme) => colorTheme.name === defaultColorTheme.name),
            )
            .map((defaultColorTheme) => defaultColorTheme.name),
    };

    getStore().set(colorThemeListStoreKey, storedColorThemeList);
}

export function updateStoredColorTheme(colorThemeOptions: ColorThemeOptions): void {
    if (colorThemeOptions.name === tapGoTheme.name) {
        return;
    }

    const colorTheme = colorThemes.find((availableColorTheme) => availableColorTheme.name === colorThemeOptions.name);
    if (colorTheme === undefined) {
        return;
    }

    (Object.keys(colorThemeOptions) as (keyof ColorThemeOptions)[]).forEach((key) => {
        colorTheme[key] = colorThemeOptions[key];
    });

    saveColorThemes();
}
