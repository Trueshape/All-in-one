import React, { useState, useEffect } from "react";
import { HelpCircle, Percent, RotateCcw, Equal, ArrowLeftRight, Sliders, Maximize2 } from "lucide-react";

export interface CalcButton {
  id: string;
  label: string;
  type: "num" | "operator" | "unary" | "clear" | "backspace" | "dot" | "equal" | "parenthesis" | "empty";
  value: string;
  colSpan?: number;
  rowSpan?: number;
  className?: string;
  x?: number;
  y?: number;
  hidden?: boolean;
}

const DEFAULT_COORDS: Record<string, { x: number; y: number }> = {
  paren_open: { x: 0, y: 0 },
  paren_close: { x: 2, y: 0 },
  square: { x: 4, y: 0 },
  pow: { x: 6, y: 0 },
  clear: { x: 8, y: 0 },
  
  sin: { x: 0, y: 1 },
  cos: { x: 2, y: 1 },
  tan: { x: 4, y: 1 },
  sqrt: { x: 6, y: 1 },
  backspace: { x: 8, y: 1 },
  
  ln: { x: 0, y: 2 },
  log: { x: 2, y: 2 },
  pi: { x: 4, y: 2 },
  e: { x: 6, y: 2 },
  div: { x: 8, y: 2 },
  
  recip: { x: 0, y: 3 },
  num_7: { x: 2, y: 3 },
  num_8: { x: 4, y: 3 },
  num_9: { x: 6, y: 3 },
  mul: { x: 8, y: 3 },
  
  neg: { x: 0, y: 4 },
  num_4: { x: 2, y: 4 },
  num_5: { x: 4, y: 4 },
  num_6: { x: 6, y: 4 },
  sub: { x: 8, y: 4 },
  
  percent: { x: 0, y: 5 },
  num_1: { x: 2, y: 5 },
  num_2: { x: 4, y: 5 },
  num_3: { x: 6, y: 5 },
  add: { x: 8, y: 5 },
  
  num_0: { x: 2, y: 6 },
  dot: { x: 4, y: 6 },
  equal: { x: 6, y: 6 }
};

const INITIAL_BUTTONS: CalcButton[] = [
  { id: "paren_open", label: "(", type: "parenthesis", value: "(" },
  { id: "paren_close", label: ")", type: "parenthesis", value: ")" },
  { id: "square", label: "x²", type: "unary", value: "square" },
  { id: "pow", label: "xʸ", type: "operator", value: "^" },
  { id: "clear", label: "C", type: "clear", value: "C", className: "text-rose-400 border border-zinc-800 hover:border-rose-900/50 hover:bg-rose-950/20 font-bold bg-zinc-900/90" },
  
  { id: "sin", label: "sin", type: "unary", value: "sin" },
  { id: "cos", label: "cos", type: "unary", value: "cos" },
  { id: "tan", label: "tan", type: "unary", value: "tan" },
  { id: "sqrt", label: "√", type: "unary", value: "sqrt" },
  { id: "backspace", label: "⌫", type: "backspace", value: "⌫" },
  
  { id: "ln", label: "ln", type: "unary", value: "ln" },
  { id: "log", label: "log", type: "unary", value: "log" },
  { id: "pi", label: "π", type: "unary", value: "pi" },
  { id: "e", label: "e", type: "unary", value: "e" },
  { id: "div", label: "÷", type: "operator", value: "÷" },
  
  { id: "recip", label: "1/x", type: "unary", value: "recip" },
  { id: "num_7", label: "7", type: "num", value: "7", className: "bg-zinc-900 text-zinc-200 font-bold hover:border-zinc-600 border border-zinc-800" },
  { id: "num_8", label: "8", type: "num", value: "8", className: "bg-zinc-900 text-zinc-200 font-bold hover:border-zinc-600 border border-zinc-800" },
  { id: "num_9", label: "9", type: "num", value: "9", className: "bg-zinc-900 text-zinc-200 font-bold hover:border-zinc-600 border border-zinc-800" },
  { id: "mul", label: "×", type: "operator", value: "×" },
  
  { id: "neg", label: "±", type: "unary", value: "neg" },
  { id: "num_4", label: "4", type: "num", value: "4", className: "bg-zinc-900 text-zinc-200 font-bold hover:border-zinc-600 border border-zinc-800" },
  { id: "num_5", label: "5", type: "num", value: "5", className: "bg-zinc-900 text-zinc-200 font-bold hover:border-zinc-600 border border-zinc-800" },
  { id: "num_6", label: "6", type: "num", value: "6", className: "bg-zinc-900 text-zinc-200 font-bold hover:border-zinc-600 border border-zinc-800" },
  { id: "sub", label: "-", type: "operator", value: "-" },
  
  { id: "percent", label: "%", type: "unary", value: "percent" },
  { id: "num_1", label: "1", type: "num", value: "1", className: "bg-zinc-900 text-zinc-200 font-bold hover:border-zinc-600 border border-zinc-800" },
  { id: "num_2", label: "2", type: "num", value: "2", className: "bg-zinc-900 text-zinc-200 font-bold hover:border-zinc-600 border border-zinc-800" },
  { id: "num_3", label: "3", type: "num", value: "3", className: "bg-zinc-900 text-zinc-200 font-bold hover:border-zinc-600 border border-zinc-800" },
  { id: "add", label: "+", type: "operator", value: "+" },
  
  { id: "num_0", label: "0", type: "num", value: "0", className: "bg-zinc-900 text-zinc-200 font-bold hover:border-zinc-600 border border-zinc-800" },
  { id: "dot", label: ".", type: "dot", value: ".", className: "bg-zinc-900 text-zinc-200 hover:border-zinc-600 border border-zinc-800" },
  { id: "equal", label: "=", type: "equal", value: "=", colSpan: 4, className: "bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-400 font-bold" }
];

