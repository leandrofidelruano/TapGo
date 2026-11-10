import Vue from "vue";
import { vueEventDispatcher } from "../../vue-event-dispatcher";
import { VueEventChannels } from "../../vue-event-channels";
import { ColorThemeOptions, defaultColorThemeOptions } from "../../../common/config/color-theme-options";
import { UserConfigOptions } from "../../../common/config/user-config-options";
import { TranslationSet } from "../../../common/translation/translation-set";
import { deepCopy } from "../../../common/helpers/object-helpers";
import { isValidColorTheme } from "../../../common/helpers/color-theme-helpers";
import { colorThemes } from "../../color-themes/color-themes";
import { saveColorThemes } from "../../color-themes/color-themes-repository";

type ColorThemeColorKey = Exclude<keyof ColorThemeOptions, "name">;

interface ColorThemeColorField {
    key: ColorThemeColorKey;
    label: string;
}

interface ColorThemeColorSection {
    fields: ColorThemeColorField[];
    title: string;
}

const newThemePickerIdPrefix = "new-color-theme:";

export const colorThemeEditingModal = Vue.extend({
    computed: {
        colorSections(): ColorThemeColorSection[] {
            const translations: TranslationSet = this.translations;
            return [
                {
                    title: translations.settingsUserInputTitle,
                    fields: [
                        { key: "userInputBackgroundColor", label: translations.colorthemeUserInputBackgroundColor },
                        { key: "userInputTextColor", label: translations.colorThemeUserInputTextColor },
                    ],
                },
                {
                    title: translations.settingsSearchResultsBoxTitle,
                    fields: [
                        {
                            key: "searchResultsBackgroundColor",
                            label: translations.colorThemeSearchResultsBackgroundColor,
                        },
                        {
                            key: "searchResultsItemActiveBackgroundColor",
                            label: translations.colorThemeSearchResultsItemActiveBackgroundColor,
                        },
                        {
                            key: "searchResultsItemActiveTextColor",
                            label: translations.colorThemeSearchResultsItemActiveTextColor,
                        },
                        {
                            key: "searchResultsItemActiveDescriptionColor",
                            label: translations.colorThemeSearchResultsItemActiveDescriptionColor,
                        },
                        {
                            key: "searchResultsItemNameTextcolor",
                            label: translations.colorThemeSearchResutlsItemNameTextColor,
                        },
                        {
                            key: "searchResultsItemDescriptionTextColor",
                            label: translations.colorThemeSearchResultsItemDescriptionTextColor,
                        },
                    ],
                },
                {
                    title: translations.settingsScrollbarTitle,
                    fields: [
                        { key: "scrollbarForegroundColor", label: translations.colorThemeScrollbarForegroundColor },
                        { key: "scrollbarBackgroundColor", label: translations.colorThemeScrollbarBackgroundColor },
                    ],
                },
                {
                    title: translations.settingsPanelTitle,
                    fields: [
                        { key: "settingsBackgroundColor", label: translations.colorThemeSettingsBackgroundColor },
                        {
                            key: "settingsSidebarBackgroundColor",
                            label: translations.colorThemeSettingsSidebarBackgroundColor,
                        },
                        { key: "settingsTextColor", label: translations.colorThemeSettingsTextColor },
                        { key: "settingsSidebarTextColor", label: translations.colorThemeSettingsSidebarTextColor },
                        { key: "settingsAccentColor", label: translations.colorThemeSettingsAccentColor },
                        { key: "settingsBoxBackgroundColor", label: translations.colorThemeSettingsBoxBackgroundColor },
                    ],
                },
            ];
        },
        duplicateThemeName(): boolean {
            const name = this.newTheme.name.trim().toLowerCase();
            return name.length > 0 && colorThemes.some((colorTheme) => colorTheme.name.trim().toLowerCase() === name);
        },
        canSaveNewTheme(): boolean {
            return this.newTheme.name.trim().length > 0 && !this.duplicateThemeName && isValidColorTheme(this.newTheme);
        },
    },
    data() {
        return {
            newTheme: deepCopy(defaultColorThemeOptions),
            visible: false,
        };
    },
    methods: {
        closeModal() {
            this.visible = false;
        },
        editColor(key: ColorThemeColorKey) {
            vueEventDispatcher.$emit(VueEventChannels.editColor, `${newThemePickerIdPrefix}${key}`, this.newTheme[key]);
        },
        getPreviewColor(color: string): string {
            return `background-color: ${color};`;
        },
        getNamePlaceholder(): string {
            const translations: TranslationSet = this.translations;
            return `${translations.forExample}: "My Theme"`;
        },
        saveNewTheme() {
            if (!this.canSaveNewTheme) {
                return;
            }
            const newColorTheme: ColorThemeOptions = deepCopy(this.newTheme);
            newColorTheme.name = newColorTheme.name.trim();
            colorThemes.push(newColorTheme);
            saveColorThemes();
            this.visible = false;
        },
    },
    mounted() {
        vueEventDispatcher.$on(VueEventChannels.openColorThemeEditingModal, () => {
            const config: UserConfigOptions = this.config;
            this.newTheme = deepCopy(config.colorThemeOptions);
            this.newTheme.name = "";
            this.visible = true;
        });

        vueEventDispatcher.$on(VueEventChannels.saveColor, (pickerId: string, color: string) => {
            if (pickerId.startsWith(newThemePickerIdPrefix)) {
                const key = pickerId.substring(newThemePickerIdPrefix.length) as ColorThemeColorKey;
                this.newTheme[key] = color;
            }
        });
    },
    props: ["config", "translations"],
    template: `
    <div class="modal" :class="{ 'is-active' : visible }">
        <div class="modal-background" @click="closeModal"></div>
        <div class="modal-content color-theme-editing-modal-content">
            <div class="message">
                <div class="message-header">
                    <p>{{ translations.colorThemeAddNewColorTheme }}</p>
                    <button class="delete" aria-label="delete" @click="closeModal"></button>
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
                                v-model="newTheme.name"
                                :placeholder="getNamePlaceholder()"
                                >
                        </div>
                        <p v-if="duplicateThemeName" class="help is-danger">
                            {{ translations.colorThemeDuplicateName }}
                        </p>
                    </div>

                    <div v-for="colorSection in colorSections" :key="colorSection.title">
                        <div class="title is-5 mb-3">
                            {{ colorSection.title }}
                        </div>
                        <div
                            class="settings__option"
                            v-for="colorField in colorSection.fields"
                            :key="colorField.key"
                            >
                            <div class="settings__option-name">{{ colorField.label }}</div>
                            <div class="settings__option-content">
                                <div class="field has-addons has-addons-right">
                                    <div class="control">
                                        <button
                                            class="button preview-button"
                                            :style="getPreviewColor(newTheme[colorField.key])"
                                            @click="editColor(colorField.key)"
                                            >
                                        </button>
                                    </div>
                                    <div class="control">
                                        <input
                                            class="input font-mono"
                                            type="text"
                                            v-model="newTheme[colorField.key]"
                                            >
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="field is-grouped is-grouped-right">
                        <div class="control">
                            <button class="button is-danger" @click="closeModal">
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
    `,
});
