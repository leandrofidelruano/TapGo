import { CalculatorPlugin } from "./calculator-plugin";
import { UserConfigOptions, defaultUserConfigOptions } from "../../../common/config/user-config-options";
import { englishTranslationSet } from "../../../common/translation/english-translation-set";

describe(CalculatorPlugin.name, () => {
    const createPlugin = (decimalSeparator = "."): CalculatorPlugin => {
        const config: UserConfigOptions = {
            ...defaultUserConfigOptions,
            generalOptions: {
                ...defaultUserConfigOptions.generalOptions,
                decimalSeparator,
            },
        };

        return new CalculatorPlugin(config, englishTranslationSet, () => Promise.resolve());
    };

    const getFirstName = async (input: string, decimalSeparator = "."): Promise<string> => {
        const results = await createPlugin(decimalSeparator).getSearchResults(input);
        return results[0].name;
    };

    it("should show 0 instead of the rounding residue of cos(pi/2)", async () => {
        expect(await getFirstName("cos(pi/2)")).toBe("= 0");
        expect(await getFirstName("cos(pi/2)", ",")).toBe("= 0");
        expect(await getFirstName("sen(pi)")).toBe("= 0");
    });

    it("should round to 4 decimal places instead of truncating them", async () => {
        // sin(pi/6) = 0.4999999999999999 debe mostrarse como 0,5 y no como 0,4999
        expect(await getFirstName("sin(pi/6)")).toBe("= 0.5");
        expect(await getFirstName("sin(pi/6)", ",")).toBe("= 0,5");
        expect(await getFirstName("2/3")).toBe("= 0.6667");
    });

    it("should not mangle scientific notation", async () => {
        expect(await getFirstName("sin(1.5e-20)")).toBe("= 1.5e-20");
        expect(await getFirstName("sin(1.5e-20)", ",")).toBe("= 1,5e-20");
    });

    it("should not show a fraction for results that are exactly zero", async () => {
        const results = await createPlugin().getSearchResults("cos(pi/2)");

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("= 0");
    });
});
