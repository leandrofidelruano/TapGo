import { all, create, evaluate, typeOf } from "mathjs";

export interface CalculateResult {
    decimal: string;
    fraction: string | null;
}

export class Calculator {
    public static isValidInput(input: string, decimalSeparator = ".", argumentSeparator = ","): boolean {
        const blackListInputs = ["version", "i"];

        if (input.length === 0) {
            return false;
        }

        if (blackListInputs.find((b) => input === b) !== undefined) {
            return false;
        }

        let result;
        try {
            // Mathjs throws an error when input cannot be evaluated
            result = evaluate(this.normalizeInput(input, decimalSeparator, argumentSeparator));
        } catch (e) {
            return false;
        }

        if (result === undefined) {
            return false;
        }

        return !isNaN(result) || this.isValidMathType(result) || false;
    }

    private static normalizeInput(input: string, decimalSeparator: string, argumentSeparator: string) {
        return input.replace(new RegExp(`\\${decimalSeparator}|\\${argumentSeparator}`, "g"), (match) =>
            match === decimalSeparator ? "." : ",",
        );
    }

    public static calculate(input: string, precision: number, decimalSeparator = ".", argumentSeparator = ","): string {
        precision = Number(precision);

        if (precision > 64 || precision < 0) {
            precision = 16;
        }

        const math = this.math(precision);

        if (!math.evaluate) {
            throw new Error("Failed to instantiate math js static");
        }

        const result = String(math.evaluate(this.normalizeInput(input, decimalSeparator, argumentSeparator)));

        return result.replace(new RegExp(",|\\.", "g"), (match) =>
            match === "." ? decimalSeparator : argumentSeparator,
        );
    }

    public static calculateWithFraction(
        input: string,
        precision: number,
        decimalSeparator = ".",
        argumentSeparator = ",",
    ): CalculateResult {
        precision = Number(precision);

        if (precision > 64 || precision < 0) {
            precision = 16;
        }

        const math = this.math(precision);

        if (!math.evaluate) {
            throw new Error("Failed to instantiate math js static");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawResult: any = math.evaluate(this.normalizeInput(input, decimalSeparator, argumentSeparator));
        const resultStr = String(rawResult);

        const decimalFormatted = resultStr.replace(new RegExp(",|\\.", "g"), (match) =>
            match === "." ? decimalSeparator : argumentSeparator,
        );

        // Try to get fraction for simple numeric results
        if (typeof rawResult === "number" && isFinite(rawResult)) {
            const fraction = this.toFraction(rawResult, decimalSeparator);
            return { decimal: decimalFormatted, fraction };
        }

        if (typeof rawResult === "object" && rawResult !== null && typeof rawResult.toFixed === "function") {
            const num = parseFloat(rawResult.toFixed(precision));
            if (isFinite(num)) {
                const fraction = this.toFraction(num, decimalSeparator);
                return { decimal: decimalFormatted, fraction };
            }
        }

        return { decimal: decimalFormatted, fraction: null };
    }

    public static toFraction(value: number, decimalSeparator = "."): string | null {
        if (!isFinite(value) || isNaN(value)) {
            return null;
        }

        if (value === 0) {
            return "0/1";
        }

        const sign = value < 0 ? -1 : 1;
        const absValue = Math.abs(value);

        // Check if it's an integer — no fraction needed
        if (Number.isInteger(absValue)) {
            return null;
        }

        const maxDenominator = 10000;
        const tolerance = 1e-9;

        // Continued fraction algorithm
        let h1 = 1;
        let h2 = 0;
        let k1 = 0;
        let k2 = 1;
        let b = absValue;

        do {
            const a = Math.floor(b);
            let aux = h1;
            h1 = a * h1 + h2;
            h2 = aux;
            aux = k1;
            k1 = a * k1 + k2;
            k2 = aux;
            b = 1 / (b - a);
        } while (Math.abs(absValue - h1 / k1) > absValue * tolerance && k1 < maxDenominator);

        if (k1 >= maxDenominator) {
            return null;
        }

        const numerator = sign * h1;
        const denominator = k1;

        if (denominator === 1) {
            return null;
        }

        return `${numerator}/${denominator}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static isValidMathType(input: any): boolean {
        const mathType = typeOf(input);

        if ((mathType === "Unit" && input.value === null) || mathType === "Function") {
            return false;
        }

        return true;
    }

    private static math(precision: number): Partial<math.MathJsStatic> {
        return create(all, { precision, number: "BigNumber" });
    }
}
