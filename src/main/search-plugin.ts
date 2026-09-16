import { SearchResultItem } from "../common/search-result-item";
import { TapGoPlugin } from "./TapGo-plugin";

export interface SearchPlugin extends TapGoPlugin {
    getAll(): Promise<SearchResultItem[]>;
    refreshIndex(): Promise<void>;
    clearCache(): Promise<void>;
}
