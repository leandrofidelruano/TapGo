import { ExecutionPlugin } from "../../execution-plugin";
import { PluginType } from "../../plugin-type";
import { SearchResultItem } from "../../../common/search-result-item";
import { UserConfigOptions } from "../../../common/config/user-config-options";
import { TranslationSet } from "../../../common/translation/translation-set";
import { Calculator } from "./calculator";
import { CalculatorOptions } from "../../../common/config/calculator-options";
import { defaultCalculatorIcon } from "../../../common/icon/default-icons";
import { GeneralOptions } from "../../../common/config/general-options";

export class CalculatorPlugin implements ExecutionPlugin {
    public pluginType = PluginType.Calculator;
    private config: CalculatorOptions;
    private generalConfig: GeneralOptions;
    private translationSet: TranslationSet;
    private readonly clipboardCopier: (value: string) => Promise<void>;

    constructor(
        config: UserConfigOptions,
        translationSet: TranslationSet,
        clipboardCopier: (value: string) => Promise<void>,
    ) {
        this.config = config.calculatorOptions;
        this.generalConfig = config.generalOptions;
        this.translationSet = translationSet;
        this.clipboardCopier = clipboardCopier;
    }

    public isValidUserInput(userInput: string): boolean {
        return Calculator.isValidInput(userInput, this.generalConfig.decimalSeparator, this.getArgumentSeparator());
    }

    private getArgumentSeparator() {
        if (this.generalConfig.decimalSeparator !== ",") {
            return ",";
        }
        return ";";
    }

    public getSearchResults(userInput: string): Promise<SearchResultItem[]> {
        return new Promise((resolve) => {
            const result = Calculator.calculateWithFraction(
                userInput,
                Number(this.config.precision),
                this.generalConfig.decimalSeparator,
                this.getArgumentSeparator(),
            );

            const results: SearchResultItem[] = [];

            // Result 1: decimal (limited to 4 decimal places)
            const decimalDisplay = this.formatDecimal(result.decimal, this.generalConfig.decimalSeparator);
            results.push({
                description: this.translationSet.calculatorCopyToClipboard,
                executionArgument: decimalDisplay,
                hideMainWindowAfterExecution: true,
                icon: defaultCalculatorIcon,
                name: `= ${decimalDisplay}`,
                originPluginType: this.pluginType,
                searchable: [],
            });

            // Result 2: fraction (if available)
            if (result.fraction) {
                results.push({
                    description: this.translationSet.calculatorCopyToClipboard,
                    executionArgument: result.fraction,
                    hideMainWindowAfterExecution: true,
                    icon: defaultCalculatorIcon,
                    name: `= ${result.fraction}`,
                    originPluginType: this.pluginType,
                    searchable: [],
                });
            }

            resolve(results);
        });
    }

    private formatDecimal(value: string, decimalSeparator: string): string {
        const parts = value.split(/[.,]/);
        if (parts.length !== 2) {
            return value;
        }

        const intPart = parts[0];
        const decPart = parts[1];

        if (decPart.length <= 4) {
            return value;
        }

        const truncated = decPart.substring(0, 4);
        return `${intPart}${decimalSeparator}${truncated}`;
    }

    public isEnabled(): boolean {
        return this.config.isEnabled;
    }

    public execute(searchResultItem: SearchResultItem): Promise<void> {
        return this.clipboardCopier(searchResultItem.executionArgument);
    }

    public updateConfig(updatedConfig: UserConfigOptions, translationSet: TranslationSet): Promise<void> {
        return new Promise((resolve) => {
            this.config = updatedConfig.calculatorOptions;
            this.generalConfig = updatedConfig.generalOptions;
            this.translationSet = translationSet;
            resolve();
        });
    }
}
