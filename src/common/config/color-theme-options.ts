import { atomOneDark } from "../../renderer/color-themes/color-themes";

export interface ColorThemeOptions {
    name: string;

    userInputBackgroundColor: string;
    userInputTextColor: string;

    searchResultsBackgroundColor: string;

    searchResultsItemActiveBackgroundColor: string;
    searchResultsItemActiveTextColor: string;
    searchResultsItemActiveDescriptionColor: string;

    searchResultsItemNameTextcolor: string;
    searchResultsItemDescriptionTextColor: string;

    scrollbarForegroundColor: string;
    scrollbarBackgroundColor: string;

    settingsBackgroundColor: string;
    settingsSidebarBackgroundColor: string;
    settingsTextColor: string;
    settingsSidebarTextColor: string;
    settingsAccentColor: string;
    settingsBoxBackgroundColor: string;
}

export const defaultColorThemeOptions = atomOneDark;
