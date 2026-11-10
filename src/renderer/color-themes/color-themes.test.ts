import { deepCopy } from "../../common/helpers/object-helpers";
import { hasModifiedTapGoThemeColors, tapGoTheme } from "./color-themes";

describe("color-themes", () => {
    describe("hasModifiedTapGoThemeColors", () => {
        it("should return false when the colors of the TapGo Theme are not modified", () => {
            expect(hasModifiedTapGoThemeColors(deepCopy(tapGoTheme))).toBe(false);
        });

        it("should return true when a color of the TapGo Theme has been modified", () => {
            const modifiedTapGoThemeOptions = Object.assign(deepCopy(tapGoTheme), {
                userInputBackgroundColor: "#12345678",
            });

            expect(hasModifiedTapGoThemeColors(modifiedTapGoThemeOptions)).toBe(true);
        });

        it("should return false when another color theme is the active one, even with other colors", () => {
            const otherColorThemeOptions = Object.assign(deepCopy(tapGoTheme), {
                name: "My Custom Theme",
                userInputBackgroundColor: "#12345678",
            });

            expect(hasModifiedTapGoThemeColors(otherColorThemeOptions)).toBe(false);
        });
    });
});
