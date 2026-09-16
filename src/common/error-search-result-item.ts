import { SearchResultItem } from "./search-result-item";
import { PluginType } from "../main/plugin-type";
import { defaultErrorIcon } from "./icon/default-icons";
import { TapGoCommandExecutionArgument } from "../main/plugins/tapgo-command-search-plugin/tapgo-command-execution-argument";

export function getErrorSearchResultItem(name: string, description?: string): SearchResultItem {
    return {
        description: description ? description : "",
        executionArgument: TapGoCommandExecutionArgument.OpenDebugLog,
        hideMainWindowAfterExecution: true,
        icon: defaultErrorIcon,
        name,
        originPluginType: PluginType.TapGoCommandSearchPlugin,
        searchable: [],
    };
}
