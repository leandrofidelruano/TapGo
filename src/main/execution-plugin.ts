import { SearchResultItem } from "../common/search-result-item";
import { TapGoPlugin } from "./TapGo-plugin";

export interface ExecutionPlugin extends TapGoPlugin {
    isValidUserInput(userInput: string, fallback?: boolean): boolean;
    getSearchResults(userInput: string, fallback?: boolean): Promise<SearchResultItem[]>;
}
