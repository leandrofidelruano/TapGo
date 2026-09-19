import { ColorThemeOptions } from "../config/color-theme-options";
import { isValidColorCode } from "../../main/plugins/color-converter-plugin/color-converter-helpers";

export function isValidColorTheme(colorThemeOptions: ColorThemeOptions): boolean {
    const requiredColorValues = [
        colorThemeOptions.scrollbarBackgroundColor,
        colorThemeOptions.scrollbarForegroundColor,
        colorThemeOptions.searchResultsBackgroundColor,
        colorThemeOptions.searchResultsItemActiveBackgroundColor,
        colorThemeOptions.searchResultsItemActiveDescriptionColor,
        colorThemeOptions.searchResultsItemActiveTextColor,
        colorThemeOptions.searchResultsItemDescriptionTextColor,
        colorThemeOptions.searchResultsItemNameTextcolor,
        colorThemeOptions.userInputBackgroundColor,
        colorThemeOptions.userInputTextColor,
    ];

    const optionalColorValues = [
        colorThemeOptions.settingsBackgroundColor,
        colorThemeOptions.settingsSidebarBackgroundColor,
        colorThemeOptions.settingsTextColor,
        colorThemeOptions.settingsSidebarTextColor,
        colorThemeOptions.settingsAccentColor,
        colorThemeOptions.settingsBoxBackgroundColor,
    ];

    const allValidRequired = requiredColorValues.every((colorValue) => isValidColorCode(colorValue));
    const allValidOptional = optionalColorValues.every(
        (colorValue) => colorValue === undefined || isValidColorCode(colorValue),
    );

    return allValidRequired && allValidOptional;
}
