import { WorkflowExecutionArgumentType } from "../../main/plugins/workflow-plugin/workflow-execution-argument-type";
import { TranslationSet } from "../../common/translation/translation-set";
import { GeneralSettings } from "./general-settings";
import { PluginSettings } from "./plugin-settings";
import { SettingOsSpecific } from "./settings-os-specific";
import { platform } from "os";

export function getSettingsItemName(
    item: GeneralSettings | PluginSettings | SettingOsSpecific,
    translations: TranslationSet,
): string {
    switch (item) {
        case GeneralSettings.Appearance:
            return translations.appearanceSettings;
        case GeneralSettings.General:
            return translations.generalSettings;
        case GeneralSettings.SearchEngine:
            return translations.searchEngineSettings;
        case PluginSettings.ApplicationSearch:
            return translations.applicationSearchSettings;
        case PluginSettings.BrowserBookmarks:
            return translations.browserBookmarks;
        case PluginSettings.Calculator:
            return translations.calcuator;
        case PluginSettings.ColorConverter:
            return translations.colorConverter;
        case GeneralSettings.ColorTheme:
            return translations.colorThemeSettings;
        case PluginSettings.CurrencyConverter:
            return translations.currencyConverter;
        case PluginSettings.Commandline:
            return translations.commandline;
        case PluginSettings.Dictionary:
            return translations.dictionary;
        case PluginSettings.Email:
            return translations.email;
        case PluginSettings.FileBrowser:
            return translations.fileBrowser;
        case PluginSettings.OperatingSystemCommands:
            return translations.operatingSystemCommands;
        case PluginSettings.OperatingSystemSettings:
            return translations.operatingSystemSettings;
        case PluginSettings.Shortcuts:
            return translations.shortcutSettings;
        case PluginSettings.SimpleFolderSearch:
            return translations.simpleFolderSearch;
        case PluginSettings.Translation:
            return translations.translationSettingsTranslation;
        case PluginSettings.Url:
            return translations.url;
        case PluginSettings.Weather:
            return translations.weather;
        case PluginSettings.WebSearch:
            return translations.websearch;
        case PluginSettings.Workflow:
            return translations.workflows;
        case SettingOsSpecific.ControlPanel.replace(`${platform()}:`, ""):
            return translations.controlPanel;
        case SettingOsSpecific.Everything.replace(`${platform()}:`, ""):
            return translations.everythingSearch;
        case SettingOsSpecific.MdFind.replace(`${platform()}:`, ""):
            return translations.mdfindSearch;
        case SettingOsSpecific.Uwp.replace(`${platform()}:`, ""):
            return "UWP";
        default:
            return item;
    }
}

export function getWorkflowExecutionArgumentTypeIcon(type: WorkflowExecutionArgumentType): string {
    switch (type) {
        case WorkflowExecutionArgumentType.URL:
            return "fas fa-globe-europe";
        case WorkflowExecutionArgumentType.FilePath:
            return "fas fa-file";
        case WorkflowExecutionArgumentType.CommandlineTool:
            return "fas fa-terminal";
    }
}

export function getWorkflowExecutionArgumentTypeClass(type: WorkflowExecutionArgumentType): string {
    switch (type) {
        case WorkflowExecutionArgumentType.URL:
            return "is-primary";
        case WorkflowExecutionArgumentType.FilePath:
            return "is-info";
        case WorkflowExecutionArgumentType.CommandlineTool:
            return "is-link";
        default:
            return "is-light";
    }
}

export function getWorkflowExecutionArgumentTypeTranslation(
    type: WorkflowExecutionArgumentType,
    translationSet: TranslationSet,
): string {
    switch (type) {
        case WorkflowExecutionArgumentType.CommandlineTool:
            return translationSet.workflowExecutionArgumentTypeCommandlineTool;
        case WorkflowExecutionArgumentType.FilePath:
            return translationSet.filePath;
        case WorkflowExecutionArgumentType.URL:
            return translationSet.workflowExecutionArgumentTypeUrl;
    }
}
