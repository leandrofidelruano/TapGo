import { SearchPlugin } from "../../search-plugin";
import { PluginType } from "../../plugin-type";
import { SearchResultItem } from "../../../common/search-result-item";
import { UserConfigOptions } from "../../../common/config/user-config-options";
import { TapGoCommand } from "./tapgo-command";
import { IconType } from "../../../common/icon/icon-type";
import { TapGoCommandExecutionArgument } from "./tapgo-command-execution-argument";
import { ipcMain } from "electron";
import { IpcChannels } from "../../../common/ipc-channels";
import { TranslationSet } from "../../../common/translation/translation-set";

export class TapGoCommandSearchPlugin implements SearchPlugin {
    public readonly pluginType = PluginType.TapGoCommandSearchPlugin;
    private translationSet: TranslationSet;
    private readonly icon = `
    <svg version="1.1" id="Ebene_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 600 600" xml:space="preserve">
        <path d="M59,121.6l81.3-46.9c5.9-3.4,13.1-3.4,18.9,0l80.8,46.9c5.8,3.4,9.4,9.6,9.4,16.4v187.2c0,14.6,15.8,23.7,28.4,16.4l62.4-36
            c5.9-3.4,9.5-9.6,9.5-16.4l0-209c0-6.8,3.6-13,9.5-16.4l81-46.8c5.9-3.4,13.1-3.4,18.9,0l81,46.8c5.9,3.4,9.5,9.6,9.5,16.4v324.4
            c0,6.8-3.6,13-9.5,16.4L259.2,583.1c-5.9,3.4-13.1,3.4-18.9,0L59,478.4c-5.9-3.4-9.5-9.6-9.5-16.4V137.9
            C49.6,131.2,53.2,124.9,59,121.6z"/>
    </svg>
    `;

    constructor(translationSet: TranslationSet) {
        this.translationSet = translationSet;
    }

    public isEnabled(): boolean {
        return true;
    }

    public getAll(): Promise<SearchResultItem[]> {
        return new Promise((resolve) => {
            const result = this.getAllCommands().map((command) => this.createSearchResultItemFromTapGoCommand(command));
            resolve(result);
        });
    }

    public execute(searchResultItem: SearchResultItem): Promise<void> {
        return new Promise((resolve, reject) => {
            const TapGoCommand = this.getAllCommands().find(
                (command) => command.executionArgument === searchResultItem.executionArgument,
            );
            if (TapGoCommand) {
                ipcMain.emit(IpcChannels.TapGoCommandExecuted, TapGoCommand);
                resolve();
            } else {
                reject("Error while trying to execute TapGo command: Invalid TapGo command");
            }
        });
    }

    public refreshIndex(): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public clearCache(): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public updateConfig(updatedConfig: UserConfigOptions, tranlsationSet: TranslationSet): Promise<void> {
        return new Promise((resolve) => {
            this.translationSet = tranlsationSet;
            resolve();
        });
    }

    private createSearchResultItemFromTapGoCommand(TapGoCommand: TapGoCommand): SearchResultItem {
        return {
            description: TapGoCommand.description,
            executionArgument: TapGoCommand.executionArgument,
            hideMainWindowAfterExecution: TapGoCommand.hideMainWindowAfterExecution,
            icon: {
                parameter: this.icon,
                type: IconType.SVG,
            },
            name: TapGoCommand.name,
            originPluginType: this.pluginType,
            searchable: [TapGoCommand.name],
        };
    }

    private getAllCommands(): TapGoCommand[] {
        return [
            {
                description: this.translationSet.TapGoCommandExitDescription,
                executionArgument: TapGoCommandExecutionArgument.Exit,
                hideMainWindowAfterExecution: true,
                name: this.translationSet.TapGoCommandExit,
            },
            {
                description: this.translationSet.TapGoCommandReloadDescription,
                executionArgument: TapGoCommandExecutionArgument.Reload,
                hideMainWindowAfterExecution: false,
                name: this.translationSet.TapGoCommandReload,
            },
            {
                description: this.translationSet.TapGoCommandEditSettingsFileDescription,
                executionArgument: TapGoCommandExecutionArgument.EditConfigFile,
                hideMainWindowAfterExecution: true,
                name: this.translationSet.TapGoCommandEditSettingsFile,
            },
            {
                description: this.translationSet.TapGoCommandOpenSettingsDescription,
                executionArgument: TapGoCommandExecutionArgument.OpenSettings,
                hideMainWindowAfterExecution: false,
                name: this.translationSet.TapGoCommandOpenSettings,
            },
            {
                description: this.translationSet.TapGoCommandRefreshIndexesDescription,
                executionArgument: TapGoCommandExecutionArgument.RefreshIndexes,
                hideMainWindowAfterExecution: false,
                name: this.translationSet.TapGoCommandRefreshIndexes,
            },
            {
                description: this.translationSet.TapGoCommandClearCachesDescription,
                executionArgument: TapGoCommandExecutionArgument.ClearCaches,
                hideMainWindowAfterExecution: false,
                name: this.translationSet.TapGoCommandClearCaches,
            },
            {
                description: this.translationSet.TapGoCommandOpenDebugLogDescription,
                executionArgument: TapGoCommandExecutionArgument.OpenDebugLog,
                hideMainWindowAfterExecution: true,
                name: this.translationSet.TapGoCommandOpenDebugLog,
            },
        ];
    }
}
