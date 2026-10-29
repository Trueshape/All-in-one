import { useMemo, useState } from "react";
import { Gift, Heart, Moon, Wind } from "lucide-react";
import { Field, TextInput, Panel, ResultCard, Row, Stat, SectionTitle, Notice, Stack, fmtNumber } from "../ui/kit";
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
        <TextInput type="date" value={birthdate} max={toDateInput(today)} onChange={(e) => setBirthdate(e.target.value)} />
      </Field>

      {!age ? (
        <Notice>Inserisci una data di nascita valida, non nel futuro.</Notice>
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

            <Panel className="flex items-center gap-3">
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
              <Stat
                label={<span className="inline-flex items-center gap-1.5"><Heart className="w-3 h-3" /> Battiti cardiaci</span>}
                value={fmtNumber(age.totalDays * 24 * 60 * 70, 0)}
              />
              <Stat
                label={<span className="inline-flex items-center gap-1.5"><Wind className="w-3 h-3" /> Respiri</span>}
                value={fmtNumber(age.totalDays * 24 * 60 * 16, 0)}
              />
              <Stat
                label={<span className="inline-flex items-center gap-1.5"><Moon className="w-3 h-3" /> Ore di sonno</span>}
                value={fmtNumber(age.totalDays * 8, 0)}
              />
            </div>
            <p className={`text-[11px] ${u.muted}`}>Stime medie: 70 battiti/min, 16 respiri/min, 8 ore di sonno al giorno.</p>
          </div>
        </>
      )}
    </Stack>
  );
}
