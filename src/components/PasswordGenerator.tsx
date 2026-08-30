import { useState, useEffect } from "react";
import { ShieldCheck, Copy, Check, RotateCw } from "lucide-react";

export default function PasswordGenerator() {
  const [length, setLength] = useState<number>(16);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [strength, setStrength] = useState<{ label: string; color: string; width: string }>({
    label: "Media",
    color: "bg-amber-500",
    width: "w-1/2",
  });
  const [copied, setCopied] = useState<boolean>(false);

  const generatePassword = () => {
    let charset = "";
    let uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    let numberChars = "0123456789";
    let symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (excludeSimilar) {
      uppercaseChars = uppercaseChars.replace(/[ILO]/g, "");
      lowercaseChars = lowercaseChars.replace(/[ilo]/g, "");
      numberChars = numberChars.replace(/[01]/g, "");
      symbolChars = symbolChars.replace(/[|.,]/g, "");
    }

    if (includeUppercase) charset += uppercaseChars;
    if (includeLowercase) charset += lowercaseChars;
    if (includeNumbers) charset += numberChars;
    if (includeSymbols) charset += symbolChars;

    if (charset === "") {
      setPassword("Seleziona almeno un'opzione!");
      return;
    }

    let generated = "";
    // Guaranteed to include at least one of each active option to make the password robust
    const guaranteed: string[] = [];
    if (includeUppercase) guaranteed.push(uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]);
    if (includeLowercase) guaranteed.push(lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]);
    if (includeNumbers) guaranteed.push(numberChars[Math.floor(Math.random() * numberChars.length)]);
    if (includeSymbols) guaranteed.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]);

    // Fill the rest randomly
    const fillLength = length - guaranteed.length;
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      generated += charset[randomIndex];
    }

    // Overlay guaranteed characters randomly
    const generatedArray = generated.split("");
    guaranteed.forEach((char, idx) => {
      if (idx < generatedArray.length) {
        generatedArray[idx] = char;
      }
    });

    // Shuffle array
    for (let i = generatedArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [generatedArray[i], generatedArray[j]] = [generatedArray[j], generatedArray[i]];
    }

    setPassword(generatedArray.join(""));
  };

  const calculateStrength = () => {
    if (!password || password.startsWith("Seleziona")) {
      setStrength({ label: "N/A", color: "bg-zinc-700", width: "w-0" });
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    let variations = 0;
    if (/[a-z]/.test(password)) variations++;
    if (/[A-Z]/.test(password)) variations++;
    if (/[0-9]/.test(password)) variations++;
    if (/[^a-zA-Z0-9]/.test(password)) variations++;

    score += variations;

    if (score <= 3) {
      setStrength({ label: "Debole", color: "bg-rose-500", width: "w-1/4" });
    } else if (score <= 5) {
      setStrength({ label: "Media", color: "bg-amber-500", width: "w-1/2" });
    } else if (score <= 6) {
      setStrength({ label: "Forte", color: "bg-blue-500", width: "w-3/4" });
    } else {
      setStrength({ label: "Sicura", color: "bg-emerald-500", width: "w-full" });
    }
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar]);

  useEffect(() => {
    calculateStrength();
  }, [password]);

  const handleCopy = () => {
    if (password && !password.startsWith("Seleziona")) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Display Box */}
      <div className="relative p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 overflow-hidden">
        <div className="font-mono font-medium text-lg text-zinc-100 overflow-x-auto no-scrollbar whitespace-nowrap break-all select-all pr-2 max-w-[80%]">
          {password}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={generatePassword}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-all rounded-lg bg-zinc-850 hover:bg-zinc-800"
            title="Rigenera"
            id="btn-pwd-regenerate"
          >
            <RotateCw className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-zinc-300 hover:text-white transition-all rounded-lg bg-indigo-600 hover:bg-indigo-500"
            title="Copia"
            id="btn-pwd-copy"
          >
            {copied ? <Check className="w-4.5 h-4.5 text-emerald-300" /> : <Copy className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> Robustezza Password:
          </span>
          <span className="font-semibold text-zinc-200">{strength.label}</span>
        </div>
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full ${strength.color} ${strength.width} transition-all duration-350 ease-out`} />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4 pt-1">
        {/* Length Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-zinc-400">Lunghezza Caratteri</span>
            <span className="text-indigo-400 font-mono text-sm font-semibold">{length}</span>
          </div>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            id="slider-pwd-length"
          />
        </div>

        {/* Checkbox Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900/30 border border-zinc-800/40 rounded-xl cursor-pointer hover:bg-zinc-900/60 transition-colors">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(e) => setIncludeUppercase(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
              id="chk-pwd-uppercase"
            />
            <span className="text-xs font-medium text-zinc-300 select-none">Maiuscole (A-Z)</span>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900/30 border border-zinc-800/40 rounded-xl cursor-pointer hover:bg-zinc-900/60 transition-colors">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={(e) => setIncludeLowercase(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
              id="chk-pwd-lowercase"
            />
            <span className="text-xs font-medium text-zinc-300 select-none">Minuscole (a-z)</span>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900/30 border border-zinc-800/40 rounded-xl cursor-pointer hover:bg-zinc-900/60 transition-colors">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
              id="chk-pwd-numbers"
            />
            <span className="text-xs font-medium text-zinc-300 select-none">Numeri (0-9)</span>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900/30 border border-zinc-800/40 rounded-xl cursor-pointer hover:bg-zinc-900/60 transition-colors">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
              id="chk-pwd-symbols"
            />
            <span className="text-xs font-medium text-zinc-300 select-none">Simboli (!@#)</span>
          </label>
        </div>

        {/* Similar Chars */}
        <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900/30 border border-zinc-800/40 rounded-xl cursor-pointer hover:bg-zinc-900/60 transition-colors w-full">
          <input
            type="checkbox"
            checked={excludeSimilar}
            onChange={(e) => setExcludeSimilar(e.target.checked)}
            className="rounded bg-zinc-950 border-zinc-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
            id="chk-pwd-exclude-similar"
          />
          <div className="select-none">
            <span className="text-xs font-medium text-zinc-300 block">Escludi caratteri simili</span>
            <span className="text-[10px] text-zinc-500 block">Rimuove i, l, 1, o, 0, O, ecc. per evitare confusione</span>
          </div>
        </label>
      </div>
    </div>
  );
}
