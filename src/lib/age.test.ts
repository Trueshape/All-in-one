import test from "node:test";
import assert from "node:assert/strict";
import { computeAge } from "./age";

const d = (s: string) => {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
};
const ymd = (birth: string, today: string) => {
  const a = computeAge(d(birth), d(today));
  return [a.years, a.months, a.days];
};

test("a plain birthday gives whole years", () => {
  assert.deepEqual(ymd("1995-05-15", "2025-05-15"), [30, 0, 0]);
  assert.deepEqual(ymd("1995-05-15", "2025-05-14"), [29, 11, 29]);
});

test("a day the month does not have never gives negative days", () => {
  // born 31 January: one month later is 28 February, so 1 March is 1 day past it
  assert.deepEqual(ymd("2000-01-31", "2023-03-01"), [23, 1, 1]);
  assert.deepEqual(ymd("2000-01-30", "2023-03-01"), [23, 1, 1]);
  assert.deepEqual(ymd("2000-01-31", "2023-02-28"), [23, 1, 0]);
  assert.deepEqual(ymd("2000-12-31", "2024-03-01"), [23, 2, 1]);
});

test("no combination of dates gives negative parts", () => {
  const birth = d("1999-01-31");
  for (let i = 0; i < 800; i++) {
    const today = new Date(2020, 0, 1 + i);
    const a = computeAge(birth, today);
    assert.ok(a.years >= 0 && a.months >= 0 && a.months < 12 && a.days >= 0 && a.days < 32, `${today.toDateString()} → ${a.years}/${a.months}/${a.days}`);
  }
});

test("birthday on a leap day and days to the next birthday", () => {
  assert.equal(computeAge(d("2000-02-29"), d("2024-02-29")).daysToBirthday, 0);
  assert.equal(computeAge(d("1995-05-15"), d("2025-05-14")).daysToBirthday, 1);
  assert.equal(computeAge(d("1995-05-15"), d("2025-05-16")).daysToBirthday, 364);
});

test("totals and weekday", () => {
  const a = computeAge(d("2000-01-01"), d("2000-01-15"));
  assert.equal(a.totalDays, 14);
  assert.equal(a.totalWeeks, 2);
  assert.equal(a.weekday, "Sabato");
});
