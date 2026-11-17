const WEEKDAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const DAY_MS = 86_400_000;

export const utcDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

/** The birth date moved forward by whole months; a day that the month does not have (31 in February) becomes the month's last day. */
function addMonths(birth: Date, months: number): Date {
  const first = new Date(birth.getFullYear(), birth.getMonth() + months, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(birth.getDate(), last));
}

/** Age in years, months and days at `today` (a date not before `birth`), plus totals and the days left to the next birthday. */
export function computeAge(birth: Date, today: Date) {
  // whole months lived: the largest count whose anniversary is not after today
  let whole = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (utcDay(addMonths(birth, whole)) > utcDay(today)) whole -= 1;
  const days = Math.round((utcDay(today) - utcDay(addMonths(birth, whole))) / DAY_MS);
  const years = Math.floor(whole / 12);
  const months = whole % 12;

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
    totalMonths: whole,
    weekday: WEEKDAYS[birth.getDay()],
    daysToBirthday,
  };
}
