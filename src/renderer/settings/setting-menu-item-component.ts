import Vue from "vue";
import { VueEventChannels } from "../vue-event-channels";
import { vueEventDispatcher } from "../vue-event-dispatcher";
import { PluginSettings } from "./plugin-settings";
import { SettingOsSpecific } from "./settings-os-specific";
import { GeneralSettings } from "./general-settings";
import { UserConfigOptions } from "../../common/config/user-config-options";
import { platform } from "os";
import { getSettingsItemName } from "./helpers";

export const settingMenuItemComponent = Vue.extend({
    data() {
        return {
            isActive: false,
        };
    },
    methods: {
        getItemName(item: GeneralSettings | PluginSettings | SettingOsSpecific) {
            return getSettingsItemName(item, this.translations);
        },
        getItemIcon(item: GeneralSettings): string {
            switch (item) {
                case GeneralSettings.Appearance:
                    return `<i class="fas fa-eye"></i>`;
                case GeneralSettings.ColorTheme:
                    return `<i class="fas fa-palette"></i>`;
                case GeneralSettings.General:
                    return `<i class="fas fa-cog"></i>`;
                case GeneralSettings.SearchEngine:
                    return `<i class="fas fa-search"></i>`;
                default:
                    return "";
            }
        },
        isEnabled(item: GeneralSettings | PluginSettings | SettingOsSpecific): boolean {
            const config: UserConfigOptions = this.config;
            switch (item) {
                case PluginSettings.ApplicationSearch:
                    return config.applicationSearchOptions.enabled;
                case PluginSettings.BrowserBookmarks:
                    return config.browserBookmarksOptions.isEnabled;
                case PluginSettings.Calculator:
                    return config.calculatorOptions.isEnabled;
                case PluginSettings.ColorConverter:
                    return config.colorConverterOptions.isEnabled;
                case PluginSettings.Commandline:
                    return config.commandlineOptions.isEnabled;
                case PluginSettings.CurrencyConverter:
                    return config.currencyConverterOptions.isEnabled;
                case PluginSettings.Dictionary:
                    return config.dictionaryOptions.isEnabled;
                case PluginSettings.Email:
                    return config.emailOptions.isEnabled;
                case PluginSettings.FileBrowser:
                    return config.fileBrowserOptions.isEnabled;
                case PluginSettings.OperatingSystemCommands:
                    return config.operatingSystemCommandsOptions.isEnabled;
                case PluginSettings.OperatingSystemSettings:
                    return config.operatingSystemSettingsOptions.isEnabled;
                case PluginSettings.Shortcuts:
                    return config.shortcutOptions.isEnabled;
                case PluginSettings.SimpleFolderSearch:
                    return config.simpleFolderSearchOptions.isEnabled;
                case PluginSettings.Translation:
                    return config.translationOptions.enabled;
                case PluginSettings.Url:
                    return config.urlOptions.isEnabled;
                case PluginSettings.Weather:
                    return config.weatherOptions.isEnabled;
                case PluginSettings.LoremIpsum:
                    return config.loremIpsumOptions.isEnabled;
                case PluginSettings.WebSearch:
                    return config.websearchOptions.isEnabled;
                case PluginSettings.Workflow:
                    return config.workflowOptions.isEnabled;
                case SettingOsSpecific.ControlPanel.replace(`${platform()}:`, ""):
                    return config.controlPanelOptions.isEnabled;
                case SettingOsSpecific.Everything.replace(`${platform()}:`, ""):
                    return config.everythingSearchOptions.enabled;
                case SettingOsSpecific.MdFind.replace(`${platform()}:`, ""):
                    return config.mdfindOptions.enabled;
                case SettingOsSpecific.Uwp.replace(`${platform()}:`, ""):
                    return config.uwpSearchOptions.isEnabled;
                default:
                    return false;
            }
        },
        isPluginSetting(item: GeneralSettings | PluginSettings | SettingOsSpecific): boolean {
            const allPluginSettings = [
                ...Object.values(PluginSettings).map((setting) => setting.toString()),
                ...Object.values(SettingOsSpecific).map((setting) => setting.toString().replace(`${platform()}:`, "")),
            ];

            return allPluginSettings.find((setting) => setting === item) !== undefined;
        },
        showSetting() {
            if (!this.editMode) {
                vueEventDispatcher.$emit(VueEventChannels.showSetting, this.item);
            }
        },
    },
    mounted() {
        vueEventDispatcher.$on(VueEventChannels.showSetting, (item: string) => {
            this.isActive = this.item === item;
        });
    },
    props: ["item", "translations", "config", "editMode", "dropIndicatorPosition", "draggingSource"],
    template: `
        <li @click="showSetting" :class="{ 'settings__sidebar-item--dragging-source' : draggingSource }">
            <span
                v-if="dropIndicatorPosition"
                class="settings__sidebar-drop-indicator"
                :class="'settings__sidebar-drop-indicator--' + dropIndicatorPosition"
                ></span>
            <a :class="{ 'is-active' : isActive && !editMode, 'settings__sidebar-item--draggable' : editMode }">
                <div class="settings__sidebar-name-container">
                    <span v-if="getItemIcon(item).length > 0" class="icon" v-html="getItemIcon(item)"></span>
                    <span class="settings__sidebar-name">
                        {{ getItemName(item) }}
                    </span>
                    <span v-if="editMode" class="icon is-size-7" title="">
                        <i class="fas fa-bars"></i>
                    </span>
                    <span v-else-if="isPluginSetting(item)" class="is-size-7" :class="{ 'has-text-success' : isEnabled(item), 'has-text-danger' : !isEnabled(item) }">
                        <i class="fas fa-circle"></i>
                    </span>
                </div>
            </a>
        </li>
    `,
});
