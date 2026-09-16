import { Calculator } from "./calculator";
import { InputOutputCombination } from "../../../tests/test-helper";

describe(Calculator.name, () => {
    describe(Calculator.calculate.name, () => {
        it("should return the correct result", () => {
            const precision = 16;
            const inputOutputCombinations: InputOutputCombination<string, string>[] = [
                {
                    input: "1.1 - 1",
                    output: "0.1",
                },
                {
                    input: "[[1,2,3] * 2, [4,5,6]] + [[6,7,8],[9,10,11]]",
                    output: "[[8, 11, 14], [13, 15, 17]]",
                },
                {
                    input: "pow(2,6) == 2^(re(10i + 6))",
                    output: "true",
                },
            ];

            inputOutputCombinations.forEach((combination) => {
                const actual = Calculator.calculate(combination.input, precision);
                const expected = combination.output;
                expect(actual).toBe(expected);
            });
        });

        it("should use specified precision", () => {
            const calculation = "1/3";
            const inputOutputCombinations: InputOutputCombination<number, string>[] = [
                { input: 1, output: "0.3" },
                { input: 16, output: "0.3333333333333333" },
            ];

            inputOutputCombinations.forEach((combination) => {
                const actual = Calculator.calculate(calculation, combination.input);
                const epxected = combination.output;
                expect(actual).toBe(epxected);
            });
        });

        it("should use specified decimal and argument separators", () => {
            const calculation = "sum(1,2; 3)";
            const decimalSeparator = ",";
            const argumentSeparator = ";";

            const actual = Calculator.calculate(calculation, 10, decimalSeparator, argumentSeparator);

            expect(actual).toBe("4,2");
        });

        it("should use default precision if specified precision is outside of allowed range", () => {
            const calculation = "1/3";
            const invalidPrecisions = [-1, 65, 91243, -243];
            const expected = "0.3333333333333333";

            invalidPrecisions.forEach((invalidPrecision) => {
                const actual = Calculator.calculate(calculation, invalidPrecision);
                expect(actual).toBe(expected);
            });
        });

        it("should handle null", () => {
            const precision = 16;
            const calculation = "null";
            const expected = "null";

            const result = Calculator.calculate(calculation, precision);
            expect(result).toBe(expected);
        });
    });

    describe(Calculator.toFraction.name, () => {
        it("should convert simple decimals to fractions", () => {
            expect(Calculator.toFraction(0.5)).toBe("1/2");
            expect(Calculator.toFraction(0.25)).toBe("1/4");
            expect(Calculator.toFraction(0.75)).toBe("3/4");
            expect(Calculator.toFraction(0.6)).toBe("3/5");
            expect(Calculator.toFraction(0.2)).toBe("1/5");
        });

        it("should convert improper fractions", () => {
            expect(Calculator.toFraction(2.5)).toBe("5/2");
            expect(Calculator.toFraction(3.75)).toBe("15/4");
        });

        it("should handle negative decimals", () => {
            expect(Calculator.toFraction(-0.5)).toBe("-1/2");
            expect(Calculator.toFraction(-0.25)).toBe("-1/4");
        });

        it("should return null for integers", () => {
            expect(Calculator.toFraction(1)).toBeNull();
            expect(Calculator.toFraction(5)).toBeNull();
            expect(Calculator.toFraction(0)).toBe("0/1");
        });

        it("should return null for non-finite values", () => {
            expect(Calculator.toFraction(Infinity)).toBeNull();
            expect(Calculator.toFraction(-Infinity)).toBeNull();
            expect(Calculator.toFraction(NaN)).toBeNull();
        });
    });

    describe(Calculator.calculateWithFraction.name, () => {
        it("should return decimal and fraction for 6/10", () => {
            const result = Calculator.calculateWithFraction("6/10", 16);
            expect(result.decimal).toBe("0.6");
            expect(result.fraction).toBe("3/5");
        });

        it("should return decimal and fraction for 1/4", () => {
            const result = Calculator.calculateWithFraction("1/4", 16);
            expect(result.decimal).toBe("0.25");
            expect(result.fraction).toBe("1/4");
        });

        it("should return null fraction for integers", () => {
            const result = Calculator.calculateWithFraction("2+2", 16);
            expect(result.decimal).toBe("4");
            expect(result.fraction).toBeNull();
        });

        it("should return null fraction for results that cannot be simplified", () => {
            const result = Calculator.calculateWithFraction("sqrt(2)", 16);
            expect(result.fraction).toBeNull();
        });

        it("should use specified decimal separator", () => {
            const result = Calculator.calculateWithFraction("6/10", 16, ",");
            expect(result.decimal).toBe("0,6");
            expect(result.fraction).toBe("3/5");
        });
    });

    describe(Calculator.isValidInput.name, () => {
        it("should return true if input is valid", () => {
            const validInputs = ["1 + 2", "(7 * pi / 53 ^2) * sqrt(9)"];

            validInputs.forEach((validInput) => {
                const actual = Calculator.isValidInput(validInput);
                expect(actual).toBe(true);
            });
        });

        it("should return false when input is invalid", () => {
            const invalidInputs: string[] = ["1 + 2_", "abc", ""];

            invalidInputs.forEach((invalidInput) => {
                const actual = Calculator.isValidInput(invalidInput);
                expect(actual).toBe(false);
            });
        });
    });
});
