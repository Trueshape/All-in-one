/** Expression evaluation and unary functions for the scientific calculator. */

export const OPERATORS = ["+", "-", "×", "÷", "^"] as const;
export const isOperator = (token: string) => (OPERATORS as readonly string[]).includes(token);

/** Evaluates a token list such as ["2", "+", "3", "×", "(", "4", "-", "1", ")"] with the usual precedence. */
export function evaluate(input: string[]): number {
  const tokens = [...input];
  let open = tokens.filter((t) => t === "(").length - tokens.filter((t) => t === ")").length;
  while (open-- > 0) tokens.push(")"); // auto-close open parentheses

  let pos = 0;
  const peek = () => tokens[pos];

  const expression = (): number => {
    let value = term();
    while (peek() === "+" || peek() === "-") {
      const op = tokens[pos++];
      const rhs = term();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  };

  const term = (): number => {
    let value = power();
    while (peek() === "×" || peek() === "÷") {
      const op = tokens[pos++];
      const rhs = power();
      if (op === "÷" && rhs === 0) throw new Error("Divisione per zero");
      value = op === "×" ? value * rhs : value / rhs;
    }
    return value;
  };

  // Exponentiation is right-associative: 2^3^2 = 2^(3^2)
  const power = (): number => {
    const base = factor();
    if (peek() === "^") {
      pos++;
      return Math.pow(base, power());
    }
    return base;
  };

  const factor = (): number => {
    const token = tokens[pos++];
    if (token === undefined) throw new Error("Sintassi errata");
    if (token === "(") {
      const value = expression();
      if (tokens[pos++] !== ")") throw new Error("Sintassi errata");
      return value;
    }
    const number = Number(token);
    if (token === "" || Number.isNaN(number)) throw new Error("Sintassi errata");
    return number;
  };

  const result = expression();
  if (pos !== tokens.length) throw new Error("Sintassi errata");
  if (!Number.isFinite(result)) throw new Error("Risultato non valido");
  return result;
}

/** Rounds away floating-point noise (0.1 + 0.2 → 0.3) and prints without trailing zeros. */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) throw new Error("Risultato non valido");
  const cleaned = Number(value.toPrecision(12));
  return String(Object.is(cleaned, -0) ? 0 : cleaned);
}

export type UnaryFn = "sin" | "cos" | "tan" | "sqrt" | "ln" | "log" | "pi" | "e" | "square" | "neg" | "recip" | "percent";

export function applyUnary(fn: UnaryFn, value: number, radians: boolean): number {
  const angle = radians ? value : (value * Math.PI) / 180;
  switch (fn) {
    case "sin": return Math.sin(angle);
    case "cos": return Math.cos(angle);
    case "tan": return Math.tan(angle);
    case "sqrt":
      if (value < 0) throw new Error("Radice di un numero negativo");
      return Math.sqrt(value);
    case "ln":
      if (value <= 0) throw new Error("Logaritmo non definito");
      return Math.log(value);
    case "log":
      if (value <= 0) throw new Error("Logaritmo non definito");
      return Math.log10(value);
    case "pi": return Math.PI;
    case "e": return Math.E;
    case "square": return value * value;
    case "neg": return -value;
    case "recip":
      if (value === 0) throw new Error("Divisione per zero");
      return 1 / value;
    case "percent": return value / 100;
  }
}
