import { test } from "vitest";
import assert from "node:assert/strict";
import {
  compareDateStrings,
  dateOnlyToDbDate,
  dateToIsoDate,
  getCurrentMinutesInTurkey,
  getDayOfWeekFromDate,
  getTodayDateInTurkey,
  getTomorrowDateInTurkey,
  getUtcRangeForTurkeyDate,
} from "@/lib/date";

test("getTodayDateInTurkey returns Turkey-local date", () => {
  const now = new Date("2026-04-05T00:30:00.000Z");
  assert.equal(getTodayDateInTurkey(now), "2026-04-05");
});

test("getTomorrowDateInTurkey rolls over correctly", () => {
  const now = new Date("2026-12-31T20:30:00.000Z");
  assert.equal(getTomorrowDateInTurkey(now), "2027-01-01");
});

test("getCurrentMinutesInTurkey returns local time in minutes", () => {
  const now = new Date("2026-04-05T06:15:00.000Z");
  assert.equal(getCurrentMinutesInTurkey(now), 555);
});

test("compareDateStrings sorts lexicographically safe ISO dates", () => {
  assert.equal(compareDateStrings("2026-04-05", "2026-04-05"), 0);
  assert.equal(compareDateStrings("2026-04-04", "2026-04-05"), -1);
  assert.equal(compareDateStrings("2026-04-06", "2026-04-05"), 1);
});

test("getDayOfWeekFromDate returns UTC-safe weekday", () => {
  assert.equal(getDayOfWeekFromDate("2026-04-05"), 0);
  assert.equal(getDayOfWeekFromDate("2026-04-06"), 1);
});

test("dateOnlyToDbDate and dateToIsoDate preserve date-only values", () => {
  const dbDate = dateOnlyToDbDate("2026-04-05");
  assert.equal(dateToIsoDate(dbDate), "2026-04-05");
});

test("getUtcRangeForTurkeyDate returns an increasing range", () => {
  const { startUtc, endUtc } = getUtcRangeForTurkeyDate("2026-04-05");
  assert.ok(startUtc < endUtc);
  assert.equal(startUtc.toISOString(), "2026-04-04T21:00:00.000Z");
  assert.equal(endUtc.toISOString(), "2026-04-05T20:59:59.999Z");
});
