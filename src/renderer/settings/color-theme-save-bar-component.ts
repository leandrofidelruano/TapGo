import Vue from "vue";
import { ipcRenderer } from "electron";
import { IpcChannels } from "../../common/ipc-channels";
import { vueEventDispatcher } from "../vue-event-dispatcher";
import { VueEventChannels } from "../vue-event-channels";
import { UserConfigOptions } from "../../common/config/user-config-options";
import { ColorThemeOptions } from "../../common/config/color-theme-options";
import { TranslationSet } from "../../common/translation/translation-set";
import { deepCopy } from "../../common/helpers/object-helpers";
import { colorThemes, hasModifiedTapGoThemeColors } from "../color-themes/color-themes";
import { saveColorThemes } from "../color-themes/color-themes-repository";
import { GeneralSettings } from "./general-settings";

export const colorThemeSaveBarComponent = Vue.extend({
    computed: {
        hasUnsavedChanges(): boolean {
            const config: UserConfigOptions = this.config;
            return hasModifiedTapGoThemeColors(config.colorThemeOptions);
        },
        isActiveColorThemeSection(): boolean {
            return this.activeSetting === GeneralSettings.ColorTheme;
        },
        duplicateThemeName(): boolean {
            const name = this.newThemeName.trim().toLowerCase();
            return name.length > 0 && colorThemes.some((colorTheme) => colorTheme.name.trim().toLowerCase() === name);
        },
        canSaveNewTheme(): boolean {
            return this.newThemeName.trim().length > 0 && !this.duplicateThemeName;
        },
    },
    data() {
        return {
            activeSetting: "",
            newThemeName: "",
            saveModalVisible: false,
        };
    },
    methods: {
        closeSaveModal() {
            this.saveModalVisible = false;
        },
        getNamePlaceholder(): string {
            const translations: TranslationSet = this.translations;
            return `${translations.forExample}: "My Theme"`;
        },
        openSaveModal() {
            this.newThemeName = "";
            this.saveModalVisible = true;
        },
        onShowSetting(settingName: string) {
            this.activeSetting = settingName;
        },
        saveNewTheme() {
            if (!this.canSaveNewTheme) {
                return;
            }

            const config: UserConfigOptions = this.config;
            const newColorTheme: ColorThemeOptions = deepCopy(config.colorThemeOptions);
            newColorTheme.name = this.newThemeName.trim();
            colorThemes.push(newColorTheme);
            saveColorThemes();

            config.colorThemeOptions = deepCopy(newColorTheme);
            this.saveModalVisible = false;
            vueEventDispatcher.$emit(VueEventChannels.configUpdated, config);
        },
    },
    watch: {
        hasUnsavedChanges(hasUnsavedChanges: boolean) {
            ipcRenderer.send(IpcChannels.settingsCloseBlocked, hasUnsavedChanges);
        },
    },
    mounted() {
        ipcRenderer.send(IpcChannels.settingsCloseBlocked, this.hasUnsavedChanges);
        vueEventDispatcher.$on(VueEventChannels.showSetting, this.onShowSetting);
    },
    beforeDestroy() {
        vueEventDispatcher.$off(VueEventChannels.showSetting, this.onShowSetting);
    },
    props: ["config", "translations"],
    template: `
        <div>
            <div v-if="hasUnsavedChanges && isActiveColorThemeSection" class="color-theme-save-bar">
                <button class="button is-success" @click="openSaveModal">
                    <span class="icon"><i class="fas fa-save"></i></span>
                    <span>{{ translations.colorThemeSaveNewTheme }}</span>
                </button>
            </div>
            <div class="modal" :class="{ 'is-active' : saveModalVisible }">
                <div class="modal-background" @click="closeSaveModal"></div>
                <div class="modal-content color-theme-save-modal-content">
                    <div class="message">
                        <div class="message-header">
                            <p>{{ translations.colorThemeSaveNewTheme }}</p>
                            <button class="delete" aria-label="delete" @click="closeSaveModal"></button>
                        </div>
                        <div class="message-body">

                            <div class="field">
                                <label class="label">
                                    {{ translations.colorThemeThemeName }}
                                </label>
                                <div class="control is-expanded">
                                    <input
                                        class="input"
                                        type="text"
                                        v-model="newThemeName"
                                        :placeholder="getNamePlaceholder()"
                                        @keyup.enter="saveNewTheme"
                                        >
                                </div>
                                <p v-if="duplicateThemeName" class="help is-danger">
                                    {{ translations.colorThemeDuplicateName }}
                                </p>
                            </div>

                            <div class="field is-grouped is-grouped-right">
                                <div class="control">
                                    <button class="button is-danger" @click="closeSaveModal">
                                        <span class="icon">
                                            <i class="fas fa-times"></i>
                                        </span>
                                        <span>{{ translations.cancel }}</span>
                                    </button>
                                </div>
                                <div class="control">
                                    <button class="button is-success" :disabled="!canSaveNewTheme" @click="saveNewTheme">
                                        <span class="icon">
                                            <i class="fas fa-check"></i>
                                        </span>
                                        <span>{{ translations.save }}</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
});
