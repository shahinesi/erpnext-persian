import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PRODUCTION_PLAN = path.join(
  ROOT,
  "manufacturing/doctype/production_plan/production_plan.js"
);
const BOOK_APPOINTMENT = path.join(ROOT, "www/book_appointment/index.js");
const CUSTOMER_OVERVIEW = path.join(ROOT, "public/js/customer_overview.js");
const plain = (value) => JSON.parse(JSON.stringify(value));

function extractFunction(sourcePath, name, context) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in ${sourcePath}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index++) {
    if (source[index] === "{") depth++;
    if (source[index] === "}" && --depth === 0) {
      return vm.runInNewContext(`${source.slice(start, index + 1)}; ${name}`, context);
    }
  }
  assert.fail(`Unclosed function ${name} in ${sourcePath}`);
}

function extractMethod(sourcePath, name, context) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const start = source.indexOf(`${name}() {`);
  assert.notEqual(start, -1, `Missing ${name} in ${sourcePath}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index++) {
    if (source[index] === "{") depth++;
    if (source[index] === "}" && --depth === 0) {
      return vm.runInNewContext(`({${source.slice(start, index + 1)}}).${name}`, context);
    }
  }
  assert.fail(`Unclosed ${name} method in ${sourcePath}`);
}

function productionPlanContext(language = "fa-IR") {
  const calls = [];
  const context = {
    frappe: {
      boot: { lang: language },
      datetime: {
        str_to_user(value) {
          calls.push(["str_to_user", value]);
          return `shared:${value}`;
        },
        prettyDate(value) {
          calls.push(["prettyDate", value]);
          return `relative:${value}`;
        },
      },
    },
    moment(value) {
      return {
        format(format) {
          return `moment:${value}:${format}`;
        },
        diff() {
          return -1;
        },
        fromNow() {
          return `moment-relative:${value}`;
        },
      };
    },
  };
  return { calls, context };
}

describe("ERPNext production schedule Persian date display", () => {
  it("routes Persian schedule datetimes through Frappe's shared formatter", () => {
    const { calls, context } = productionPlanContext("fa-IR");
    const formatDate = extractFunction(PRODUCTION_PLAN, "format_schedule_date", context);

    assert.equal(formatDate("2026-10-27 12:30:00"), "shared:2026-10-27 12:30:00");
    assert.deepEqual(calls, [["str_to_user", "2026-10-27 12:30:00"]]);
  });

  it("keeps the existing English schedule format", () => {
    const { context } = productionPlanContext("en-US");
    const formatDate = extractFunction(PRODUCTION_PLAN, "format_schedule_date", context);

    assert.equal(
      formatDate("2026-10-27 12:30:00"),
      "moment:2026-10-27 12:30:00:Do MMMM YYYY, h:mm A"
    );
  });

  it("uses Frappe's canonical-digit relative formatter for past Persian schedules", () => {
    const { calls, context } = productionPlanContext("fa-IR");
    const startsIn = extractFunction(PRODUCTION_PLAN, "schedule_starts_in", context);

    assert.deepEqual(plain(startsIn("2026-10-27 12:00:00")), {
      label: "relative:2026-10-27 12:00:00",
      color: "gray",
    });
    assert.deepEqual(calls, [["prettyDate", "2026-10-27 12:00:00"]]);
  });

  it("keeps the existing English relative-time formatter", () => {
    const { context } = productionPlanContext("en-US");
    const startsIn = extractFunction(PRODUCTION_PLAN, "schedule_starts_in", context);

    assert.deepEqual(plain(startsIn("2026-10-27 12:00:00")), {
      label: "moment-relative:2026-10-27 12:00:00",
      color: "gray",
    });
  });
});

describe("ERPNext customer overview period date display", () => {
  function context(language) {
    const calls = [];
    return {
      calls,
      context: {
        frappe: {
          boot: { lang: language },
          datetime: {
            str_to_user(value, onlyTime, onlyDate) {
              calls.push([value, onlyTime, onlyDate]);
              return `shared:${value}`;
            },
          },
        },
        moment(value) {
          return {
            year() {
              return Number(value.slice(0, 4));
            },
            format(format) {
              return `moment:${value}:${format}`;
            },
          };
        },
      },
    };
  }

  const receiver = {
    sales: {
      data: {
        period_range: { from_date: "2026-03-21", to_date: "2026-03-31" },
      },
    },
  };

  it("uses Frappe's shared Jalali formatter for Persian period labels", () => {
    const { calls, context: sandbox } = context("fa-IR");
    const periodText = extractMethod(CUSTOMER_OVERVIEW, "period_text", sandbox);

    assert.equal(periodText.call(receiver), "shared:2026-03-21 – shared:2026-03-31");
    assert.deepEqual(calls, [
      ["2026-03-21", false, true],
      ["2026-03-31", false, true],
    ]);
  });

  it("preserves the existing English period date formats", () => {
    const { context: sandbox } = context("en-US");
    const periodText = extractMethod(CUSTOMER_OVERVIEW, "period_text", sandbox);

    assert.equal(
      periodText.call(receiver),
      "moment:2026-03-21:D MMM – moment:2026-03-31:D MMM YYYY"
    );
  });
});

function appointmentContext(language = "fa-IR") {
  const calls = [];
  const dateElement = { innerHTML: "" };
  const timeElement = { innerHTML: "" };
  const context = {
    frappe: {
      boot: { lang: language },
      datetime: {
        str_to_user(value, onlyTime = false, onlyDate = false) {
          calls.push(["str_to_user", value, onlyTime, onlyDate]);
          return `shared:${value}`;
        },
      },
    },
    window: {
      selected_date: "2026-10-27",
      selected_time: "14:30:00",
      appointment_settings: { appointment_duration: 30 },
    },
    document: {
      getElementsByClassName(name) {
        return [name === "date-span" ? dateElement : timeElement];
      },
      getElementById() {
        return { value: "Asia/Tehran" };
      },
    },
    navigate_to_page() {},
    setup_search_params() {},
    __(message) {
      return message;
    },
    moment(value, format) {
      let isEndTime = false;
      const instance = {
        format(outputFormat) {
          if (outputFormat === "HH:mm:ss") return isEndTime ? "15:00:00" : "14:30:00";
          if (outputFormat === "LT") return isEndTime ? "3:00 PM" : "2:30 PM";
          return `moment:${value}:${format || ""}:${outputFormat}`;
        },
        tz(timezone) {
          calls.push(["timezone", timezone]);
          return instance;
        },
        add() {
          isEndTime = true;
          return instance;
        },
      };
      return instance;
    },
  };
  return { calls, context, dateElement, timeElement };
}

describe("ERPNext public appointment date display", () => {
  it("uses canonical shared time formatting for timezone-adjusted Persian slots", () => {
    const { calls, context } = appointmentContext();
    const getSlotLayout = extractFunction(BOOK_APPOINTMENT, "get_slot_layout", context);

    const html = getSlotLayout(new Date("2026-10-27T11:00:00.000Z"));

    assert.match(html, /shared:14:30:00/);
    assert.match(html, /shared:15:00:00/);
    assert.deepEqual(calls, [
      ["timezone", "Asia/Tehran"],
      ["str_to_user", "14:30:00", true, false],
      ["timezone", "Asia/Tehran"],
      ["str_to_user", "15:00:00", true, false],
    ]);
  });

  it("uses shared Persian date and time formatting for the selected appointment", () => {
    const { calls, context, dateElement, timeElement } = appointmentContext();
    const setupDetails = extractFunction(BOOK_APPOINTMENT, "setup_details_page", context);

    setupDetails();

    assert.equal(dateElement.innerHTML, "shared:2026-10-27");
    assert.equal(timeElement.innerHTML, "shared:14:30:00");
    assert.deepEqual(calls, [
      ["str_to_user", "2026-10-27", false, true],
      ["str_to_user", "14:30:00", true, false],
    ]);
  });

  it("retains the existing English date and time labels", () => {
    const { context, dateElement, timeElement } = appointmentContext("en-US");
    const setupDetails = extractFunction(BOOK_APPOINTMENT, "setup_details_page", context);

    setupDetails();

    assert.equal(dateElement.innerHTML, "moment:2026-10-27::MMM Do YYYY");
    assert.equal(timeElement.innerHTML, "2:30 PM");
  });
});
