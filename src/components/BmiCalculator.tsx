import React, { useState, useEffect } from "react";
import { Activity, Info, Sparkles, Scale } from "lucide-react";

export default function BmiCalculator() {
  const [weight, setWeight] = useState<number>(70);
  const [height, setHeight] = useState<number>(175);
  const [gender, setGender] = useState<"m" | "f">("m");
  const [bmi, setBmi] = useState<number>(22.86);
  const [classification, setClassification] = useState<string>("Sottopeso");
  const [color, setColor] = useState<string>("text-emerald-400");
  const [bgColor, setBgColor] = useState<string>("bg-emerald-500/10");
  const [borderColor, setBorderColor] = useState<string>("border-emerald-500/30");

  useEffect(() => {
    const heightInMeters = height / 100;
    if (heightInMeters > 0) {
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      const roundedBmi = Math.round(calculatedBmi * 100) / 100;
      setBmi(roundedBmi);

      if (roundedBmi < 18.5) {
        setClassification("Sottopeso");
        setColor("text-sky-400");
        setBgColor("bg-sky-500/10");
        setBorderColor("border-sky-500/30");
      } else if (roundedBmi >= 18.5 && roundedBmi < 25) {
        setClassification("Normopeso");
        setColor("text-emerald-400");
        setBgColor("bg-emerald-500/10");
        setBorderColor("border-emerald-500/30");
      } else if (roundedBmi >= 25 && roundedBmi < 30) {
        setClassification("Sovrappeso");
        setColor("text-amber-400");
        setBgColor("bg-amber-500/10");
        setBorderColor("border-amber-500/30");
      } else {
        setClassification("Obesità");
        setColor("text-rose-400");
        setBgColor("bg-rose-500/10");
        setBorderColor("border-rose-500/30");
      }
    }
  }, [weight, height]);

  const minIdealWeight = Math.round(18.5 * (height / 100) * (height / 100) * 10) / 10;
  const maxIdealWeight = Math.round(24.9 * (height / 100) * (height / 100) * 10) / 10;

  // Simple formula for body fat estimation (Deurenberg formula)
  const age = 30; // Average base age
  const genderFactor = gender === "m" ? 1 : 0;
  const fatPercentage = Math.max(
    0,
    Math.round((1.2 * bmi + 0.23 * age - 10.8 * genderFactor - 5.4) * 10) / 10
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
              Genere
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGender("m")}
                className={`py-2 text-xs font-mono border rounded transition-all ${
                  gender === "m"
                    ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-bold"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                Uomo
              </button>
              <button
                onClick={() => setGender("f")}
                className={`py-2 text-xs font-mono border rounded transition-all ${
                  gender === "f"
                    ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-bold"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                Donna
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Altezza: <span className="text-zinc-200 font-bold">{height} cm</span>
              </label>
            </div>
            <input
              type="range"
              min="100"
              max="220"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
              <span>100 cm</span>
              <span>160 cm</span>
              <span>220 cm</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Peso: <span className="text-zinc-200 font-bold">{weight} kg</span>
              </label>
            </div>
            <input
              type="range"
              min="30"
              max="150"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
              <span>30 kg</span>
              <span>90 kg</span>
              <span>150 kg</span>
            </div>
          </div>
        </div>

        {/* Output metrics */}
        <div className={`p-5 border rounded flex flex-col justify-between transition-all duration-300 ${bgColor} ${borderColor}`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scale className={`w-4 h-4 ${color}`} />
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Risultato Calcolato
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-light text-zinc-100">{bmi}</span>
              <span className={`text-sm font-mono uppercase tracking-widest font-bold ${color}`}>
                {classification}
              </span>
            </div>

            {/* Custom mini bar graph gauge */}
            <div className="mt-6 h-2 bg-zinc-900 rounded-full overflow-hidden flex relative border border-zinc-800">
              <div className="w-[18.5%] h-full bg-sky-500/40" title="Sottopeso < 18.5" />
              <div className="w-[6.5%] h-full bg-emerald-500/40" title="Normopeso 18.5 - 25" />
              <div className="w-[5%] h-full bg-amber-500/40" title="Sovrappeso 25 - 30" />
              <div className="w-[70%] h-full bg-rose-500/40" title="Obesità > 30" />
              
              {/* Slider thumb representation on bar */}
              <div 
                className="absolute w-2 h-4 bg-zinc-100 border border-zinc-950 rounded shadow-md -top-1 transition-all duration-300 -translate-x-1/2"
                style={{ 
                  left: `${Math.min(100, Math.max(0, ((bmi - 10) / 35) * 100))}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-[8px] font-mono text-zinc-600 mt-1 uppercase">
              <span>BMI 10</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>BMI 45</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/30 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 font-mono">Peso Ideale (BMI 18.5 - 24.9):</span>
              <span className="text-zinc-300 font-bold font-mono">{minIdealWeight} - {maxIdealWeight} kg</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 font-mono">Stima Grasso Corporeo:</span>
              <span className="text-zinc-300 font-bold font-mono">~ {fatPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded flex gap-3 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">
          L'Indice di Massa Corporea (BMI) è un indicatore statistico orientativo basato su altezza e peso. 
          Non tiene conto della ripartizione tra massa magra e massa grassa, per cui sportivi e culturisti 
          potrebbero ricevere classificazioni non idonee.
        </p>
      </div>
    </div>
  );
}
