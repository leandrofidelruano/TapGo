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

    // Limita el resultado mostrado a 4 decimales. Se redondea (no se trunca) para que
    // sin(pi/6) = 0.4999999999999999 se muestre como 0,5 y se respeta el exponente de la
    // notación científica: antes, "-3.807686783083602e-16" se partía en "-3" y "8076...",
    // y el truncado convertía ese residuo de -0,00000000000000038 en un "-3,8076" inexistente.
    private formatDecimal(value: string, decimalSeparator: string): string {
        const scientificNotation = value.match(/^(.*?)([eE][+-]?\d+)$/);
        const mantissa = scientificNotation ? scientificNotation[1] : value;
        const exponent = scientificNotation ? scientificNotation[2] : "";

        const parts = mantissa.split(/[.,]/);
        if (parts.length !== 2) {
            return value;
        }

        const decimalPart = parts[1];
        if (decimalPart.length <= 4) {
            return value;
        }

        const numericValue = Number(mantissa.replace(decimalSeparator, "."));
        if (!isFinite(numericValue)) {
            return value;
        }

        const roundedValue = Math.round(numericValue * 10000) / 10000;

        if (roundedValue === 0) {
            return "0";
        }

        const roundedString = String(roundedValue);

        // Si el redondeo sale en notación científica (números gigantes con decimales) se
        // devuelve el valor original: recortarlo a 4 decimales ahí no aporta nada
        if (/[eE]/.test(roundedString)) {
            return value;
        }

        return `${roundedString.replace(".", decimalSeparator)}${exponent}`;
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
