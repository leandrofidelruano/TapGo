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

// Radicandos libres de cuadrados entre 2 y 97, para reconstruir una expresión con raíz a
// partir del resultado numérico. Se excluyen los múltiplos de un cuadrado (4, 8, 9, 12…)
// porque sus raíces se simplifican: √8 ya es 2√2, que se encuentra con el radicando 2
const squareFreeRadicands = [
    2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23, 26, 29, 30, 31, 33, 34, 35, 37, 38, 39, 41, 42, 43, 46,
    47, 51, 53, 55, 57, 58, 59, 61, 62, 65, 66, 67, 69, 70, 71, 73, 74, 77, 78, 79, 82, 83, 85, 86, 87, 89, 91, 93,
    94, 95, 97,
] as const;

export interface CalculateResult {
    decimal: string;
    fraction: string | null;
    radical: string | null;
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
        // mathjs no reconoce el símbolo `π`, solo la constante `pi`
        const withPi = input.replace(/π/g, "pi");

        // mathjs no trae la función `ln`, así que se traduce a `log` (logaritmo natural)
        const withLn = withPi.replace(/ln\(/g, "log(");

        // mathjs trae `sin`, pero se agrega `sen` como alias en español
        const withSen = withLn.replace(/sen\(/g, "sin(");

        // mathjs no trae el símbolo `√`, así que se traduce a `sqrt`
        // `√(expresión)` → `sqrt(expresión)` (con los paréntesis que coloca el usuario)
        // `√9` → `sqrt(9)` (número suelto, se envuelve automáticamente)
        // `√π`/`√pi` → `sqrt(pi)` y `√e` → `sqrt(e)` (constantes sueltas, igual que el número)
        const withSqrt = withSen
            .replace(/√\(/g, "sqrt(")
            .replace(/√(\d+(?:[.,]\d+)?|pi|e)/g, "sqrt($1)");

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

        const normalizedInput = this.normalizeInput(input, decimalSeparator, argumentSeparator);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawResult: any = math.evaluate(normalizedInput);
        const resultStr = String(rawResult);

        const decimalFormatted = resultStr.replace(new RegExp(",|\\.", "g"), (match) =>
            match === "." ? decimalSeparator : argumentSeparator,
        );

        // Valor numérico del resultado, si lo hay (para fracciones y expresiones con raíz)
        let numericValue: number | null = null;

        if (typeof rawResult === "number" && isFinite(rawResult)) {
            numericValue = rawResult;
        } else if (typeof rawResult === "object" && rawResult !== null && typeof rawResult.toFixed === "function") {
            const num = parseFloat(rawResult.toFixed(precision));

            if (isFinite(num)) {
                numericValue = num;
            }
        }

        if (numericValue === null) {
            return { decimal: decimalFormatted, fraction: null, radical: null };
        }

        const fraction = this.toFraction(numericValue, precision);

        // La fracción tiene prioridad sobre la expresión con raíz: si el valor es racional se
        // muestra como fracción (√4/6 → 1/3). La expresión con raíz (√2/2) solo aparece cuando
        // no hay fracción y el resultado no es un entero exacto, que ya se escribe sin más.
        // Primero se intenta con la expresión que escribió el usuario (da su forma literal)
        // y, si contiene funciones (`cos(pi/4)`), se reconstruye numéricamente a partir del
        // resultado: p*√b/q que reproduzca el valor con la tolerancia de la precisión
        const radical =
            fraction === null && !Number.isInteger(numericValue)
                ? (this.toRadical(normalizedInput, numericValue, math, precision, decimalSeparator, argumentSeparator) ??
                  this.toRadicalFromValue(numericValue, precision))
                : null;

        return { decimal: decimalFormatted, fraction, radical };
    }

    public static toFraction(value: number, precision = 16): string | null {
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

        // La fracción debe reproducir el valor dentro de la precisión configurada. Con una
        // tolerancia fija (1e-9), irracionales como e+√2 encajarían con una fracción
        // arbitraria y se mostraría como si fuera su forma exacta
        const tolerance = Math.min(1e-9, Math.max(1e-12, Math.pow(10, 1 - precision)));

        const ratio = this.approximateRatio(absValue, maxDenominator, tolerance);

        if (ratio === null) {
            return null;
        }

        const numerator = sign * ratio.numerator;
        const denominator = ratio.denominator;

        if (denominator === 1) {
            return null;
        }

        return `${numerator}/${denominator}`;
    }

    // Mejor aproximación racional de un valor positivo con denominador acotado, mediante
    // fracciones continuas. Devuelve null si no converge dentro de la tolerancia indicada
    private static approximateRatio(
        absValue: number,
        maxDenominator: number,
        tolerance: number,
    ): { numerator: number; denominator: number } | null {
        if (!isFinite(absValue) || absValue === 0) {
            return null;
        }

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

        return { numerator: h1, denominator: k1 };
    }

    // Expresión exacta con raíz, p. ej. `√2/2` para 0.7071067811865475. A diferencia de la
    // fracción, no se deduce del resultado numérico (sería imposible para un irracional),
    // sino que se construye a partir de la expresión que escribió el usuario. Solo se
    // devuelve si, al volver a evaluarla, da el mismo valor que el resultado: así una
    // expresión mal formada se descarta en lugar de mostrar un valor incorrecto.
    private static toRadical(
        normalizedInput: string,
        numericValue: number,
        math: Partial<math.MathJsStatic>,
        precision: number,
        decimalSeparator: string,
        argumentSeparator: string,
    ): string | null {
        if (!math.evaluate || !this.isPureRadicalExpression(normalizedInput)) {
            return null;
        }

        const display = this.toRadicalDisplay(normalizedInput, decimalSeparator);

        // La forma exacta debe mostrar √ o la constante `e` (un input sin ninguna de las
        // dos, p. ej. solo números, no aporta nada como segundo resultado)
        if (!/[√e]/.test(display)) {
            return null;
        }

        let displayedValue: number;

        try {
            displayedValue = Number(
                String(math.evaluate(this.normalizeInput(display, decimalSeparator, argumentSeparator))),
            );
        } catch {
            return null;
        }

        if (!isFinite(displayedValue)) {
            return null;
        }

        // La tolerancia contempla el redondeo de la precisión configurada
        const tolerance = Math.max(1e-12, Math.pow(10, 1 - precision));

        return Math.abs(displayedValue - numericValue) <= Math.abs(numericValue) * tolerance ? display : null;
    }

    // Reconstrucción numérica de la forma exacta con raíz: busca p*√b/q (con b libre de
    // cuadrados) que reproduzca el valor. Sirve cuando la expresión del usuario contiene
    // funciones (`cos(pi/4)`) y por tanto no puede mostrarse tal cual. Se verifica al final
    // que la reconstrucción vuelva a dar el valor: si no coincide, no se muestra nada en
    // lugar de una expresión incorrecta
    private static toRadicalFromValue(numericValue: number, precision: number): string | null {
        if (!isFinite(numericValue) || numericValue === 0) {
            return null;
        }

        const tolerance = Math.min(1e-9, Math.max(1e-12, Math.pow(10, 1 - precision)));
        const maxNumerator = 10000;
        const maxDenominator = 1000;
        const sign = numericValue < 0 ? -1 : 1;
        const absValue = Math.abs(numericValue);

        for (const radicand of squareFreeRadicands) {
            // valor/√b debe ser una fracción p/q: si lo es, el valor es p*√b/q
            const ratio = this.approximateRatio(absValue / Math.sqrt(radicand), maxDenominator, tolerance);

            if (ratio === null || ratio.numerator === 0 || ratio.numerator > maxNumerator) {
                continue;
            }

            const reconstructed = (sign * ratio.numerator * Math.sqrt(radicand)) / ratio.denominator;

            if (Math.abs(reconstructed - numericValue) <= Math.abs(numericValue) * tolerance) {
                return this.formatRadical(sign * ratio.numerator, radicand, ratio.denominator);
            }
        }

        return null;
    }

    // Forma de exhibición de una reconstrucción p*√b/q, p. ej. `√2/2`, `3√2`, `-√3`, `√2/4`
    private static formatRadical(numerator: number, radicand: number, denominator: number): string {
        const sign = numerator < 0 ? "-" : "";
        const coefficient = Math.abs(numerator) === 1 ? "" : String(Math.abs(numerator));
        const radical = `${sign}${coefficient}√${radicand}`;

        return denominator === 1 ? radical : `${radical}/${denominator}`;
    }

    // Una expresión es una forma exacta si está compuesta solo por números, √, las
    // constantes π y e y operadores. Cualquier otra cosa (funciones como sin() o log(),
    // matrices, unidades, etc.) la descarta: en el segundo resultado solo interesa poder
    // copiar una expresión exacta equivalente al decimal
    private static isPureRadicalExpression(expression: string): boolean {
        // La `e` de Euler solo cuenta cuando está sola: en `sec`, `exp` o la notación
        // científica (`2e16`, pegada a un dígito) es parte de otro elemento
        const hasRoot = /√|sqrt/.test(expression);
        const hasEulerConstant = /(?<![a-z\d])e(?![a-z\d])/.test(expression);

        if (!hasRoot && !hasEulerConstant) {
            return false;
        }

        const withoutElements = expression
            .replace(/\s+/g, "")
            .replace(/(?:\d+\.\d+|\d+\.|\d+|\.\d+)(?:e[+-]?\d+)?/gi, "")
            .replace(/sqrt|pi/g, "")
            .replace(/(?<![a-z\d])e(?![a-z\d])/g, "")
            .replace(/[+\-*/^()]/g, "");

        return withoutElements === "";
    }

    // Convierte la expresión normalizada (`sqrt(2)/2`) en su forma con símbolos (`√2/2`)
    private static toRadicalDisplay(normalizedExpression: string, decimalSeparator: string): string {
        // sqrt(X) → √X, sin paréntesis cuando X es un número o una constante, y quitando los
        // paréntesis redundantes de (√2). Se itera de adentro hacia afuera hasta que ya no
        // cambie para que sqrt(sqrt(2)) termine como √(√2): los paréntesis que el símbolo √
        // necesita al volver a evaluar la expresión se conservan
        let display = normalizedExpression;
        let previous: string;

        do {
            previous = display;
            display = display
                .replace(/sqrt\(([^()]*)\)/g, (_match, content: string) =>
                    this.isSimpleRadicalContent(content) ? `√${content}` : `√(${content})`,
                )
                .replace(/pi/g, "π")
                // No se tocan los paréntesis de un sqrt() sin convertir (letra antes) ni los
                // que pertenecen a un √ previo: sqrt(√2) debe conservar sus paréntesis
                .replace(/(?<![a-z√])\(√([^+\-*/^()]+)\)/g, "√$1")
                // (e) → e: los paréntesis de la constante son redundantes. Ante un dígito
                // no se quitan porque `2e` se leería como notación científica incompleta
                .replace(/(?<![a-z\d])\(e\)/g, "e");
        } while (display !== previous);

        // Racionaliza el denominador: 1/√2 → √2/2. El numerador se conserva tal cual (salvo
        // un `1` inicial, que es redundante) para que el resto de la expresión siga igual
        display = display.replace(
            /(\d*\.?\d*)\/√(\d+)(?![\d.])/g,
            (match, numerator: string, radicand: string, offset: number, whole: string) => {
                const preceding = this.significantCharBefore(whole, offset);
                let prefix = numerator;

                if (numerator === "1" && (preceding === "" || "+-*(,".includes(preceding))) {
                    // 1/√2 → √2/2
                    prefix = "";
                } else if (numerator === "" && /[a-zπ]/i.test(preceding)) {
                    // π/√2 → π*√2/2: sin el `*` formaría el identificador inválido `pisqrt`
                    prefix = "*";
                }

                return `${prefix}√${radicand}/${radicand}`;
            },
        );

        // 2 * √3 → 2√3: la yuxtaposición es segura solo si lo que precede al `*` es un
        // número, un punto o un paréntesis de cierre. Delante de π o e se unirían en un
        // único identificador (pisqrt), que mathjs no sabe interpretar
        display = display.replace(/(?<=[\d.)])\s*\*\s*(?=√)/g, "");

        // Separador decimal local: 1.5 → 1,5
        return display.split(".").join(decimalSeparator);
    }

    // Contenido que puede ir sin paréntesis después de √: un número o una constante. Los
    // números en notación científica se excluyen porque `√2e16` se re-evaluaría como
    // `sqrt(2)e16` (identificador inválido) en lugar de `sqrt(2e16)`
    private static isSimpleRadicalContent(content: string): boolean {
        return /^[0-9a-z]+(?:\.[0-9a-z]+)?$/i.test(content) && !/\d[eE]/.test(content);
    }

    // Carácter significativo anterior a una posición, ignorando los espacios
    private static significantCharBefore(text: string, offset: number): string {
        let index = offset - 1;

        while (index >= 0 && /\s/.test(text[index])) {
            index--;
        }

        return index < 0 ? "" : text[index];
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
