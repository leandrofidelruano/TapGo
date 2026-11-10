import Vue from "vue";
import { vueEventDispatcher } from "../vue-event-dispatcher";
import { VueEventChannels } from "../vue-event-channels";
import { UserConfigOptions } from "../../common/config/user-config-options";
import { defaultColorThemeOptions } from "../../common/config/color-theme-options";
import { GeneralSettings } from "./general-settings";
import { getFilePath, getFolderPath } from "../dialogs";
import { join } from "path";
import { FileHelpers } from "../../common/helpers/file-helpers";
import { TranslationSet } from "../../common/translation/translation-set";
import { NotificationType } from "../../common/notification-type";
import { ColorThemeOptions } from "../../common/config/color-theme-options";
import { isValidColorTheme } from "../../common/helpers/color-theme-helpers";
import { showNotification } from "../notifications";
import { colorThemes, tapGoTheme } from "../color-themes/color-themes";
import { saveColorThemes, updateStoredColorTheme } from "../color-themes/color-themes-repository";
import { UserConfirmationDialogParams, UserConfirmationDialogType } from "./modals/user-confirmation-dialog-params";
import { deepCopy } from "../../common/helpers/object-helpers";

export const colorThemeSettingsComponent = Vue.extend({
    data() {
        return {
            colorThemeEditMode: false,
            colorThemes,
            draggedColorThemeIndex: -1,
            dropIndicatorIndex: -1,
            dropIndicatorPosition: "",
            dropdownVisible: false,
            presetDropdownVisible: false,
            settingName: GeneralSettings.ColorTheme,
            visible: false,
        };
    },
    methods: {
        resetAll() {
            const translations: TranslationSet = this.translations;
            const userConfirmationDialogParams: UserConfirmationDialogParams = {
                callback: () => {
                    const config: UserConfigOptions = this.config;
                    config.colorThemeOptions = deepCopy(defaultColorThemeOptions);
                    this.updateConfig();
                },
                message: translations.colorThemeSettingsResetWarning,
                modalTitle: translations.resetToDefault,
                type: UserConfirmationDialogType.Default,
            };
            vueEventDispatcher.$emit(VueEventChannels.settingsConfirmation, userConfirmationDialogParams);
        },
        resetUserInputBackgroundColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.userInputBackgroundColor = defaultColorThemeOptions.userInputBackgroundColor;
            this.updateConfig();
        },
        resetUserInputTextColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.userInputTextColor = defaultColorThemeOptions.userInputTextColor;
            this.updateConfig();
        },
        resetSearchResultsBackgroundColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.searchResultsBackgroundColor =
                defaultColorThemeOptions.searchResultsBackgroundColor;
            this.updateConfig();
        },
        resetSearchResultsItemActiveBackgroundColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.searchResultsItemActiveBackgroundColor =
                defaultColorThemeOptions.searchResultsItemActiveBackgroundColor;
            this.updateConfig();
        },
        resetSearchResultsItemActiveTextColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.searchResultsItemActiveTextColor =
                defaultColorThemeOptions.searchResultsItemActiveTextColor;
            this.updateConfig();
        },
        resetSearchResultsItemActiveDescriptionColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.searchResultsItemActiveDescriptionColor =
                defaultColorThemeOptions.searchResultsItemActiveDescriptionColor;
            this.updateConfig();
        },
        resetSearchResultsItemNameTextColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.searchResultsItemNameTextcolor =
                defaultColorThemeOptions.searchResultsItemNameTextcolor;
            this.updateConfig();
        },
        resetSearchResultsItemDescriptionTextColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.searchResultsItemDescriptionTextColor =
                defaultColorThemeOptions.searchResultsItemDescriptionTextColor;
            this.updateConfig();
        },
        resetScrollbarForegroundColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.scrollbarForegroundColor = defaultColorThemeOptions.scrollbarForegroundColor;
            this.updateConfig();
        },
        resetScrollbarBackgroundColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.scrollbarBackgroundColor = defaultColorThemeOptions.scrollbarBackgroundColor;
            this.updateConfig();
        },
        resetSettingsBackgroundColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.settingsBackgroundColor = defaultColorThemeOptions.settingsBackgroundColor;
            this.updateConfig();
        },
        resetSettingsSidebarBackgroundColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.settingsSidebarBackgroundColor =
                defaultColorThemeOptions.settingsSidebarBackgroundColor;
            this.updateConfig();
        },
        resetSettingsTextColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.settingsTextColor = defaultColorThemeOptions.settingsTextColor;
            this.updateConfig();
        },
        resetSettingsSidebarTextColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.settingsSidebarTextColor = defaultColorThemeOptions.settingsSidebarTextColor;
            this.updateConfig();
        },
        resetSettingsAccentColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.settingsAccentColor = defaultColorThemeOptions.settingsAccentColor;
            this.updateConfig();
        },
        resetSettingsBoxBackgroundColor() {
            const config: UserConfigOptions = this.config;
            config.colorThemeOptions.settingsBoxBackgroundColor = defaultColorThemeOptions.settingsBoxBackgroundColor;
            this.updateConfig();
        },
        updateConfig() {
            updateStoredColorTheme(this.config.colorThemeOptions);
            vueEventDispatcher.$emit(VueEventChannels.configUpdated, this.config);
        },
        getPreviewColor(color: string): string {
            return `background-color: ${color};`;
        },
        editColor(pickerId: string, color: string) {
            vueEventDispatcher.$emit(VueEventChannels.editColor, pickerId, color);
        },
        changeColorTheme(name: string) {
            const colorTheme = colorThemes.find((c) => c.name === name);
            if (colorTheme) {
                const config: UserConfigOptions = this.config;
                config.colorThemeOptions = deepCopy(colorTheme);
                this.updateConfig();
            } else {
                showNotification("No color theme preset found", NotificationType.Error);
            }
        },
        updateColor(pickerId: string, color: string) {
            Object.keys(this.config.colorThemeOptions).forEach((key) => {
                if (key === pickerId) {
                    this.config.colorThemeOptions[key] = color;
                }
            });
            this.updateConfig();
        },
        toggleDropDown() {
            if (this.dropdownVisible) {
                this.dropdownVisible = false;
            } else {
                this.closeColorThemeList();
                this.dropdownVisible = true;
            }
        },
        closeColorThemeList() {
            this.presetDropdownVisible = false;
            this.colorThemeEditMode = false;
            this.resetColorThemeDragState();
        },
        togglePresetDropDown() {
            if (this.presetDropdownVisible) {
                this.closeColorThemeList();
            } else {
                this.dropdownVisible = false;
                this.presetDropdownVisible = true;
            }
        },
        openColorThemeEditingModal() {
            this.closeColorThemeList();
            this.dropdownVisible = false;
            vueEventDispatcher.$emit(VueEventChannels.openColorThemeEditingModal);
        },
        onDocumentClick(event: MouseEvent) {
            const target = event.target as Node;
            const themeListDropdown = this.$refs.themeListDropdown as HTMLElement;
            const importExportDropdown = this.$refs.importExportDropdown as HTMLElement;
            if (this.dropdownVisible && importExportDropdown && !importExportDropdown.contains(target)) {
                this.dropdownVisible = false;
            }
            if (this.presetDropdownVisible && themeListDropdown && !themeListDropdown.contains(target)) {
                this.closeColorThemeList();
            }
        },
        toggleColorThemeEditMode() {
            this.colorThemeEditMode = !this.colorThemeEditMode;
            this.resetColorThemeDragState();
        },
        onColorThemeItemClick(colorTheme: ColorThemeOptions, event: MouseEvent) {
            if (this.colorThemeEditMode) {
                event.preventDefault();
                return;
            }
            this.changeColorTheme(colorTheme.name);
        },
        onColorThemeItemMouseDown(index: number, event: MouseEvent) {
            if (!this.colorThemeEditMode) {
                return;
            }
            event.preventDefault();
            this.draggedColorThemeIndex = index;
            window.addEventListener("mouseup", this.finishColorThemeDrag, { once: true });
        },
        onColorThemeListMouseMove(event: MouseEvent) {
            if (this.draggedColorThemeIndex < 0) {
                return;
            }
            const target = event.target as HTMLElement;
            const colorThemeItem = target.closest("[data-theme-index]") as HTMLElement | null;
            if (!colorThemeItem) {
                return;
            }
            const rect = colorThemeItem.getBoundingClientRect();
            this.dropIndicatorIndex = Number(colorThemeItem.dataset.themeIndex);
            this.dropIndicatorPosition = event.clientY - rect.top < rect.height / 2 ? "top" : "bottom";
        },
        finishColorThemeDrag() {
            if (this.draggedColorThemeIndex < 0 || this.dropIndicatorIndex < 0) {
                this.resetColorThemeDragState();
                return;
            }
            let targetIndex =
                this.dropIndicatorPosition === "bottom" ? this.dropIndicatorIndex + 1 : this.dropIndicatorIndex;
            const movedColorTheme = colorThemes.splice(this.draggedColorThemeIndex, 1)[0];
            if (this.draggedColorThemeIndex < targetIndex) {
                targetIndex -= 1;
            }
            colorThemes.splice(targetIndex, 0, movedColorTheme);
            this.resetColorThemeDragState();
            saveColorThemes();
        },
        resetColorThemeDragState() {
            this.draggedColorThemeIndex = -1;
            this.dropIndicatorIndex = -1;
            this.dropIndicatorPosition = "";
        },
        canDeleteColorTheme(colorTheme: ColorThemeOptions): boolean {
            return colorTheme.name !== tapGoTheme.name;
        },
        deleteColorTheme(index: number) {
            const colorTheme = colorThemes[index];
            if (!colorTheme || !this.canDeleteColorTheme(colorTheme)) {
                return;
            }
            const translations: TranslationSet = this.translations;
            const userConfirmationDialogParams: UserConfirmationDialogParams = {
                callback: () => {
                    const colorThemeIndex = colorThemes.indexOf(colorTheme);
                    if (colorThemeIndex > -1) {
                        colorThemes.splice(colorThemeIndex, 1);
                        saveColorThemes();
                    }
                },
                message: translations.colorThemeDeleteWarning,
                modalTitle: translations.remove,
                type: UserConfirmationDialogType.Error,
            };
            vueEventDispatcher.$emit(VueEventChannels.settingsConfirmation, userConfirmationDialogParams);
        },
        importColorTheme() {
            getFilePath([{ extensions: ["json"], name: "JSON" }])
                .then((filePath: string) => {
                    const translations: TranslationSet = this.translations;
                    if (filePath) {
                        FileHelpers.readFile(filePath)
                            .then((fileContent: string) => {
                                const colorThemeOptions = JSON.parse(fileContent) as ColorThemeOptions;
                                const mergedTheme = Object.assign(
                                    {},
                                    deepCopy(defaultColorThemeOptions),
                                    colorThemeOptions,
                                );
                                if (isValidColorTheme(mergedTheme)) {
                                    const config: UserConfigOptions = this.config;
                                    config.colorThemeOptions = mergedTheme;
                                    this.updateConfig();
                                    vueEventDispatcher.$emit(
                                        VueEventChannels.notification,
                                        translations.colorThemeImportSucceeded,
                                        NotificationType.Info,
                                    );
                                } else {
                                    vueEventDispatcher.$emit(
                                        VueEventChannels.notification,
                                        translations.colorThemeInvalidColorTheme,
                                        NotificationType.Error,
                                    );
                                }
                            })
                            .catch(() =>
                                vueEventDispatcher.$emit(
                                    VueEventChannels.notification,
                                    translations.colorThemeImportFailed,
                                    NotificationType.Error,
                                ),
                            );
                    }
                })
                .catch(() => {
                    // do nothing if no file selected
                });
        },
        exportColorTheme() {
            getFolderPath()
                .then((folderPath: string) => {
                    if (folderPath) {
                        const translations: TranslationSet = this.translations;
                        const config: UserConfigOptions = this.config;
                        const fileContent = JSON.stringify(config.colorThemeOptions);
                        const filePath = join(folderPath, "TapGo-color-theme.json");
                        FileHelpers.writeFile(filePath, fileContent)
                            .then(() =>
                                vueEventDispatcher.$emit(
                                    VueEventChannels.notification,
                                    translations.colorThemeExportSucceeded,
                                    NotificationType.Info,
                                ),
                            )
                            .catch(() =>
                                vueEventDispatcher.$emit(
                                    VueEventChannels.notification,
                                    translations.colorThemeExportFailed,
                                    NotificationType.Error,
                                ),
                            );
                    }
                })
                .catch(() => {
                    // do nothing when no folder selected
                });
        },
    },
    mounted() {
        vueEventDispatcher.$on(VueEventChannels.showSetting, (settingName: string) => {
            if (this.settingName === settingName) {
                this.visible = true;
            } else {
                this.visible = false;
                this.closeColorThemeList();
                this.dropdownVisible = false;
            }
        });

        vueEventDispatcher.$on(VueEventChannels.saveColor, (pickerId: string, color: string) => {
            this.updateColor(pickerId, color);
        });

        document.addEventListener("click", this.onDocumentClick);
    },
    beforeDestroy() {
        document.removeEventListener("click", this.onDocumentClick);
    },
    props: ["config", "translations"],
    template: `
    <div v-if="visible">
        <div class="settings__setting-title title is-3">
            <span>
                {{ translations.colorThemeSettings }}
            </span>
            <div>
                <button class="button" @click="resetAll">
                    <span class="icon"><i class="fas fa-undo-alt"></i></span>
                </button>
                <div ref="importExportDropdown" class="dropdown is-right" :class="{ 'is-active' : dropdownVisible}">
                    <div class="dropdown-trigger">
                        <button class="button" aria-haspopup="true" aria-controls="dropdown-menu" @click="toggleDropDown">
                            <span class="icon">
                                <i class="fas fa-ellipsis-v"></i>
                            </span>
                        </button>
                    </div>
                    <div class="dropdown-menu" id="dropdown-menu" role="menu">
                        <div class="dropdown-content">
                            <a href="#" class="dropdown-item" @click="importColorTheme">
                                <span class="icon"><i class="fa fa-file-import"></i></span>
                                <span>{{ translations.colorThemeSettingsImportColorTheme }}</span>
                            </a>
                            <a href="#" class="dropdown-item" @click="exportColorTheme">
                                <span class="icon"><i class="fa fa-file-export"></i></span>
                                <span>{{ translations.colorThemeSettingsExportColorTheme }}</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div ref="themeListDropdown" class="dropdown is-right" :class="{ 'is-active' : presetDropdownVisible}">
                    <div class="dropdown-trigger">
                        <button class="button" aria-haspopup="true" aria-controls="dropdown-menu" @click="togglePresetDropDown">
                            <span class="icon">
                                <i class="fas fa-swatchbook"></i>
                            </span>
                        </button>
                    </div>
                    <div class="dropdown-menu color-theme-dropdown-menu" id="dropdown-menu" role="menu">
                        <div
                            class="dropdown-content color-theme-dropdown"
                            :class="{ 'color-theme-dropdown--dragging' : draggedColorThemeIndex >= 0 }"
                            >
                            <div class="menu-label settings__sidebar-menu-label color-theme-dropdown-header">
                                <span>{{ translations.colorThemeThemeList }}</span>
                                <span class="settings__sidebar-menu-actions">
                                    <button
                                        class="settings__sidebar-menu-button tooltip"
                                        :class="{ 'is-active': colorThemeEditMode }"
                                        :data-tooltip="translations.colorThemeReorder"
                                        @click="toggleColorThemeEditMode"
                                        >
                                        <span class="icon"><i class="fas fa-pen"></i></span>
                                    </button>
                                </span>
                            </div>
                            <div class="color-theme-dropdown-list" @mousemove="onColorThemeListMouseMove">
                                <a
                                    v-for="(colorTheme, index) in colorThemes"
                                    :key="colorTheme.name"
                                    href="#"
                                    class="dropdown-item color-theme-dropdown-item"
                                    :class="{
                                        'color-theme-dropdown-item--draggable': colorThemeEditMode,
                                        'color-theme-dropdown-item--dragging-source': draggedColorThemeIndex === index,
                                    }"
                                    :data-theme-index="index"
                                    @click="onColorThemeItemClick(colorTheme, $event)"
                                    @mousedown="onColorThemeItemMouseDown(index, $event)"
                                    >
                                    <span
                                        v-if="dropIndicatorIndex === index && dropIndicatorPosition"
                                        class="color-theme-drop-indicator"
                                        :class="'color-theme-drop-indicator--' + dropIndicatorPosition"
                                        ></span>
                                    <span class="color-theme-dropdown-item-name">
                                        {{ colorTheme.name }}
                                    </span>
                                    <span v-if="colorThemeEditMode" class="color-theme-dropdown-item-actions">
                                        <button
                                            v-if="canDeleteColorTheme(colorTheme)"
                                            class="color-theme-dropdown-item-delete"
                                            :title="translations.remove"
                                            @mousedown.stop
                                            @click.stop="deleteColorTheme(index)"
                                            >
                                            <span class="icon is-size-7"><i class="fas fa-trash"></i></span>
                                        </button>
                                        <span class="icon is-size-7">
                                            <i class="fas fa-bars"></i>
                                        </span>
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    class="button"
                    :title="translations.colorThemeAddNewColorTheme"
                    @click="openColorThemeEditingModal"
                    >
                    <span class="icon">
                        <i class="fas fa-plus"></i>
                    </span>
                </button>
            </div>
        </div>
        <div class="box">
            <div class="settings__options-container">

                <div class="settings__setting-content-item-title mb-4">
                    <div class="title is-5">
                        {{ translations.settingsUserInputTitle }}
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorthemeUserInputBackgroundColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.userInputBackgroundColor)"
                                    @click="editColor('userInputBackgroundColor', config.colorThemeOptions.userInputBackgroundColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.userInputBackgroundColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetUserInputBackgroundColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeUserInputTextColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.userInputTextColor)"
                                    @click="editColor('userInputTextColor', config.colorThemeOptions.userInputTextColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.userInputTextColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetUserInputTextColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div class="settings__options-container">
        </div class="box">
        <div class="box">
            <div class="settings__options-container">

                <div class="settings__setting-content-item-title mb-4">
                    <div class="title is-5">
                        {{ translations.settingsSearchResultsBoxTitle }}
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSearchResultsBackgroundColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.searchResultsBackgroundColor)"
                                    @click="editColor('searchResultsBackgroundColor', config.colorThemeOptions.searchResultsBackgroundColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.searchResultsBackgroundColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSearchResultsBackgroundColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSearchResultsItemActiveBackgroundColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.searchResultsItemActiveBackgroundColor)"
                                    @click="editColor('searchResultsItemActiveBackgroundColor', config.colorThemeOptions.searchResultsItemActiveBackgroundColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.searchResultsItemActiveBackgroundColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSearchResultsItemActiveBackgroundColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSearchResultsItemActiveTextColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.searchResultsItemActiveTextColor)"
                                    @click="editColor('searchResultsItemActiveTextColor', config.colorThemeOptions.searchResultsItemActiveTextColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.searchResultsItemActiveTextColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSearchResultsItemActiveTextColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSearchResultsItemActiveDescriptionColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.searchResultsItemActiveDescriptionColor)"
                                    @click="editColor('searchResultsItemActiveDescriptionColor', config.colorThemeOptions.searchResultsItemActiveDescriptionColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.searchResultsItemActiveDescriptionColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSearchResultsItemActiveDescriptionColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSearchResutlsItemNameTextColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.searchResultsItemNameTextcolor)"
                                    @click="editColor('searchResultsItemNameTextcolor', config.colorThemeOptions.searchResultsItemNameTextcolor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.searchResultsItemNameTextcolor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSearchResultsItemNameTextColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSearchResultsItemDescriptionTextColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.searchResultsItemDescriptionTextColor)"
                                    @click="editColor('searchResultsItemDescriptionTextColor', config.colorThemeOptions.searchResultsItemDescriptionTextColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.searchResultsItemDescriptionTextColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSearchResultsItemDescriptionTextColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div class="settings__options-container">
        </div class="box">
        <div class="box">
            <div class="settings__options-container">

                <div class="settings__setting-content-item-title mb-4">
                    <div class="title is-5">
                        {{ translations.settingsScrollbarTitle }}
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeScrollbarForegroundColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.scrollbarForegroundColor)"
                                    @click="editColor('scrollbarForegroundColor', config.colorThemeOptions.scrollbarForegroundColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.scrollbarForegroundColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetScrollbarForegroundColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeScrollbarBackgroundColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.scrollbarBackgroundColor)"
                                    @click="editColor('scrollbarBackgroundColor', config.colorThemeOptions.scrollbarBackgroundColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.scrollbarBackgroundColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetScrollbarBackgroundColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div class="settings__options-container">
        </div class="box">
        <div class="box">
            <div class="settings__options-container">

                <div class="settings__setting-content-item-title mb-4">
                    <div class="title is-5">
                        {{ translations.settingsPanelTitle }}
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSettingsBackgroundColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.settingsBackgroundColor)"
                                    @click="editColor('settingsBackgroundColor', config.colorThemeOptions.settingsBackgroundColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.settingsBackgroundColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSettingsBackgroundColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSettingsSidebarBackgroundColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.settingsSidebarBackgroundColor)"
                                    @click="editColor('settingsSidebarBackgroundColor', config.colorThemeOptions.settingsSidebarBackgroundColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.settingsSidebarBackgroundColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSettingsSidebarBackgroundColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSettingsTextColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.settingsTextColor)"
                                    @click="editColor('settingsTextColor', config.colorThemeOptions.settingsTextColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.settingsTextColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSettingsTextColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSettingsSidebarTextColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.settingsSidebarTextColor)"
                                    @click="editColor('settingsSidebarTextColor', config.colorThemeOptions.settingsSidebarTextColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.settingsSidebarTextColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSettingsSidebarTextColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSettingsAccentColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.settingsAccentColor)"
                                    @click="editColor('settingsAccentColor', config.colorThemeOptions.settingsAccentColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.settingsAccentColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSettingsAccentColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings__option">
                    <div class="settings__option-name">{{ translations.colorThemeSettingsBoxBackgroundColor }}</div>
                    <div class="settings__option-content">
                        <div class="field has-addons has-addons-right">
                            <div class="control">
                                <button
                                    class="button preview-button"
                                    :style="getPreviewColor(config.colorThemeOptions.settingsBoxBackgroundColor)"
                                    @click="editColor('settingsBoxBackgroundColor', config.colorThemeOptions.settingsBoxBackgroundColor)"
                                    >
                                </button>
                            </div>
                            <div class="control">
                                <input
                                    class="input font-mono"
                                    type="text"
                                    v-model="config.colorThemeOptions.settingsBoxBackgroundColor"
                                    @change="updateConfig"
                                    >
                            </div>
                            <div class="control">
                                <button class="button" @click="resetSettingsBoxBackgroundColor">
                                    <span class="icon">
                                        <i class="fas fa-undo-alt"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div class="settings__options-container">
        </div class="box">

        <color-theme-editing-modal :config="config" :translations="translations"></color-theme-editing-modal>
        <color-picker :translations="translations"></color-picker>
    </div>
    `,
});
