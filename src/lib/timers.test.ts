import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { pomodoro, pomodoroLeft, pomodoroStore, stopwatch, stopwatchElapsed, stopwatchStore } from "./timers";

test("the countdown keeps going with nobody looking, and stops at zero", () => {
  mock.timers.enable({ apis: ["setTimeout", "Date"] });
  pomodoro.reset();
  pomodoro.setDuration(60);
  pomodoro.start();
  assert.equal(pomodoroLeft(pomodoroStore.get()), 60);
  mock.timers.tick(25_000);
  assert.equal(pomodoroLeft(pomodoroStore.get()), 35);
  assert.notEqual(pomodoroStore.get().endAt, null);
  mock.timers.tick(36_000);
  assert.equal(pomodoroStore.get().endAt, null);
  assert.equal(pomodoroLeft(pomodoroStore.get()), 0);
  mock.timers.reset();
});

test("pause keeps the time left, and start continues from it", () => {
  mock.timers.enable({ apis: ["setTimeout", "Date"] });
  pomodoro.reset();
  pomodoro.setDuration(120);
  pomodoro.start();
  mock.timers.tick(30_000);
  pomodoro.pause();
  mock.timers.tick(60_000);
  assert.equal(pomodoroLeft(pomodoroStore.get()), 90);
  pomodoro.start();
  mock.timers.tick(10_000);
  assert.equal(pomodoroLeft(pomodoroStore.get()), 80);
  pomodoro.reset();
  mock.timers.reset();
});

test("switching phase stops the countdown and keeps each phase's own length", () => {
  pomodoro.reset();
  pomodoro.setDuration(10 * 60);
  pomodoro.choose("short");
  assert.equal(pomodoroLeft(pomodoroStore.get()), 5 * 60);
  pomodoro.choose("work");
  assert.equal(pomodoroLeft(pomodoroStore.get()), 10 * 60);
  pomodoro.reset();
  assert.equal(pomodoroLeft(pomodoroStore.get()), 25 * 60);
});

test("a finished countdown starts again from its full length", () => {
  mock.timers.enable({ apis: ["setTimeout", "Date"] });
  pomodoro.reset();
  pomodoro.setDuration(30);
  pomodoro.start();
  mock.timers.tick(31_000);
  assert.equal(pomodoroLeft(pomodoroStore.get()), 0);
  pomodoro.start();
  assert.equal(pomodoroLeft(pomodoroStore.get()), 30);
  pomodoro.reset();
  mock.timers.reset();
});

test("stopwatch counts across stops and resets", () => {
  stopwatch.reset();
  assert.equal(stopwatchElapsed(stopwatchStore.get()), 0);
  stopwatch.toggle();
  assert.equal(stopwatchStore.get().since !== null, true);
  stopwatch.lap();
  assert.equal(stopwatchStore.get().laps.length, 1);
  stopwatch.toggle();
  const stopped = stopwatchElapsed(stopwatchStore.get());
  assert.equal(stopwatchElapsed(stopwatchStore.get()), stopped);
  stopwatch.lap(); // not running: no lap
  assert.equal(stopwatchStore.get().laps.length, 1);
  stopwatch.reset();
  assert.deepEqual(stopwatchStore.get(), { before: 0, since: null, laps: [] });
});
