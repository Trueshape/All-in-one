import { useMemo, useState } from "react";
import { Gift, Heart, Moon, Wind } from "lucide-react";
import { DatePicker, Field, TextInput, Panel, ResultCard, Row, Stat, SectionTitle, Notice, Stack, cx, fmtNumber } from "../ui/kit";
import { useUi } from "../ui/tokens";

const WEEKDAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const DAY_MS = 86_400_000;

const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Parses "YYYY-MM-DD" as a local date (new Date(str) would read it as UTC). */
function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

const utcDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

function computeAge(birth: Date, today: Date) {
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.round((utcDay(today) - utcDay(birth)) / DAY_MS);

  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (utcDay(next) < utcDay(today)) next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  const daysToBirthday = Math.round((utcDay(next) - utcDay(today)) / DAY_MS);

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
    weekday: WEEKDAYS[birth.getDay()],
    daysToBirthday,
  };
}

export default function AgeCalculator() {
  const u = useUi();
  const [birthdate, setBirthdate] = useState("1995-05-15");
  const today = useMemo(() => new Date(), []);

  const age = useMemo(() => {
    const birth = parseLocalDate(birthdate);
    if (!birth || utcDay(birth) > utcDay(today)) return null;
    return computeAge(birth, today);
  }, [birthdate, today]);

  return (
    <Stack>
      <Field label="Data di nascita">
        <DatePicker value={birthdate} max={toDateInput(today)} onChange={setBirthdate} />
      </Field>

      {!age ? (
        <Notice tone="empty">Inserisci una data di nascita valida, non nel futuro.</Notice>
      ) : (
        <>
          <ResultCard label="Età esatta" value={`${age.years} anni ${age.months} mesi ${age.days} giorni`} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel className="space-y-1.5">
              <SectionTitle>Info nascita</SectionTitle>
              <div className="pt-2 space-y-1.5">
                <Row label="Giorno della settimana" value={age.weekday} />
                <Row label="Mesi vissuti" value={fmtNumber(age.totalMonths)} />
                <Row label="Settimane vissute" value={fmtNumber(age.totalWeeks)} />
                <Row label="Giorni vissuti" value={fmtNumber(age.totalDays)} />
              </div>
            </Panel>

            <Panel className="flex flex-col items-center justify-center gap-2 text-center">
              <Gift className={`w-5 h-5 shrink-0 ${u.accent}`} />
              <div>
                <span className={u.statLabel}>Mancano al compleanno</span>
                <div className={`text-lg font-bold font-mono ${u.statValue}`}>
                  {age.daysToBirthday === 0 ? "Buon compleanno! 🎉" : `${age.daysToBirthday} ${age.daysToBirthday === 1 ? "giorno" : "giorni"}`}
                </div>
              </div>
            </Panel>
          </div>

          <div className="space-y-3">
            <SectionTitle>Stime del viaggio della vita</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: <Heart className="w-6 h-6 text-rose-500 animate-pulse shrink-0" />, label: "Battiti cardiaci", value: fmtNumber(age.totalDays * 24 * 60 * 70, 0), card: "bg-rose-500/5 border-rose-500/10", text: "text-rose-400" },
                { icon: <Wind className="w-6 h-6 text-emerald-400 shrink-0" />, label: "Respiri compiuti", value: fmtNumber(age.totalDays * 24 * 60 * 16, 0), card: "bg-emerald-500/5 border-emerald-500/10", text: "text-emerald-400" },
                { icon: <Moon className="w-6 h-6 text-indigo-400 shrink-0" />, label: "Ore di sonno", value: `${fmtNumber(age.totalDays * 8, 0)} ore`, card: "bg-indigo-500/5 border-indigo-500/10", text: "text-indigo-300" },
              ].map((stat) => (
                <div key={stat.label} className={cx("px-5 py-3.5 border rounded-xl flex items-center gap-4", stat.card)}>
                  {stat.icon}
                  <div>
                    <span className={cx("block text-[10px] font-mono uppercase tracking-wider mb-0.5", u.muted)}>{stat.label}</span>
                    <span className={cx("text-lg font-bold font-mono", stat.text)}>{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <Notice>Stime medie: 70 battiti/min, 16 respiri/min, 8 ore di sonno al giorno.</Notice>
          </div>
        </>
      )}
    </Stack>
  );
}
