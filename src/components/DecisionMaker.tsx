import React, { useState, useEffect } from "react";
import { HelpCircle, Trash2, Plus, Sparkles, Coins, Dices, ListTodo } from "lucide-react";

export default function DecisionMaker() {
  const [tab, setTab] = useState<"coin" | "dice" | "list">("coin");

  // --- COIN STATE ---
  const [coinResult, setCoinResult] = useState<"TESTA" | "CROCE" | null>(null);
  const [isCoinFlipping, setIsCoinFlipping] = useState<boolean>(false);

  const flipCoin = () => {
    if (isCoinFlipping) return;
    setIsCoinFlipping(true);
    setCoinResult(null);
    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? "TESTA" : "CROCE";
      setCoinResult(outcome);
      setIsCoinFlipping(false);
    }, 800);
  };

  // --- DICE STATE ---
  const [diceCount, setDiceCount] = useState<1 | 2>(1);
  const [diceResults, setDiceResults] = useState<number[]>([]);
  const [isDiceRolling, setIsDiceRolling] = useState<boolean>(false);

  const rollDices = () => {
    if (isDiceRolling) return;
    setIsDiceRolling(true);
    setDiceResults([]);
    setTimeout(() => {
      const outcomes = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setDiceResults(outcomes);
      setIsDiceRolling(false);
    }, 700);
  };

  // --- LIST SELECTOR STATE ---
  const [inputOption, setInputOption] = useState<string>("");
  const [options, setOptions] = useState<string[]>([
    "Pizza",
    "Sushi",
    "Cucina Italiana",
    "Fast Food",
  ]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isListTicking, setIsListTicking] = useState<boolean>(false);

  const handleAddOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputOption.trim() && !options.includes(inputOption.trim())) {
      setOptions([...options, inputOption.trim()]);
      setInputOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, idx) => idx !== index));
    if (selectedOption) setSelectedOption(null);
  };

  const pickRandomOption = () => {
    if (options.length < 2 || isListTicking) return;
    setIsListTicking(true);
    setSelectedOption(null);
    
    // Quick ticking slot-machine effect
    let count = 0;
    const interval = setInterval(() => {
      const tempIdx = Math.floor(Math.random() * options.length);
      setSelectedOption(options[tempIdx]);
      count++;
      if (count > 12) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * options.length);
        setSelectedOption(options[finalIdx]);
        setIsListTicking(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
        <button
          onClick={() => setTab("coin")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            tab === "coin"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          id="btn-dec-coin"
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Moneta</span>
        </button>
        <button
          onClick={() => setTab("dice")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            tab === "dice"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          id="btn-dec-dice"
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Dadi</span>
        </button>
        <button
          onClick={() => setTab("list")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            tab === "list"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          id="btn-dec-list"
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>Scelta Lista</span>
        </button>
      </div>

      {tab === "coin" && (
        // --- COIN FLIP WORKSPACE ---
        <div className="space-y-6 text-center py-4">
          <div className="flex justify-center">
            {/* Animated Coin */}
            <button
              onClick={flipCoin}
              disabled={isCoinFlipping}
              className={`w-28 h-28 rounded-full bg-amber-500 border-4 border-amber-400 shadow-xl relative flex items-center justify-center cursor-pointer active:scale-95 text-amber-950 font-black font-display text-base transition-transform duration-500 hover:rotate-6 ${
                isCoinFlipping ? "animate-spin" : ""
              }`}
              style={{
                boxShadow: "inset 0 0 12px rgba(255, 255, 255, 0.4), 0 10px 15px -3px rgba(245, 158, 11, 0.2)",
              }}
              id="coin-clickable"
            >
              <span className="tracking-widest">
                {coinResult ? coinResult : "LANCIA"}
              </span>
            </button>
          </div>

          <div className="space-y-1">
            {coinResult && !isCoinFlipping ? (
              <p className="text-sm font-semibold text-zinc-200">
                Risultato: <strong className="text-amber-400">{coinResult}</strong>
              </p>
            ) : (
              <p className="text-xs text-zinc-500">Fai clic sulla moneta o sul pulsante in basso per lanciare</p>
            )}
          </div>

          <button
            onClick={flipCoin}
            disabled={isCoinFlipping}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-indigo-950/25 active:scale-95 disabled:opacity-40"
            id="btn-coin-flip"
          >
            {isCoinFlipping ? "Lancio in corso..." : "Lancia la Moneta"}
          </button>
        </div>
      )}

      {tab === "dice" && (
        // --- DICE WORKSPACE ---
        <div className="space-y-6 text-center py-4">
          {/* Configuration Selection */}
          <div className="flex justify-center gap-1.5 pb-1">
            {[1, 2].map((num) => (
              <button
                key={num}
                onClick={() => setDiceCount(num as 1 | 2)}
                className={`px-3 py-1 text-[10px] uppercase font-bold rounded-full transition-colors border ${
                  diceCount === num
                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                    : "text-zinc-500 hover:text-zinc-300 border-transparent"
                }`}
                id={`btn-dice-count-${num}`}
              >
                {num === 1 ? "1 Dado" : "2 Dadi"}
              </button>
            ))}
          </div>

          {/* Dice rendering */}
          <div className="flex justify-center items-center gap-6 py-4 min-h-[96px]">
            {isDiceRolling ? (
              <div className="flex gap-4">
                {Array.from({ length: diceCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-16 bg-zinc-900 border-2 border-zinc-700 rounded-xl flex items-center justify-center animate-bounce text-zinc-600 font-bold font-mono text-xl"
                  >
                    ?
                  </div>
                ))}
              </div>
            ) : diceResults.length > 0 ? (
              <div className="flex gap-5">
                {diceResults.map((dice, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-16 bg-zinc-100 border border-white text-zinc-950 rounded-2xl flex items-center justify-center font-bold font-mono text-3xl shadow-lg relative"
                    style={{
                      boxShadow: "inset 0 4px 6px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.15)",
                    }}
                  >
                    {/* Visual Dots representation for dadi */}
                    <span className="font-sans font-black text-indigo-600">{dice}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-600">
                <HelpCircle className="w-12 h-12 stroke-1" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            {diceResults.length > 0 && !isDiceRolling && (
              <p className="text-sm font-semibold text-zinc-200">
                {diceCount === 2 ? (
                  <span>
                    Somma: <strong className="text-indigo-400">{diceResults.reduce((a, b) => a + b, 0)}</strong> ({diceResults.join(" + ")})
                  </span>
                ) : (
                  <span>
                    Risultato: <strong className="text-indigo-400">{diceResults[0]}</strong>
                  </span>
                )}
              </p>
            )}
          </div>

          <button
            onClick={rollDices}
            disabled={isDiceRolling}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-indigo-950/25 active:scale-95 disabled:opacity-40"
            id="btn-dice-roll"
          >
            {isDiceRolling ? "Lancio..." : "Lancia i Dadi"}
          </button>
        </div>
      )}

      {tab === "list" && (
        // --- CUSTOM LIST SELECTOR WORKSPACE ---
        <div className="space-y-4">
          <form onSubmit={handleAddOption} className="flex gap-2">
            <input
              type="text"
              value={inputOption}
              onChange={(e) => setInputOption(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-medium text-xs transition-all"
              placeholder="Aggiungi un'opzione (es. Sushi, Cinema...)"
              id="input-list-option"
            />
            <button
              type="submit"
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors active:scale-95 shrink-0"
              id="btn-list-add"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Scrolling Options Chips */}
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar py-1">
            {options.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300"
              >
                <span>{opt}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="text-zinc-500 hover:text-rose-400 transition-colors"
                  id={`btn-list-opt-del-${idx}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {options.length === 0 && (
              <p className="text-xs text-zinc-500 py-2 w-full text-center">La tua lista è vuota. Aggiungi delle opzioni.</p>
            )}
          </div>

          {/* Results Showcase Area */}
          <div className="p-4 bg-zinc-950/40 border border-zinc-800/70 rounded-xl min-h-[96px] flex flex-col items-center justify-center text-center relative overflow-hidden">
            {selectedOption ? (
              <div className="space-y-1 z-10">
                <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> Scelto per te!
                </span>
                <p className="text-xl font-bold text-zinc-100 font-display uppercase tracking-wide">{selectedOption}</p>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Aggiungi almeno 2 opzioni e fai clic sul pulsante in basso</p>
            )}
          </div>

          <button
            type="button"
            onClick={pickRandomOption}
            disabled={options.length < 2 || isListTicking}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-indigo-950/20 active:scale-95 flex items-center justify-center gap-1.5"
            id="btn-list-choose"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>{isListTicking ? "Scelta in corso..." : "Scegli per Me!"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
