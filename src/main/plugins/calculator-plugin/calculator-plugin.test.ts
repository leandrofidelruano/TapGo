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

        // El símbolo π debe comportarse igual que la constante pi
        expect(await getFirstName("cos(π/2)")).toBe("= 0");
        expect(await getFirstName("cos(π/2)", ",")).toBe("= 0");
        expect(await getFirstName("sin(π/6)")).toBe("= 0.5");
        expect(await getFirstName("sin(π/6)", ",")).toBe("= 0,5");
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

    it("should show the radical expression as second result", async () => {
        const results = await createPlugin().getSearchResults("√2/2");

        expect(results).toHaveLength(2);
        expect(results[0].name).toBe("= 0.7071");
        expect(results[1].name).toBe("= √2/2");
        expect(results[1].executionArgument).toBe("√2/2");
    });

    it("should show the radical expression with locale decimal separator", async () => {
        const results = await createPlugin(",").getSearchResults("√2");

        expect(results).toHaveLength(2);
        expect(results[0].name).toBe("= 1,4142");
        expect(results[1].name).toBe("= √2");
    });

    it("should keep the fraction as second result when the value is rational", async () => {
        const results = await createPlugin().getSearchResults("√4/6");

        expect(results).toHaveLength(2);
        expect(results[1].name).toBe("= 1/3");
    });

    it("should show the radical expression as second result for trigonometric input", async () => {
        const results = await createPlugin().getSearchResults("cos(pi/4)");

        expect(results).toHaveLength(2);
        expect(results[0].name).toBe("= 0.7071");
        expect(results[1].name).toBe("= √2/2");
        expect(results[1].executionArgument).toBe("√2/2");
    });

    it("should show the expression with Euler's number as second result", async () => {
        const constant = await createPlugin().getSearchResults("e");

        expect(constant).toHaveLength(2);
        expect(constant[0].name).toBe("= 2.7183");
        expect(constant[1].name).toBe("= e");

        const power = await createPlugin().getSearchResults("e^2");

        expect(power).toHaveLength(2);
        expect(power[0].name).toBe("= 7.3891");
        expect(power[1].name).toBe("= e^2");
        expect(power[1].executionArgument).toBe("e^2");
    });
});
