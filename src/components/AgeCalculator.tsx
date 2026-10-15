import React, { useState, useEffect } from "react";
import { Gift, Heart, Calendar, Moon, Wind } from "lucide-react";

export default function AgeCalculator() {
  const [birthdate, setBirthdate] = useState<string>("1995-05-15");
  const [ageDetails, setAgeDetails] = useState<{
    years: number;
    months: number;
    days: number;
    totalDays: number;
    totalWeeks: number;
    totalMonths: number;
    birthDayOfWeek: string;
    nextBirthdayDays: number;
  } | null>(null);

  useEffect(() => {
    if (!birthdate) return;

    const birth = new Date(birthdate);
    const today = new Date();

    if (isNaN(birth.getTime()) || birth > today) {
      setAgeDetails(null);
      return;
    }

    // Exact Age Calculation
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    // Total Days Lived
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Total Weeks and Months Lived
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = (years * 12) + months;

    // Birth weekday
    const weekdays = [
      "Domenica",
      "Lunedì",
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
    ];
    const birthDayOfWeek = weekdays[birth.getDay()];

    // Next Birthday countdown
    const nextBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (today > nextBday) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }
    const diffNextTime = nextBday.getTime() - today.getTime();
    const nextBirthdayDays = Math.ceil(diffNextTime / (1000 * 60 * 60 * 24));

    setAgeDetails({
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalMonths,
      birthDayOfWeek,
      nextBirthdayDays,
    });
  }, [birthdate]);

  // Statistics estimations
  const totalDays = ageDetails?.totalDays || 0;
  const estHeartbeats = totalDays * 24 * 60 * 70; // 70 bpm
  const estBreaths = totalDays * 24 * 60 * 16; // 16 breaths per min
  const estHoursSlept = totalDays * 8; // 8 hours sleep per day

  const formattingNumber = (val: number) => {
    return new Intl.NumberFormat("it-IT").format(val);
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Date Selector + Results Panels */}
        <div className="space-y-6">
          <div className="bg-zinc-950/40 border border-zinc-800 rounded px-4.5 py-2.5 focus-within:border-zinc-700 transition-all">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
              Seleziona Data di Nascita
            </label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full bg-transparent border-none p-0 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-0"
            />
          </div>

          {ageDetails ? (
            <div className="flex flex-col gap-3.5">
              {/* Age output */}
              <div className="bg-zinc-950/20 border border-zinc-800/80 rounded p-4">
                <div>
                  <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider mb-2.5">Età Esatta Calcolata</span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-2xl font-bold font-mono text-zinc-100 not-italic">{ageDetails.years}</span>
                    <span className="text-xs text-zinc-450 font-mono mr-2 not-italic">Anni</span>
                    <span className="text-2xl font-bold font-mono text-zinc-100 not-italic">{ageDetails.months}</span>
                    <span className="text-xs text-zinc-450 font-mono mr-2 not-italic">Mesi</span>
                    <span className="text-2xl font-bold font-mono text-zinc-100 not-italic">{ageDetails.days}</span>
                    <span className="text-xs text-zinc-450 font-mono not-italic">Giorni</span>
                  </div>
                </div>
              </div>

              {/* Next Birthday countdown */}
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded p-4">
                <div className="flex items-start gap-2.5">
                  <Gift className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider mb-1">Mancano al compleanno</span>
                    <span className="text-base font-bold font-mono text-zinc-200 not-italic">
                      {ageDetails.nextBirthdayDays === 365 || ageDetails.nextBirthdayDays === 0 ? (
                        <span className="text-emerald-400 font-extrabold not-italic">Buon Compleanno! 🎉</span>
                      ) : (
                        <span className="not-italic">{ageDetails.nextBirthdayDays} giorni</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-zinc-800/40 border-dashed rounded text-center flex flex-col justify-center items-center">
              <span className="text-xs text-zinc-500 font-mono">Inserisci una data di nascita valida per sbloccare l'età esatta.</span>
            </div>
          )}
        </div>

        {/* Right Column: Info Nascita */}
        <div>
          {ageDetails ? (
            <div className="p-6 bg-zinc-950/20 border border-zinc-850 rounded space-y-4 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-zinc-400" />
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Info Nascita
                  </span>
                </div>
                
                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between border-b border-zinc-900/50 pb-2">
                    <span className="text-zinc-500 font-mono">Giorno della settimana:</span>
                    <span className="text-zinc-300 font-bold font-mono not-italic">{ageDetails.birthDayOfWeek}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/50 pb-2">
                    <span className="text-zinc-500 font-mono">Mesi vissuti:</span>
                    <span className="text-zinc-300 font-bold font-mono not-italic">{formattingNumber(ageDetails.totalMonths)}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/50 pb-2">
                    <span className="text-zinc-500 font-mono">Settimane vissute:</span>
                    <span className="text-zinc-300 font-bold font-mono not-italic">{formattingNumber(ageDetails.totalWeeks)}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-zinc-500 font-mono">Giorni vissuti:</span>
                    <span className="text-zinc-300 font-bold font-mono not-italic">{formattingNumber(ageDetails.totalDays)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 border border-zinc-800/40 border-dashed rounded text-center flex flex-col justify-center items-center h-full">
              <span className="text-sm text-zinc-500 font-mono">Inserisci una data di nascita valida per sbloccare le info nascita.</span>
            </div>
          )}
        </div>
      </div>

      {/* Lifespan Fun Statistics */}
      {ageDetails && (
        <div className="border-t border-zinc-850 pt-7 space-y-4">
          <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider">Stime Statistiche del Viaggio della Vita</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
            {/* Heartbeats */}
            <div className="px-5 py-3.5 bg-rose-500/5 border border-rose-500/10 rounded flex items-center gap-4.5">
              <Heart className="w-6 h-6 text-rose-500 animate-pulse shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-wider mb-0.5">Battiti Cardiaci</span>
                <span className="text-lg font-bold font-mono text-rose-400 not-italic">{formattingNumber(estHeartbeats)}</span>
              </div>
            </div>

            {/* Breaths */}
            <div className="px-5 py-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded flex items-center gap-4.5">
              <Wind className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-wider mb-0.5">Respiri Compiuti</span>
                <span className="text-lg font-bold font-mono text-emerald-400 not-italic">{formattingNumber(estBreaths)}</span>
              </div>
            </div>

            {/* Sleep hours */}
            <div className="px-5 py-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded flex items-center gap-4.5">
              <Moon className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-wider mb-0.5">Ore di Sonno</span>
                <span className="text-lg font-bold font-mono text-indigo-300 not-italic">{formattingNumber(estHoursSlept)} ore</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
