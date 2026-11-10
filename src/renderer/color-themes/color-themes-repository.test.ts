const mockStoreData: { [key: string]: unknown } = {};

jest.mock("electron-store", () => {
    return class FakeElectronStore {
        public get(key: string): unknown {
            return mockStoreData[key];
        }

        public set(key: string, value: unknown): void {
            mockStoreData[key] = value;
        }
    };
});

import { ColorThemeOptions } from "../../common/config/color-theme-options";
import { deepCopy } from "../../common/helpers/object-helpers";
import { colorThemes, defaultColorThemes, tapGoTheme } from "./color-themes";
import { loadColorThemes, saveColorThemes, updateStoredColorTheme } from "./color-themes-repository";

const storedColorThemeListKey = "colorThemeList";

function resetColorThemes(): void {
    colorThemes.splice(0, colorThemes.length, ...defaultColorThemes);
}

function createCustomColorTheme(name: string): ColorThemeOptions {
    return Object.assign(deepCopy(tapGoTheme), { name });
}

describe("color-themes-repository", () => {
    beforeEach(() => {
        Object.keys(mockStoreData).forEach((key) => delete mockStoreData[key]);
        resetColorThemes();
    });

    describe("loadColorThemes", () => {
        it("should keep the default color themes when nothing has been stored", () => {
            loadColorThemes();

            expect(colorThemes).toEqual(defaultColorThemes);
        });

        it("should restore the stored order and append the stored custom color themes", () => {
            const customColorTheme = createCustomColorTheme("My Custom Theme");
            const lastDefaultColorTheme = defaultColorThemes[defaultColorThemes.length - 1];

            mockStoreData[storedColorThemeListKey] = {
                customThemes: [customColorTheme],
                order: [lastDefaultColorTheme.name, customColorTheme.name],
            };

            loadColorThemes();

            const expectedOrder = [
                lastDefaultColorTheme.name,
                customColorTheme.name,
                ...defaultColorThemes
                    .filter((defaultColorTheme) => defaultColorTheme.name !== lastDefaultColorTheme.name)
                    .map((defaultColorTheme) => defaultColorTheme.name),
            ];

            expect(colorThemes.map((colorTheme) => colorTheme.name)).toEqual(expectedOrder);
        });

        it("should ignore invalid stored custom color themes", () => {
            const invalidColorTheme = Object.assign(createCustomColorTheme("Invalid Theme"), {
                userInputBackgroundColor: "not a color",
            });
            const themeWithDefaultName = createCustomColorTheme(defaultColorThemes[0].name);

            mockStoreData[storedColorThemeListKey] = {
                customThemes: [invalidColorTheme, themeWithDefaultName],
                order: [],
            };

            loadColorThemes();

            expect(colorThemes).toEqual(defaultColorThemes);
        });
    });

    describe("saveColorThemes", () => {
        it("should store the custom color themes and the current order", () => {
            const customColorTheme = createCustomColorTheme("My Custom Theme");
            colorThemes.push(customColorTheme);
            colorThemes.splice(0, 1);
            colorThemes.push(defaultColorThemes[0]);

            saveColorThemes();

            expect(mockStoreData[storedColorThemeListKey]).toEqual({
                customThemes: [customColorTheme],
                order: colorThemes.map((colorTheme) => colorTheme.name),
                removedDefaultThemes: [],
            });
        });

        it("should store the default color themes that have been removed from the list", () => {
            const defaultColorThemeToRemove = defaultColorThemes[1];
            colorThemes.splice(colorThemes.indexOf(defaultColorThemeToRemove), 1);

            saveColorThemes();

            expect(mockStoreData[storedColorThemeListKey]).toEqual({
                customThemes: [],
                order: colorThemes.map((colorTheme) => colorTheme.name),
                removedDefaultThemes: [defaultColorThemeToRemove.name],
            });
        });

        it("should restore a previously saved order and custom color themes", () => {
            const customColorTheme = createCustomColorTheme("My Custom Theme");
            colorThemes.push(customColorTheme);
            const firstColorTheme = colorThemes.splice(0, 1)[0];
            colorThemes.push(firstColorTheme);

            saveColorThemes();

            resetColorThemes();
            loadColorThemes();

            const expectedOrder = [
                ...defaultColorThemes.slice(1).map((defaultColorTheme) => defaultColorTheme.name),
                customColorTheme.name,
                defaultColorThemes[0].name,
            ];

            expect(colorThemes.map((colorTheme) => colorTheme.name)).toEqual(expectedOrder);
            expect(colorThemes).toContainEqual(customColorTheme);
        });

        it("should keep removed default color themes removed after saving and loading", () => {
            const defaultColorThemeToRemove = defaultColorThemes[1];
            colorThemes.splice(colorThemes.indexOf(defaultColorThemeToRemove), 1);

            saveColorThemes();

            resetColorThemes();
            loadColorThemes();

            expect(colorThemes.map((colorTheme) => colorTheme.name)).not.toContain(defaultColorThemeToRemove.name);
            const expectedColorThemes = defaultColorThemes.filter(
                (defaultColorTheme) => defaultColorTheme.name !== defaultColorThemeToRemove.name,
            );
            expect(colorThemes).toEqual(expectedColorThemes);
        });
    });

    describe("updateStoredColorTheme", () => {
        it("should copy the colors into the matching color theme and persist the list", () => {
            const customColorTheme = createCustomColorTheme("My Custom Theme");
            colorThemes.push(customColorTheme);

            const updatedColorThemeOptions = Object.assign(deepCopy(customColorTheme), {
                userInputBackgroundColor: "#12345678",
            });
            updateStoredColorTheme(updatedColorThemeOptions);

            const updatedColorTheme = colorThemes.filter((colorTheme) => colorTheme.name === "My Custom Theme")[0];
            expect(updatedColorTheme.userInputBackgroundColor).toBe("#12345678");

            resetColorThemes();
            loadColorThemes();

            const reloadedColorTheme = colorThemes.filter((colorTheme) => colorTheme.name === "My Custom Theme")[0];
            expect(reloadedColorTheme.userInputBackgroundColor).toBe("#12345678");
        });

        it("should never modify the TapGo Theme", () => {
            const updatedTapGoThemeOptions = Object.assign(deepCopy(tapGoTheme), {
                userInputBackgroundColor: "#12345678",
            });

            updateStoredColorTheme(updatedTapGoThemeOptions);

            expect(colorThemes[0].name).toBe(tapGoTheme.name);
            expect(colorThemes[0].userInputBackgroundColor).not.toBe("#12345678");
            expect(mockStoreData[storedColorThemeListKey]).toBeUndefined();
        });

        it("should do nothing when no color theme with that name exists in the list", () => {
            const unknownColorThemeOptions = Object.assign(deepCopy(tapGoTheme), {
                name: "Unknown Theme",
            });

            updateStoredColorTheme(unknownColorThemeOptions);

            expect(mockStoreData[storedColorThemeListKey]).toBeUndefined();
        });
    });
});
