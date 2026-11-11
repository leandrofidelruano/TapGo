import { all, create, evaluate, typeOf } from "mathjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TrigonometricFunction = (...args: any[]) => any;

// Funciones trigonométricas de mathjs. Todas se calculan en radianes
// (las inversas devuelven radianes, nunca grados).
const trigonometricFunctions = [
    "sin",
    "cos",
    "tan",
    "cot",
    "sec",
    "csc",
    "sinh",
    "cosh",
    "tanh",
    "asin",
    "acos",
    "atan",
    "atan2",
    "asinh",
    "acosh",
    "atanh",
] as const;

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
        // mathjs no trae la función `ln`, así que se traduce a `log` (logaritmo natural)
        const withLn = input.replace(/ln\(/g, "log(");

        // mathjs trae `sin`, pero se agrega `sen` como alias en español
        const withSen = withLn.replace(/sen\(/g, "sin(");

        // mathjs no trae el símbolo `√`, así que se traduce a `sqrt`
        // `√(expresión)` → `sqrt(expresión)` (con los paréntesis que coloca el usuario)
        // `√9` → `sqrt(9)` (número suelto, se envuelve automáticamente)
        const withSqrt = withSen.replace(/√\(/g, "sqrt(").replace(/√(\d+(?:[.,]\d+)?)/g, "sqrt($1)");

        return withSqrt.replace(new RegExp(`\\${decimalSeparator}|\\${argumentSeparator}`, "g"), (match) =>
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
            const fraction = this.toFraction(rawResult);
            return { decimal: decimalFormatted, fraction };
        }

        if (typeof rawResult === "object" && rawResult !== null && typeof rawResult.toFixed === "function") {
            const num = parseFloat(rawResult.toFixed(precision));
            if (isFinite(num)) {
                const fraction = this.toFraction(num);
                return { decimal: decimalFormatted, fraction };
            }
        }

        return { decimal: decimalFormatted, fraction: null };
    }

    public static toFraction(value: number): string | null {
        if (!isFinite(value) || isNaN(value)) {
            return null;
        }

        // 0 y los enteros no necesitan fracción (evita el redundante "0/1" de log(1) = 0)
        if (Number.isInteger(value)) {
            return null;
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
        const mathInstance = create(all, { precision, number: "BigNumber" });

        this.sanitizeTrigonometricResults(mathInstance, precision);

        return mathInstance;
    }

    // mathjs calcula todas las funciones trigonométricas en radianes, pero con la precisión
    // configurada (16 dígitos por defecto) el argumento es una aproximación: `pi` se redondea,
    // así que `cos(pi/2)` devuelve -3.8076e-16 en lugar de 0. Se sustituyen por versiones que
    // devuelven 0 exacto cuando el resultado es solo ruido de redondeo del argumento, es decir,
    // cuando su magnitud está por debajo de |argumento| * 10^(2 - precisión).
    private static sanitizeTrigonometricResults(mathInstance: Partial<math.MathJsStatic>, precision: number): void {
        const importFunctions = mathInstance.import;
        const divide = mathInstance.divide;

        if (!importFunctions || !divide) {
            throw new Error("Failed to instantiate math js static");
        }

        // En precisiones muy bajas el factor se limita para no convertir en 0
        // resultados pequeños pero legítimos, p. ej. cos(1.5)
        const noiseFactor = Math.min(Math.pow(10, 2 - precision), 0.01);

        const originals: Record<string, TrigonometricFunction> = {};
        const sanitized: Record<string, TrigonometricFunction> = {};

        for (const functionName of trigonometricFunctions) {
            const originalFunction = (mathInstance as unknown as Record<string, TrigonometricFunction>)[functionName];

            if (typeof originalFunction !== "function") {
                continue;
            }

            originals[functionName] = originalFunction;
            sanitized[functionName] = (...args: unknown[]) =>
                this.sanitizeTrigonometricResult(originalFunction(...args), args[0], noiseFactor);
        }

        const sin = sanitized.sin;
        const cos = sanitized.cos;

        // En los polos (pi/2 + k*pi para tan y sec, k*pi para cot y csc) el seno o el coseno
        // es ruido numérico y, saneado, vale 0: el resultado correcto es infinito, no un número
        // gigante sin sentido como -7071067811865.475
        sanitized.tan = (argument: unknown) => {
            const cosine = cos(argument);

            return this.isZeroValue(cosine)
                ? divide(sin(argument), cosine)
                : this.sanitizeTrigonometricResult(originals.tan(argument), argument, noiseFactor);
        };

        sanitized.cot = (argument: unknown) => {
            const sine = sin(argument);

            if (this.isZeroValue(sine)) {
                return divide(cos(argument), sine);
            }

            const cosine = cos(argument);

            // cot(pi/2) = coseno/seno = 0/1 = 0
            return this.isZeroValue(cosine)
                ? cosine
                : this.sanitizeTrigonometricResult(originals.cot(argument), argument, noiseFactor);
        };

        sanitized.sec = (argument: unknown) => {
            const cosine = cos(argument);

            return this.isZeroValue(cosine)
                ? divide(1, cosine)
                : this.sanitizeTrigonometricResult(originals.sec(argument), argument, noiseFactor);
        };

        sanitized.csc = (argument: unknown) => {
            const sine = sin(argument);

            return this.isZeroValue(sine)
                ? divide(1, sine)
                : this.sanitizeTrigonometricResult(originals.csc(argument), argument, noiseFactor);
        };

        importFunctions(sanitized, { override: true });
    }

    // Devuelve 0 exacto (del mismo tipo que el resultado) cuando este es solo ruido de
    // redondeo del argumento. Los valores pequeños pero reales, p. ej. sin(1e-16), no se
    // tocan porque el umbral es proporcional a la magnitud del argumento.
    private static sanitizeTrigonometricResult(result: unknown, argument: unknown, noiseFactor: number): unknown {
        const scale = this.trigonometricArgumentScale(argument);
        const threshold = scale === null ? null : scale * noiseFactor;
        const resultType = typeOf(result);

        if (threshold === null || !isFinite(threshold) || (resultType !== "number" && resultType !== "BigNumber")) {
            return result;
        }

        const magnitude = resultType === "number" ? Math.abs(result as number) : Math.abs(Number(result));

        if (!isFinite(magnitude) || magnitude > threshold) {
            return result;
        }

        return resultType === "number" ? 0 : (result as math.BigNumber).sub(result as math.BigNumber);
    }

    // Magnitud del argumento: su error de redondeo es proporcional a ella, así que es la que
    // define cuánto ruido puede tener el resultado. Se devuelve null (no se sanea nada) cuando
    // no puede medirse: números complejos, matrices o unidades que no son ángulos.
    private static trigonometricArgumentScale(argument: unknown): number | null {
        try {
            if (typeOf(argument) === "Unit") {
                // `sin(30 deg)`: el argumento puede venir en grados y hay que pasarlo a radianes
                const radians = (argument as math.Unit).toNumber("rad");

                return isFinite(radians) ? Math.abs(radians) : null;
            }

            const value = Number(argument);

            return isFinite(value) ? Math.abs(value) : null;
        } catch {
            return null;
        }
    }

    private static isZeroValue(value: unknown): boolean {
        if (typeof value === "number") {
            return value === 0;
        }

        if (typeof value === "object" && value !== null && "isZero" in value) {
            return (value as { isZero: () => boolean }).isZero();
        }

        return false;
    }
}
