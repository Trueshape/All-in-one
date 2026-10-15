import React, { useState, useEffect } from "react";
import { Clock, Globe, Sun, Moon } from "lucide-react";

interface CityClock {
  name: string;
  country: string;
  timezone: string;
  icon: string;
}

const CITIES: CityClock[] = [
  { name: "Roma", country: "Italia", timezone: "Europe/Rome", icon: "🇮🇹" },
  { name: "Londra", country: "Regno Unito", timezone: "Europe/London", icon: "🇬🇧" },
  { name: "New York", country: "USA", timezone: "America/New_York", icon: "🇺🇸" },
  { name: "Los Angeles", country: "USA", timezone: "America/Los_Angeles", icon: "🇺🇸" },
  { name: "Tokyo", country: "Giappone", timezone: "Asia/Tokyo", icon: "🇯🇵" },
  { name: "Sydney", country: "Australia", timezone: "Australia/Sydney", icon: "🇦🇺" },
  { name: "Dubai", country: "EAU", timezone: "Asia/Dubai", icon: "🇦🇪" },
];

export default function WorldClock() {
  const [time, setTime] = useState<Date>(new Date());
  const [offsetHours, setOffsetHours] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCityTime = (timezone: string) => {
    // Add custom offset (for meeting planner slider)
    const baseTime = new Date(time.getTime() + offsetHours * 60 * 60 * 1000);
    try {
      const formatter = new Intl.DateTimeFormat("it-IT", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: offsetHours === 0 ? "2-digit" : undefined,
        hour12: false,
      });
      return formatter.format(baseTime);
    } catch (e) {
      return "00:00";
    }
  };

  const getCityDate = (timezone: string) => {
    const baseTime = new Date(time.getTime() + offsetHours * 60 * 60 * 1000);
    try {
      const formatter = new Intl.DateTimeFormat("it-IT", {
        timeZone: timezone,
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      return formatter.format(baseTime);
    } catch (e) {
      return "";
    }
  };

  // Determine day/night based on hours
  const isDaytime = (timezone: string) => {
    const baseTime = new Date(time.getTime() + offsetHours * 60 * 60 * 1000);
    try {
      const hoursString = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      }).format(baseTime);
      const hours = parseInt(hoursString, 10);
      return hours >= 6 && hours < 18;
    } catch (e) {
      return true;
    }
  };

  return (
    <div className="space-y-6">
      {/* Timezone sync planner slider */}
      <div className="bg-zinc-950/20 border border-zinc-850 p-4 rounded space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-400" />
            Pianificatore Fusi Orari
          </label>
          <span className="text-xs font-mono text-zinc-300">
            {offsetHours === 0 ? (
              <span className="text-emerald-400 font-bold uppercase">Tempo Reale Live</span>
            ) : (
              <span>Spostamento: <strong className="text-indigo-400">{offsetHours > 0 ? `+${offsetHours}` : offsetHours} ore</strong></span>
            )}
          </span>
        </div>
        <input
          type="range"
          min="-12"
          max="12"
          value={offsetHours}
          onChange={(e) => setOffsetHours(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
        />
        <div className="flex justify-between text-[9px] font-mono text-zinc-600 uppercase">
          <span>-12 ore</span>
          <button 
            onClick={() => setOffsetHours(0)} 
            className="text-[10px] text-zinc-500 hover:text-zinc-300 border-b border-zinc-800"
          >
            Sincronizza Ora
          </button>
          <span>+12 ore</span>
        </div>
      </div>

      {/* Grid of Cities */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {CITIES.map((city) => {
          const day = isDaytime(city.timezone);
          return (
            <div
              key={city.name}
              className={`p-4 border rounded flex flex-col justify-between transition-all duration-300 bg-zinc-950/40 border-zinc-850 hover:border-zinc-700`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block leading-tight">
                    {city.icon} {city.country}
                  </span>
                  <span className="text-sm font-bold text-zinc-200 mt-1 block">
                    {city.name}
                  </span>
                </div>
                <div>
                  {day ? (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </div>
              </div>

              <div className="mt-5">
                <span className="text-2xl font-light text-zinc-100 block tracking-tight tabular-nums">
                  {getCityTime(city.timezone)}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block uppercase mt-0.5">
                  {getCityDate(city.timezone)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