const getInitialButtonsWithCoords = (savedButtons: CalcButton[]): CalcButton[] => {
  const filtered = savedButtons.filter((b) => b.type !== "empty");
  const occupied = Array.from({ length: 12 }, () => Array(10).fill(false));
  
  filtered.forEach((b) => {
    if (b.x !== undefined && b.y !== undefined) {
      const colSpan = b.colSpan || 2;
      const rowSpan = b.rowSpan || 1;
      for (let r = 0; r < rowSpan; r++) {
        for (let c = 0; c < colSpan; c++) {
          const ty = b.y + r;
          const tx = b.x + c;
          if (ty < 12 && tx < 10) {
            occupied[ty][tx] = true;
          }
        }
      }
    }
  });

  return filtered.map((b) => {
    if (b.x !== undefined && b.y !== undefined) {
      return b;
    }
    const defaultCoord = DEFAULT_COORDS[b.id];
    if (defaultCoord) {
      return { ...b, x: defaultCoord.x, y: defaultCoord.y };
    }
    
    const colSpan = b.colSpan || 2;
    const rowSpan = b.rowSpan || 1;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x <= 10 - colSpan; x++) {
        let fits = true;
        for (let r = 0; r < rowSpan; r++) {
          for (let c = 0; c < colSpan; c++) {
            if (occupied[y + r]?.[x + c]) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }
        if (fits) {
          for (let r = 0; r < rowSpan; r++) {
            for (let c = 0; c < colSpan; c++) {
              if (y + r < 12 && x + c < 10) {
                occupied[y + r][x + c] = true;
              }
            }
          }
          return { ...b, x, y };
        }
      }
    }
    return { ...b, x: 0, y: 0 };
  });
};

const resetGridCoordinates = (unpositionedButtons: CalcButton[]): CalcButton[] => {
  const occupied = Array.from({ length: 12 }, () => Array(10).fill(false));
  
  const numColSpan = unpositionedButtons.find((b) => b.type === "num")?.colSpan || 2;
  const numRowSpan = unpositionedButtons.find((b) => b.type === "num")?.rowSpan || 1;
  
  const getNumCoords = (id: string) => {
    let bx = 2;
    if (id === "num_8" || id === "num_5" || id === "num_2") {
      bx = 2 + numColSpan;
    } else if (id === "num_9" || id === "num_6" || id === "num_3") {
      bx = 2 + 2 * numColSpan;
    }

    let by = 3;
    if (id === "num_4" || id === "num_5" || id === "num_6") {
      by = 3 + numRowSpan;
    } else if (id === "num_1" || id === "num_2" || id === "num_3") {
      by = 3 + 2 * numRowSpan;
    } else if (id === "num_0") {
      by = 3 + 3 * numRowSpan;
    }
    return { x: bx, y: by };
  };

  unpositionedButtons.forEach((b) => {
    if (b.type === "num") {
      const coords = getNumCoords(b.id);
      const colSpan = b.colSpan || 2;
      const rowSpan = b.rowSpan || 1;
      for (let r = 0; r < rowSpan; r++) {
        for (let c = 0; c < colSpan; c++) {
          const ty = coords.y + r;
          const tx = coords.x + c;
          if (ty < 12 && tx < 10) {
            occupied[ty][tx] = true;
          }
        }
      }
    }
  });

  return unpositionedButtons.map((b) => {
    if (b.type === "num") {
      const coords = getNumCoords(b.id);
      return { ...b, x: coords.x, y: coords.y };
    }
    
    const colSpan = b.colSpan || 2;
    const rowSpan = b.rowSpan || 1;
    
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x <= 10 - colSpan; x++) {
        let fits = true;
        for (let r = 0; r < rowSpan; r++) {
          for (let c = 0; c < colSpan; c++) {
            if (occupied[y + r]?.[x + c]) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }
        
        if (fits) {
          for (let r = 0; r < rowSpan; r++) {
            for (let c = 0; c < colSpan; c++) {
              if (y + r < 12 && x + c < 10) {
                occupied[y + r][x + c] = true;
              }
            }
          }
          return { ...b, x, y };
        }
      }
    }
    return { ...b, x: 0, y: 0 };
  });
};

