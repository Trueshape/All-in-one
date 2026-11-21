import test from "node:test";
import assert from "node:assert/strict";
import { randomInt, wheelAngle } from "./random";

const sequence = (...values: number[]) => {
  let i = 0;
  return (buf: Uint32Array) => void (buf[0] = values[i++ % values.length]);
};

test("randomInt stays in range with the real generator", () => {
  for (let i = 0; i < 2000; i++) {
    const n = randomInt(6);
    assert.ok(Number.isInteger(n) && n >= 0 && n < 6);
  }
  assert.equal(randomInt(1), 0);
});

test("values from the uneven top of the range are thrown away", () => {
  // max 3: limit is 4294967295, so 0xFFFFFFFF (index 4294967295) is rejected and the next value is used
  assert.equal(randomInt(3, sequence(0xffffffff, 7)), 1);
  assert.equal(randomInt(6, sequence(0xffffffff, 0xfffffffe, 5)), 5);
});

test("each value of a small range comes up about equally often", () => {
  const counts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 12000; i++) counts[randomInt(6)]++;
  for (const c of counts) assert.ok(c > 1700 && c < 2300, counts.join(","));
});

test("the wheel stops with the winning slice under the pointer", () => {
  for (const count of [2, 3, 5, 8]) {
    for (let winner = 0; winner < count; winner++) {
      for (const offset of [0, 0.5, 0.999]) {
        const angle = wheelAngle(0, winner, count, offset);
        const slice = 360 / count;
        // the pointer is at the top: the wheel turned by `angle`, so the slice under it is the one at (360 - angle) mod 360
        const under = ((360 - (angle % 360)) % 360 + 360) % 360;
        assert.equal(Math.floor(under / slice), winner, `${count} slices, winner ${winner}, offset ${offset}`);
      }
    }
  }
});

test("the wheel always spins forward, at least six turns", () => {
  let angle = 0;
  for (let i = 0; i < 5; i++) {
    const next = wheelAngle(angle, i % 4, 4, 0.5);
    assert.ok(next - angle >= 360 * 6, `${angle} -> ${next}`);
    angle = next;
  }
});
