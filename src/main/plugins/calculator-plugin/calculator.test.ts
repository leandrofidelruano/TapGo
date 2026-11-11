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

        it("should evaluate natural logarithm using ln()", () => {
            const precision = 16;

            expect(Calculator.calculate("ln(1)", precision)).toBe("0");
            expect(Calculator.isValidInput("ln(2)")).toBe(true);
        });

        it("should evaluate sine using sen() as alias of sin()", () => {
            const precision = 16;

            expect(Calculator.calculate("sen(0)", precision)).toBe("0");
            expect(Calculator.calculate("sen(0)", precision)).toBe(Calculator.calculate("sin(0)", precision));
            expect(Calculator.isValidInput("sen(1)")).toBe(true);
        });

        it("should evaluate trigonometric functions in radians without rounding noise", () => {
            const precision = 16;

            // Residuos de redondeo de pi: deben ser 0 exacto, no -3.8076e-16
            expect(Calculator.calculate("cos(pi/2)", precision)).toBe("0");
            expect(Calculator.calculate("sen(pi)", precision)).toBe("0");
            expect(Calculator.calculate("sin(2*pi)", precision)).toBe("0");
            expect(Calculator.calculate("tan(pi)", precision)).toBe("0");
            expect(Calculator.calculate("cos(2*pi)", precision)).toBe("1");

            // Ángulos conocidos, calculados en radianes
            expect(Calculator.calculate("sin(pi/2)", precision)).toBe("1");
            expect(Calculator.calculate("tan(pi/4)", precision)).toBe("1");
            expect(Number(Calculator.calculate("sin(pi/6)", precision))).toBeCloseTo(0.5, 10);
            expect(Number(Calculator.calculate("cos(pi/3)", precision))).toBeCloseTo(0.5, 10);
            expect(Number(Calculator.calculate("sen(pi/6)", precision))).toBeCloseTo(0.5, 10);

            // En grados sin(180) sería 0; en radianes es -0.801...
            expect(Number(Calculator.calculate("sin(180)", precision))).toBeCloseTo(Math.sin(180), 10);
        });

        it("should return infinity in the poles of tangent and reciprocal functions", () => {
            const precision = 16;

            expect(Calculator.calculate("tan(pi/2)", precision)).toBe("Infinity");
            expect(Calculator.calculate("sec(pi/2)", precision)).toBe("Infinity");
            expect(Calculator.calculate("csc(pi)", precision)).toBe("Infinity");
            expect(Calculator.calculate("1/cos(pi/2)", precision)).toBe("Infinity");
            expect(Calculator.calculate("cot(0)", precision)).toBe("Infinity");

            // cot(pi/2) = coseno/seno = 0/1 = 0
            expect(Calculator.calculate("cot(pi/2)", precision)).toBe("0");
        });

        it("should keep small but legit trigonometric results", () => {
            const precision = 16;

            expect(Number(Calculator.calculate("sin(1e-16)", precision))).toBeCloseTo(1e-16, 30);
            expect(Number(Calculator.calculate("sin(1e-20)", precision))).toBeCloseTo(1e-20, 30);
            expect(Number(Calculator.calculate("cos(1.5)", precision))).toBeCloseTo(Math.cos(1.5), 10);
            expect(Number(Calculator.calculate("sin(0.5)", precision))).toBeCloseTo(Math.sin(0.5), 10);
        });

        it("should evaluate inverse trigonometric functions in radians", () => {
            const precision = 16;

            expect(Number(Calculator.calculate("asin(1)", precision))).toBeCloseTo(Math.PI / 2, 10);
            expect(Number(Calculator.calculate("acos(0)", precision))).toBeCloseTo(Math.PI / 2, 10);
            expect(Number(Calculator.calculate("atan(1)", precision))).toBeCloseTo(Math.PI / 4, 10);
            expect(Number(Calculator.calculate("atan2(1,1)", precision))).toBeCloseTo(Math.PI / 4, 10);
            expect(Number(Calculator.calculate("asin(0.5)", precision))).toBeCloseTo(Math.PI / 6, 10);
        });

        it("should not sanitize trigonometric noise on other precisions", () => {
            [8, 16, 32, 64].forEach((precision) => {
                expect(Calculator.calculate("cos(pi/2)", precision)).toBe("0");
                expect(Calculator.calculate("sin(pi)", precision)).toBe("0");
                expect(Number(Calculator.calculate("sin(0.5)", precision))).toBeCloseTo(Math.sin(0.5), 5);
            });
        });

        it("should evaluate square root using √ as alias of sqrt()", () => {
            const precision = 16;

            // Con paréntesis colocados por el usuario
            expect(Calculator.calculate("√(9)", precision)).toBe("3");
            expect(Calculator.calculate("√(9)", precision)).toBe(Calculator.calculate("sqrt(9)", precision));

            // Sin paréntesis (número suelto)
            expect(Calculator.calculate("√9", precision)).toBe("3");
            expect(Calculator.calculate("2√9", precision)).toBe("6");
            expect(Calculator.calculate("√16+√25", precision)).toBe("9");

            expect(Calculator.isValidInput("√(16)")).toBe(true);
            expect(Calculator.isValidInput("√9")).toBe(true);
        });

        it("should evaluate √ with locale decimal separator", () => {
            expect(Calculator.calculate("√(2,25)", 16, ",", ";")).toBe("1,5");
            expect(Calculator.calculate("√2,25", 16, ",", ";")).toBe("1,5");
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
            expect(Calculator.toFraction(0)).toBeNull();
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

        it("should return null fraction for log(1) = 0 (no redundant 0/1)", () => {
            const result = Calculator.calculateWithFraction("log(1)", 16);
            expect(result.decimal).toBe("0");
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