export default function ScientificCalculator({ isEditorMode = false }: { isEditorMode?: boolean }) {
  const [display, setDisplay] = useState<string>("0");
  const [equation, setEquation] = useState<string>("");
  const [isRad, setIsRad] = useState<boolean>(true);
  const [memory, setMemory] = useState<number>(0);

  // Buttons Sizing & Ordering States
  const [globalButtonSize, setGlobalButtonSize] = useState<"small" | "medium" | "large">(() => {
    return (localStorage.getItem("calc_global_button_size") as "small" | "medium" | "large") || "medium";
  });

  const [buttons, setButtons] = useState<CalcButton[]>(() => {
    const saved = localStorage.getItem("calc_button_layout_v4");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((b) => b.type !== "empty");
        }
      } catch (e) {
        console.error("Error reading calc buttons", e);
      }
    }
    const savedV3 = localStorage.getItem("calc_button_layout_v3");
    if (savedV3) {
      try {
        const parsed = JSON.parse(savedV3);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return getInitialButtonsWithCoords(parsed);
        }
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_BUTTONS.map((btn) => {
      const defaultCoord = DEFAULT_COORDS[btn.id];
      return {
        ...btn,
        colSpan: btn.id === "equal" ? 4 : (btn.colSpan || 2),
        rowSpan: btn.rowSpan || 1,
        x: defaultCoord ? defaultCoord.x : 0,
        y: defaultCoord ? defaultCoord.y : 0,
      };
    });
  });

  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);

  const resizeButton = (buttonId: string, targetColSpan: number, targetRowSpan: number) => {
    setButtons((prev) => {
      const selectedBtn = prev.find((b) => b.id === buttonId);
      if (!selectedBtn) return prev;

      const isSelectedNumber = selectedBtn.type === "num";

      if (isSelectedNumber) {
        const clampedCol = Math.min(targetColSpan, 2);
        const clampedRow = Math.min(targetRowSpan, 2);
        return prev.map((b) =>
          b.type === "num" ? { ...b, colSpan: clampedCol, rowSpan: clampedRow } : b
        );
      }

      // Build occupied map for all OTHER buttons
      const maxButtonY = Math.max(...prev.map(b => (b.y ?? 0) + (b.rowSpan ?? 1)), 6);
      const gridRowsCount = Math.max(12, maxButtonY + 2);
      const occupied = Array.from({ length: gridRowsCount }, () => Array(10).fill(false));

      prev.forEach((b) => {
        if (b.id === buttonId || b.hidden) return;
        const bCol = b.colSpan || 2;
        const bRow = b.rowSpan || 1;
        const bx = b.x ?? 0;
        const by = b.y ?? 0;
        for (let r = 0; r < bRow; r++) {
          for (let c = 0; c < bCol; c++) {
            if (by + r < gridRowsCount && bx + c < 10) {
              occupied[by + r][bx + c] = true;
            }
          }
        }
      });

      const currentX = selectedBtn.x ?? 0;
      const currentY = selectedBtn.y ?? 0;
      const currentColSpan = selectedBtn.colSpan || 2;
      const currentRowSpan = selectedBtn.rowSpan || 1;

      // We want to try shifting the button to the left (dx <= 0) to fit targetColSpan
      let bestX = currentX;
      let found = false;

      const minDx = -Math.max(0, targetColSpan - currentColSpan);
      for (let dx = 0; dx >= minDx; dx--) {
        const testX = currentX + dx;
        if (testX < 0 || testX + targetColSpan > 10) continue;

        // Check if this rectangle is free
        let isFree = true;
        for (let r = 0; r < targetRowSpan; r++) {
          for (let c = 0; c < targetColSpan; c++) {
            if (occupied[currentY + r]?.[testX + c]) {
              isFree = false;
              break;
            }
          }
          if (!isFree) break;
        }

        if (isFree) {
          bestX = testX;
          found = true;
          break;
        }
      }

      if (found) {
        return prev.map((b) =>
          b.id === buttonId ? { ...b, x: bestX, colSpan: targetColSpan, rowSpan: targetRowSpan } : b
        );
      }

      // Fallback: If shifting left didn't fit, see if we can fit with standard clamping (no shift)
      const colSpan = Math.min(targetColSpan, 10 - currentX);
      return prev.map((b) => {
        if (b.id === buttonId) {
          return { ...b, colSpan, rowSpan: targetRowSpan };
        }
        return b;
      });
    });
  };

  useEffect(() => {
    localStorage.setItem("calc_global_button_size", globalButtonSize);
  }, [globalButtonSize]);

  useEffect(() => {
    localStorage.setItem("calc_button_layout_v4", JSON.stringify(buttons));
  }, [buttons]);

  const handleNum = (num: string) => {
    if (display === "0") {
      setDisplay(num);
    } else {
      setDisplay((prev) => prev + num);
    }
  };

  const handleDot = () => {
    if (!display.includes(".")) {
      setDisplay((prev) => prev + ".");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
  };

  const getTokens = (eq: string, disp: string): string[] => {
    const parts: string[] = [];
    const eqParts = eq.trim().split(/\s+/).filter(Boolean);
    parts.push(...eqParts);

    const lastToken = parts[parts.length - 1];
    const isOperator = (t: string) => ["+", "-", "×", "÷", "^"].includes(t);

    if (disp !== "0" && disp !== "") {
      parts.push(disp);
    } else if (lastToken && isOperator(lastToken)) {
      parts.push("0");
    }

    return parts;
  };

  const evaluateExpression = (tokens: string[]): number | string => {
    if (tokens.length === 0) return 0;

    // Automatically close any unclosed parenthesis
    let openCount = 0;
    for (const token of tokens) {
      if (token === "(") openCount++;
      if (token === ")") openCount--;
    }
    const closedTokens = [...tokens];
    while (openCount > 0) {
      closedTokens.push(")");
      openCount--;
    }

    const outputQueue: number[] = [];
    const operatorStack: string[] = [];

    const precedence: Record<string, number> = {
      "+": 1,
      "-": 1,
      "×": 2,
      "÷": 2,
      "^": 3,
    };

    const isOperator = (token: string) => token in precedence;

    const applyOp = (op: string) => {
      if (outputQueue.length < 2) {
        throw new Error("Sintassi errata");
      }
      const b = outputQueue.pop()!;
      const a = outputQueue.pop()!;
      switch (op) {
        case "+":
          outputQueue.push(a + b);
          break;
        case "-":
          outputQueue.push(a - b);
          break;
        case "×":
          outputQueue.push(a * b);
          break;
        case "÷":
          if (b === 0) throw new Error("Div per zero");
          outputQueue.push(a / b);
          break;
        case "^":
          outputQueue.push(Math.pow(a, b));
          break;
      }
    };

    try {
      for (const token of closedTokens) {
        if (token === "(") {
          operatorStack.push(token);
        } else if (token === ")") {
          while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
            applyOp(operatorStack.pop()!);
          }
          if (operatorStack.length === 0) {
            throw new Error("Sintassi errata");
          }
          operatorStack.pop(); // Pop '('
        } else if (isOperator(token)) {
          while (
            operatorStack.length > 0 &&
            isOperator(operatorStack[operatorStack.length - 1]) &&
            precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
          ) {
            applyOp(operatorStack.pop()!);
          }
          operatorStack.push(token);
        } else {
          const num = parseFloat(token);
          if (isNaN(num)) {
            throw new Error("Sintassi errata");
          }
          outputQueue.push(num);
        }
      }

      while (operatorStack.length > 0) {
        const op = operatorStack.pop()!;
        if (op === "(" || op === ")") {
          throw new Error("Sintassi errata");
        }
        applyOp(op);
      }

      if (outputQueue.length !== 1) {
        throw new Error("Sintassi errata");
      }

      return outputQueue[0];
    } catch (err: any) {
      return err.message || "Errore";
    }
  };

  const getLivePreview = (): string => {
    const tokens = getTokens(equation, display);
    if (tokens.length <= 1) return "";

    const hasOp = tokens.some((t) => ["+", "-", "×", "÷", "^"].includes(t));
    if (!hasOp) return "";

    const res = evaluateExpression(tokens);
    if (typeof res === "number") {
      return String(Number(res.toFixed(8)));
    }
    return "";
  };

  const handleBackspace = () => {
    if (display !== "0" && display !== "") {
      if (display.length > 1) {
        setDisplay((prev) => prev.slice(0, -1));
      } else {
        setDisplay("0");
      }
    } else {
      const parts = equation.trim().split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        parts.pop();
        setEquation(parts.join(" ") + (parts.length > 0 ? " " : ""));
      }
    }
  };

  const handleOperator = (op: string) => {
    if (display !== "0" && display !== "") {
      // Check if we should perform intermediate evaluation
      let openParentheses = 0;
      for (const char of equation) {
        if (char === "(") openParentheses++;
        if (char === ")") openParentheses--;
      }

      const hasOperator = ["+", "-", "×", "÷", "^"].some((o) => equation.includes(o));

      if (openParentheses === 0 && hasOperator) {
        const tokens = getTokens(equation, display);
        const res = evaluateExpression(tokens);
        if (typeof res === "number") {
          setEquation(String(Number(res.toFixed(8))) + " " + op + " ");
          setDisplay("0");
          return;
        } else {
          setDisplay(res);
          setEquation("");
          return;
        }
      }

      setEquation((prev) => prev + display + " " + op + " ");
      setDisplay("0");
    } else {
      const tokens = getTokens(equation, "");
      if (tokens.length > 0) {
        const lastToken = tokens[tokens.length - 1];
        if (["+", "-", "×", "÷", "^"].includes(lastToken)) {
          const parts = equation.trim().split(/\s+/).filter(Boolean);
          parts[parts.length - 1] = op;
          setEquation(parts.join(" ") + " ");
        } else {
          setEquation((prev) => prev.trim() + " " + op + " ");
        }
      } else {
        setEquation("0 " + op + " ");
      }
    }
  };

  const handleParenthesis = (p: string) => {
    if (p === "(") {
      const tokens = getTokens(equation, display);
      const lastToken = tokens[tokens.length - 1];

      if (display !== "0" && display !== "") {
        setEquation((prev) => prev + display + " × ( ");
        setDisplay("0");
      } else if (lastToken === ")") {
        setEquation((prev) => prev + "× ( ");
      } else {
        setEquation((prev) => prev + "( ");
      }
    } else {
      if (display !== "0" && display !== "") {
        setEquation((prev) => prev + display + " ) ");
        setDisplay("0");
      } else {
        setEquation((prev) => prev + ") ");
      }
    }
  };

  const calculateResult = () => {
    const tokens = getTokens(equation, display);
    if (tokens.length === 0) return;

    const res = evaluateExpression(tokens);
    if (typeof res === "number") {
      setDisplay(String(Number(res.toFixed(8))));
      setEquation("");
    } else {
      setDisplay(res);
      setEquation("");
    }
  };

  const handleUnary = (func: string) => {
    const val = parseFloat(display);
    if (isNaN(val)) return;

    let result = 0;
    try {
      switch (func) {
        case "sin":
          result = Math.sin(isRad ? val : (val * Math.PI) / 180);
          break;
        case "cos":
          result = Math.cos(isRad ? val : (val * Math.PI) / 180);
          break;
        case "tan":
          result = Math.tan(isRad ? val : (val * Math.PI) / 180);
          break;
        case "sqrt":
          if (val < 0) {
            setDisplay("Errore");
            return;
          }
          result = Math.sqrt(val);
          break;
        case "ln":
          if (val <= 0) {
            setDisplay("Errore");
            return;
          }
          result = Math.log(val);
          break;
        case "log":
          if (val <= 0) {
            setDisplay("Errore");
            return;
          }
          result = Math.log10(val);
          break;
        case "pi":
          result = Math.PI;
          break;
        case "e":
          result = Math.E;
          break;
        case "square":
          result = val * val;
          break;
        case "neg":
          result = -val;
          break;
        case "recip":
          if (val === 0) {
            setDisplay("Errore");
            return;
          }
          result = 1 / val;
          break;
        case "percent":
          result = val / 100;
          break;
        default:
          return;
      }
      setDisplay(String(Number(result.toFixed(8))));
    } catch (e) {
      setDisplay("Errore");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ignore standard modifier combos to avoid interrupting system shortcuts (like Copy/Paste)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleNum(key);
      } else if (key === "." || key === ",") {
        e.preventDefault();
        handleDot();
      } else if (key === "+") {
        e.preventDefault();
        handleOperator("+");
      } else if (key === "-") {
        e.preventDefault();
        handleOperator("-");
      } else if (key === "*" || key.toLowerCase() === "x") {
        e.preventDefault();
        handleOperator("×");
      } else if (key === "/" || key === ":") {
        e.preventDefault();
        handleOperator("÷");
      } else if (key === "^") {
        e.preventDefault();
        handleOperator("^");
      } else if (key === "(") {
        e.preventDefault();
        handleParenthesis("(");
      } else if (key === ")") {
        e.preventDefault();
        handleParenthesis(")");
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        calculateResult();
      } else if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (key === "Escape" || key.toLowerCase() === "c") {
        e.preventDefault();
        handleClear();
      } else if (key === "%") {
        e.preventDefault();
        handleUnary("percent");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [display, equation, isRad]);

  const handleMemory = (action: string) => {
    const val = parseFloat(display);
    switch (action) {
      case "MC":
        setMemory(0);
        break;
      case "MR":
        setDisplay(String(memory));
        break;
      case "M+":
        setMemory((prev) => prev + val);
        break;
      case "M-":
        setMemory((prev) => prev - val);
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Display Screen */}
      <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-lg text-right font-mono flex flex-col justify-between h-28 select-none">
        <div className="text-[10px] text-zinc-500 tracking-wider h-4 overflow-hidden truncate">
          {equation} {memory !== 0 ? `[M = ${memory}]` : ""}
        </div>
        <div className="text-3xl font-light text-zinc-100 tracking-tight select-all truncate my-1">
          {display}
        </div>
        <div className="text-right text-xs text-zinc-400 font-mono h-4">
          {getLivePreview() ? `= ${getLivePreview()}` : ""}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Editor Controls Panel */}
        {isEditorMode && (
          <div className="md:col-span-12 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-zinc-300 font-mono space-y-3 animate-fade-in z-20">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Sliders className="w-4 h-4" />
                <span>MODALITÀ EDITOR ATTIVA</span>
              </div>
              
              {/* Global size select */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400">Dimensione Tasti:</span>
                <div className="flex bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                  {(["small", "medium", "large"] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setGlobalButtonSize(sz)}
                      className={`px-3 py-1 text-[10px] uppercase transition-colors font-bold ${
                        globalButtonSize === sz
                          ? "bg-amber-500 text-zinc-950"
                          : "hover:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {sz === "small" ? "P" : sz === "medium" ? "M" : "G"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Sort Options */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400">Ordina:</span>
                <button
                  onClick={() => {
                    setButtons(INITIAL_BUTTONS.map((btn) => {
                      const defaultCoord = DEFAULT_COORDS[btn.id];
                      return {
                        ...btn,
                        colSpan: btn.id === "equal" ? 4 : (btn.colSpan || 2),
                        rowSpan: btn.rowSpan || 1,
                        x: defaultCoord ? defaultCoord.x : 0,
                        y: defaultCoord ? defaultCoord.y : 0,
                        hidden: false,
                      };
                    }));
                    setSelectedButtonId(null);
                  }}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 text-[10px] transition-colors text-zinc-300 flex items-center gap-1"
                  title="Ripristina layout predefinito"
                >
                  <RotateCcw className="w-3 h-3 text-amber-500" />
                  <span>Resetta</span>
                </button>

                <button
                  onClick={() => {
                    const sorted = [...buttons].sort((a, b) => {
                      if (a.type === "equal" || a.type === "clear" || a.type === "backspace" || a.type === "empty") return 1;
                      if (b.type === "equal" || b.type === "clear" || b.type === "backspace" || b.type === "empty") return -1;
                      return a.label.localeCompare(b.label);
                    });
                    setButtons(resetGridCoordinates(sorted));
                    setSelectedButtonId(null);
                  }}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 text-[10px] transition-colors text-zinc-300 flex items-center gap-1"
                >
                  <ArrowLeftRight className="w-3 h-3 text-amber-500" />
                  <span>A-Z</span>
                </button>

                <button
                  onClick={() => {
                    const numWeight = (t: string) => {
                      if (t === "num") return 1;
                      if (t === "operator") return 2;
                      if (t === "unary") return 3;
                      return 4;
                    };
                    const sorted = [...buttons].sort((a, b) => {
                      const wA = numWeight(a.type);
                      const wB = numWeight(b.type);
                      if (wA !== wB) return wA - wB;
                      return a.label.localeCompare(b.label);
                    });
                    setButtons(resetGridCoordinates(sorted));
                    setSelectedButtonId(null);
                  }}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 text-[10px] transition-colors text-zinc-300"
                >
                  123 Prima
                </button>
              </div>
            </div>

            {/* Hidden Buttons restore bar */}
            {buttons.some((b) => b.hidden) && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-amber-500/15 pt-2.5 mt-2 animate-fade-in">
                <span className="text-[10px] text-zinc-400">Tasti nascosti (fai clic per mostrare):</span>
                <div className="flex flex-wrap gap-1.5">
                  {buttons
                    .filter((b) => b.hidden)
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setButtons((prev) =>
                            prev.map((btn) =>
                              btn.id === b.id ? { ...btn, hidden: false } : btn
                            )
                          );
                        }}
                        className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/35 hover:bg-amber-500/5 text-[10px] rounded text-zinc-300 hover:text-amber-400 transition-all flex items-center gap-1 font-mono cursor-pointer"
                        title="Clicca per mostrare di nuovo il tasto"
                      >
                        <span>{b.label}</span>
                        <span className="text-amber-500 font-bold">+</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Selected Button Settings */}
            {selectedButtonId ? (() => {
              const selectedButton = buttons.find((b) => b.id === selectedButtonId);
              const isSelectedNumber = selectedButton?.type === "num";
              return (
                <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-[11px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-zinc-500">Selezionato:</span>
                    <span className="font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                      {selectedButton?.label || "Nessuno"}
                    </span>
                    <span className="text-zinc-500 text-[10px]">
                      {isSelectedNumber
                        ? "(I numeri cambiano dimensione assieme e non possono venire spostati)"
                        : "(Trascina il tasto col mouse per scambiarlo o usa le frecce per spostarlo)"}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Dimension Controls */}
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 px-2 py-1 rounded">
                      <span className="text-[10px] text-zinc-400">Larghezza:</span>
                      {([1, 2, 3, 4] as const).map((w) => (
                        <button
                          key={w}
                          onClick={() => {
                            resizeButton(selectedButtonId, w, selectedButton?.rowSpan || 1);
                          }}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                            (selectedButton?.colSpan || 2) === w
                              ? "bg-amber-500 text-zinc-950"
                              : "hover:bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {w === 2 ? "2 (Normale)" : w === 4 ? "4 (Doppio)" : `${w}`}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 px-2 py-1 rounded">
                      <span className="text-[10px] text-zinc-400">Altezza:</span>
                      <button
                        onClick={() => {
                          resizeButton(selectedButtonId, selectedButton?.colSpan || 2, 1);
                        }}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                          (selectedButton?.rowSpan || 1) === 1
                            ? "bg-amber-500 text-zinc-950"
                            : "hover:bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        1 Unità
                      </button>
                      <button
                        onClick={() => {
                          resizeButton(selectedButtonId, selectedButton?.colSpan || 2, 2);
                        }}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                          (selectedButton?.rowSpan || 1) === 2
                            ? "bg-amber-500 text-zinc-950"
                            : "hover:bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        2 Unità (Alto)
                      </button>
                    </div>

                    {/* Hide Button Control */}
                    {!isSelectedNumber && (
                      <button
                        onClick={() => {
                          setButtons((prev) =>
                            prev.map((b) =>
                              b.id === selectedButtonId ? { ...b, hidden: true } : b
                            )
                          );
                          setSelectedButtonId(null);
                        }}
                        className="px-2.5 py-1 bg-rose-950/40 border border-rose-900/60 hover:border-rose-700 hover:bg-rose-950/60 text-rose-300 font-bold text-[10px] rounded transition-all cursor-pointer flex items-center gap-1"
                        title="Nascondi questo tasto dalla calcolatrice"
                      >
                        <span>Nascondi Tasto</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div className="text-[10px] text-zinc-500 text-center py-1">
                Fai clic su qualsiasi tasto della calcolatrice per modificarne le dimensioni (larghezza/altezza) o scambiarne la posizione.
              </div>
            )}
          </div>
        )}

        {/* Memory & Unit Config */}
        <div className="md:col-span-12 flex justify-between items-center bg-zinc-900/40 p-2 border border-zinc-800 rounded">
          <div className="flex gap-1.5 text-[10px] font-mono">
            {["MC", "MR", "M+", "M-"].map((memOp) => (
              <button
                key={memOp}
                onClick={() => handleMemory(memOp)}
                className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 hover:text-zinc-200 transition-colors"
              >
                {memOp}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsRad(!isRad)}
            className={`px-3 py-1 text-[10px] font-mono rounded border border-zinc-800 transition-all ${
              isRad
                ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {isRad ? "RAD" : "DEG"}
          </button>
        </div>

        {/* Buttons Pad Grid */}
        <div className="md:col-span-12 grid grid-cols-10 gap-1.5">
          {(() => {
            const maxButtonY = Math.max(...buttons.filter(b => !b.hidden).map(b => (b.y ?? 0) + (b.rowSpan ?? 1)), 6);
            const gridRowsCount = Math.max(7, maxButtonY);
            const occupied = Array.from({ length: gridRowsCount }, () => Array(10).fill(false));

            buttons.forEach((b) => {
              if (b.hidden) return;
              const colSpan = b.colSpan || 2;
              const rowSpan = b.rowSpan || 1;
              const bx = b.x ?? 0;
              const by = b.y ?? 0;
              for (let r = 0; r < rowSpan; r++) {
                for (let c = 0; c < colSpan; c++) {
                  if (by + r < gridRowsCount && bx + c < 10) {
                    occupied[by + r][bx + c] = true;
                  }
                }
              }
            });

            const getButtonSizeClasses = (cSpan: number = 2, rSpan: number = 1) => {
              let paddingAndText = "";
              let heightClass = "";
              switch (globalButtonSize) {
                case "small":
                  paddingAndText = "p-1.5 text-[10px]";
                  heightClass = rSpan === 2 ? "min-h-[72px] h-full" : "min-h-[32px]";
                  break;
                case "large":
                  paddingAndText = "p-3.5 text-sm font-bold";
                  heightClass = rSpan === 2 ? "min-h-[112px] h-full" : "min-h-[52px]";
                  break;
                case "medium":
                default:
                  paddingAndText = "p-2.5 text-xs";
                  heightClass = rSpan === 2 ? "min-h-[92px] h-full" : "min-h-[42px]";
                  break;
              }
              return `${paddingAndText} ${heightClass}`;
            };

            const getColSpanClass = (span: number) => {
              switch (span) {
                case 1: return "col-span-1";
                case 3: return "col-span-3";
                case 4: return "col-span-4";
                case 5: return "col-span-5";
                case 6: return "col-span-6";
                case 7: return "col-span-7";
                case 8: return "col-span-8";
                case 9: return "col-span-9";
                case 10: return "col-span-10";
                case 2:
                default:
                  return "col-span-2";
              }
            };

            const getRowSpanClass = (span: number) => {
              switch (span) {
                case 2: return "row-span-2";
                case 3: return "row-span-3";
                case 4: return "row-span-4";
                case 1:
                default:
                  return "row-span-1";
              }
            };

            const handleButtonInteraction = (btn: CalcButton, e: React.MouseEvent) => {
              if (isEditorMode) {
                e.preventDefault();
                e.stopPropagation();
                if (selectedButtonId === btn.id) {
                  setSelectedButtonId(null);
                } else {
                  setSelectedButtonId(btn.id);
                }
              } else {
                switch (btn.type) {
                  case "num":
                    handleNum(btn.value);
                    break;
                  case "operator":
                    handleOperator(btn.value);
                    break;
                  case "unary":
                    handleUnary(btn.value);
                    break;
                  case "clear":
                    handleClear();
                    break;
                  case "backspace":
                    handleBackspace();
                    break;
                  case "dot":
                    handleDot();
                    break;
                  case "equal":
                    calculateResult();
                    break;
                  case "parenthesis":
                    handleParenthesis(btn.value);
                    break;
                  case "empty":
                  default:
                    break;
                }
              }
            };

            const handleDragStart = (e: React.DragEvent, id: string) => {
              if (!isEditorMode) return;
              const sourceBtn = buttons.find((b) => b.id === id);
              if (sourceBtn?.type === "num") {
                e.preventDefault();
                return;
              }
              e.dataTransfer.setData("text/plain", id);
            };

            const handleDragOver = (e: React.DragEvent) => {
              if (!isEditorMode) return;
              e.preventDefault();
            };

            const handleDrop = (e: React.DragEvent, targetId: string) => {
              if (!isEditorMode) return;
              e.preventDefault();
              const sourceId = e.dataTransfer.getData("text/plain");
              if (sourceId && sourceId !== targetId) {
                const sourceBtn = buttons.find((b) => b.id === sourceId);
                const targetBtn = buttons.find((b) => b.id === targetId);
                if (sourceBtn?.type === "num" || targetBtn?.type === "num") {
                  return; // Don't allow swapping number buttons
                }
                const index1 = buttons.findIndex((b) => b.id === sourceId);
                const index2 = buttons.findIndex((b) => b.id === targetId);
                if (index1 !== -1 && index2 !== -1) {
                  const newButtons = [...buttons];
                  const x1 = newButtons[index1].x;
                  const y1 = newButtons[index1].y;
                  const x2 = newButtons[index2].x;
                  const y2 = newButtons[index2].y;
                  
                  newButtons[index1] = { ...newButtons[index1], x: x2, y: y2 };
                  newButtons[index2] = { ...newButtons[index2], x: x1, y: y1 };
                  setButtons(newButtons);
                }
              }
            };

            const handleDropPlaceholder = (e: React.DragEvent, targetX: number, targetY: number) => {
              if (!isEditorMode) return;
              e.preventDefault();
              const sourceId = e.dataTransfer.getData("text/plain");
              if (sourceId) {
                const sourceBtn = buttons.find((b) => b.id === sourceId);
                if (sourceBtn?.type === "num") {
                  return; // Don't allow moving numbers
                }
                setButtons((prev) =>
                  prev.map((b) =>
                    b.id === sourceId ? { ...b, x: targetX, y: targetY } : b
                  )
                );
              }
            };

            const renderedButtons = buttons
              .filter((btn) => !btn.hidden)
              .map((btn) => {
              const isSelected = selectedButtonId === btn.id;
              const colSpan = btn.colSpan || 2;
              const rowSpan = btn.rowSpan || 1;
              const sizeClass = getButtonSizeClasses(colSpan, rowSpan);
              const colSpanClass = getColSpanClass(colSpan);
              const rowSpanClass = getRowSpanClass(rowSpan);
              
              let baseColorClass = "bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 text-zinc-400";
              if (btn.type === "num" || btn.type === "dot") {
                baseColorClass = "bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-200 font-bold";
              } else if (btn.type === "clear") {
                baseColorClass = "bg-[#180a0a] border border-red-950/60 text-rose-400 hover:border-rose-500/30 hover:bg-rose-950/20 font-bold bg-zinc-900/90";
              } else if (btn.type === "equal") {
                baseColorClass = "bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-400 font-bold";
              } else if (btn.type === "parenthesis") {
                baseColorClass = "bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold";
              } else if (btn.type === "empty") {
                baseColorClass = "bg-zinc-950/80 border border-dashed border-zinc-850 text-zinc-600 font-medium hover:border-amber-500/30 hover:bg-amber-500/5";
              }
              
              if (btn.className && btn.type !== "clear" && btn.type !== "num" && btn.type !== "dot" && btn.type !== "equal" && btn.type !== "empty") {
                baseColorClass = btn.className;
              }

              if (btn.type === "empty" && !isEditorMode) {
                return (
                  <div
                    key={btn.id}
                    style={{
                      gridColumnStart: (btn.x ?? 0) + 1,
                      gridRowStart: (btn.y ?? 0) + 1,
                    }}
                    className={`${colSpanClass} ${rowSpanClass}`}
                  />
                );
              }

              const isDraggable = isEditorMode && btn.type !== "num";

              return (
                <button
                  key={btn.id}
                  onClick={(e) => handleButtonInteraction(btn, e)}
                  draggable={isDraggable}
                  onDragStart={(e) => handleDragStart(e, btn.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, btn.id)}
                  style={{
                    gridColumnStart: (btn.x ?? 0) + 1,
                    gridRowStart: (btn.y ?? 0) + 1,
                  }}
                  className={`transition-all rounded select-none font-mono flex items-center justify-center relative ${colSpanClass} ${rowSpanClass} ${sizeClass} ${baseColorClass} ${
                    isEditorMode
                      ? (btn.type === "num"
                          ? "cursor-pointer hover:scale-[1.02] border-dashed border-amber-500/20 bg-amber-500/5"
                          : "cursor-move hover:scale-[1.02] border-dashed border-amber-500/30 bg-amber-500/5")
                      : "cursor-pointer"
                  } ${
                    isSelected ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-950 scale-95 border-amber-500 bg-amber-500/20 text-amber-300" : ""
                  } ${
                    isEditorMode && !isSelected ? "hover:border-amber-500/50 hover:bg-amber-500/5" : ""
                  }`}
                  title={isEditorMode 
                    ? (btn.type === "num" 
                        ? `Tasto ${btn.label}: Clicca per selezionare e modificare le dimensioni` 
                        : (btn.type === "empty"
                            ? "Spazio vuoto: Trascina un altro tasto qui per scambiarlo, o Clicca per selezionare"
                            : `Tasto ${btn.label}: Trascina per scambiare o Clicca per selezionare`)) 
                    : btn.label
                  }
                >
                  {btn.type === "empty" ? "∅" : (btn.label || "\u00A0")}
                  
                  {isEditorMode && btn.type !== "num" && (
                    <span className="absolute top-0.5 right-1 text-[8px] text-amber-500/40 select-none pointer-events-none">
                      ⁝
                    </span>
                  )}
                </button>
              );
            });

            const placeholders: React.ReactNode[] = [];
            if (isEditorMode) {
              for (let y = 0; y < gridRowsCount; y++) {
                for (let x = 0; x < 10; x++) {
                  if (!occupied[y][x]) {
                    placeholders.push(
                      <button
                        key={`placeholder-${x}-${y}`}
                        onClick={() => {
                          if (selectedButtonId) {
                            setButtons((prev) =>
                              prev.map((b) => {
                                if (b.type === "num") return b;
                                if (b.id === selectedButtonId) {
                                  return { ...b, x, y };
                                }
                                return b;
                              })
                            );
                          }
                        }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropPlaceholder(e, x, y)}
                        style={{
                          gridColumnStart: x + 1,
                          gridRowStart: y + 1,
                        }}
                        className={`border border-dashed border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded transition-all flex items-center justify-center text-emerald-500/30 hover:text-emerald-500 font-mono cursor-pointer ${getButtonSizeClasses(1, 1)}`}
                        title={`Sposta qui a colonna ${x + 1}, riga ${y + 1} (Fai clic o trascina qui)`}
                      >
                        +
                      </button>
                    );
                  }
                }
              }
            }

            return [...renderedButtons, ...placeholders];
          })()}
        </div>
      </div>
      
      {/* Keyboard Shortcuts Hint */}
      <div className="text-[10px] text-zinc-500 font-mono text-center flex items-center justify-center gap-1.5 pt-3 border-t border-zinc-900/50 mt-1 select-none">
        <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
        <span>Scorciatoie: cifre, +, -, *, /, ^, (, ), Invio (=), Backspace (⌫), Esc (C)</span>
      </div>
    </div>
  );
}
