import React from "react";
import { Calendar } from "hs-uix";

const CALENDAR_DOCS = "https://github.com/05bmckay/hs-uix/blob/main/packages/calendar/README.md";

// ---------------------------------------------------------------------------
// Sample data — anchored around "today" = 2026-06-01 so the default views land
// on the current (populated) month/week with no defaultFocusedDate override,
// demonstrating the calendar's auto-focus-to-today behavior.
// ---------------------------------------------------------------------------

// Stage → Tag/StatusTag variant. Precomputed onto each deal as `color` so the
// Calendar can read it directly via eventFields.color.
const STAGE_COLOR = {
  "Closed won": "success",
  "Contract sent": "info",
  Negotiation: "warning",
  Discovery: "default",
  "Closed lost": "error",
};

const deal = (id, name, owner, stage, amount, createDate, closeDate) => ({
  id,
  name,
  owner,
  stage,
  amount,
  createDate,
  closeDate,
  color: STAGE_COLOR[stage] || "default",
});

// Names are intentionally fictional (well-known make-believe companies) so the
// demo never resembles real customer data.
const DEALS = [
  deal("d1", "Acme Corp – Renewal", "Alex Rivera", "Contract sent", 84000, "2026-03-10", "2026-06-01"),
  deal("d2", "Globex Additions", "Jordan Lee", "Negotiation", 142000, "2026-02-18", "2026-06-01"),
  deal("d3", "Initech 2026 – Tooling", "Sam Chen", "Discovery", 31000, "2026-04-02", "2026-06-01"),
  deal("d4", "Umbrella West – Expansion", "Priya Patel", "Contract sent", 56000, "2026-03-22", "2026-06-02"),
  deal("d5", "City of Springfield", "Chris Morgan", "Negotiation", 22000, "2026-04-12", "2026-06-04"),
  deal("d6", "Hooli IT Solutions", "Taylor Brooks", "Discovery", 18500, "2026-04-20", "2026-06-04"),
  deal("d7", "Pied Piper – Renewal", "Alex Rivera", "Closed won", 47000, "2026-01-30", "2026-06-04"),
  deal("d8", "Stark Industries – Power Units", "Jamie Fox", "Contract sent", 73000, "2026-03-15", "2026-06-05"),
  deal("d9", "Wayne Agritech – C9200L", "Robin Park", "Negotiation", 12000, "2026-04-25", "2026-06-05"),
  deal("d10", "Duff Beverages – CUBE Support", "Sam Chen", "Discovery", 95000, "2026-02-28", "2026-06-05"),
  deal("d11", "Cyberdyne – DL680 G11s", "Chris Morgan", "Closed won", 61000, "2026-03-01", "2026-06-08"),
  deal("d12", "Soylent One Call", "Priya Patel", "Discovery", 8000, "2026-04-30", "2026-06-08"),
  deal("d13", "Vandelay – 53268097098", "Jordan Lee", "Negotiation", 39000, "2026-03-18", "2026-06-20"),
  deal("d14", "Tyrell Audio Renewal", "Alex Rivera", "Contract sent", 27500, "2026-04-08", "2026-06-22"),
  deal("d15", "Massive Dynamic – 42020153999", "Taylor Brooks", "Closed lost", 15000, "2026-02-10", "2026-06-26"),
  deal("d16", "Wonka University Renewal", "Jamie Fox", "Discovery", 33000, "2026-05-04", "2026-07-03"),
  // Extra deals piled onto 06-04 (→ 5 events, "+2 more") and 06-05 (→ 5 events,
  // "+2 more") so the month grid's overflow popover is exercised.
  deal("d17", "Gekko Telecom – Edge POC", "Priya Patel", "Discovery", 64000, "2026-04-18", "2026-06-04"),
  deal("d18", "Nakatomi Dental Renewal", "Taylor Brooks", "Closed won", 29000, "2026-03-05", "2026-06-04"),
  deal("d19", "Aperture Storage – FlashBlade", "Jamie Fox", "Negotiation", 110000, "2026-04-01", "2026-06-05"),
  deal("d20", "Spacely Auto – Wireless", "Chris Morgan", "Contract sent", 41000, "2026-03-28", "2026-06-05"),
];

const DEAL_CALENDAR_FIELDS = {
  id: "id",
  start: "closeDate",
  title: "name",
  subtitle: "owner",
  color: "color",
};

const STAGE_FILTER = {
  name: "stage",
  type: "multiselect",
  placeholder: "All stages",
  chipLabel: "Stage",
  options: Object.keys(STAGE_COLOR).map((s) => ({ label: s, value: s })),
};

// ---------------------------------------------------------------------------
// Timed meetings (for the week/day time grid) — a realistic rep's week of
// 2026-06-01 (Mon). Exercises every time-grid behavior: back-to-back meetings,
// multi-hour blocks that span rows ("↑ cont. through …"), two events overlapping
// the same hour, all-day items, and a multi-day all-day event (the offsite) that
// shows up in the all-day band across several days. Typed + colored + owners.
// ---------------------------------------------------------------------------
const MEETING_TYPE_COLOR = {
  Customer: "info",
  Internal: "success",
  Prospecting: "default",
  Focus: "warning",
  "Out of office": "error",
};

const evt = (id, title, type, owner, start, end) => ({
  id,
  title,
  type,
  owner,
  start,
  end,
  color: MEETING_TYPE_COLOR[type] || "default",
});

const MEETINGS = [
  // Mon Jun 1
  evt("m1", "Daily standup", "Internal", "Squad A", "2026-06-01T08:30:00", "2026-06-01T09:00:00"),
  evt("m2", "Discovery — Acme Corp", "Prospecting", "Alex Rivera", "2026-06-01T09:30:00", "2026-06-01T10:30:00"),
  evt("m3", "Demo — Umbrella West", "Customer", "Priya Patel", "2026-06-01T11:00:00", "2026-06-01T12:00:00"),
  evt("m4", "QBR prep block", "Focus", "Jordan Lee", "2026-06-01T13:00:00", "2026-06-01T15:00:00"),
  evt("m5", "Sync — Jordan, Sam & Priya", "Internal", "Jordan Lee", "2026-06-01T15:30:00", "2026-06-01T16:30:00"),
  // Tue Jun 2
  evt("m6", "Team offsite", "Internal", "Everyone", "2026-06-02T00:00:00", "2026-06-02T00:00:00"),
  evt("m7", "Onsite migration workshop", "Customer", "Globex", "2026-06-02T09:00:00", "2026-06-02T15:00:00"),
  evt("m8", "Renewal sync", "Customer", "Alex Rivera", "2026-06-02T16:00:00", "2026-06-02T16:30:00"),
  // Wed Jun 3 — m11/m12 overlap the 2 PM hour
  evt("m9", "Inbox & planning", "Focus", "Jordan Lee", "2026-06-03T08:00:00", "2026-06-03T08:30:00"),
  evt("m10", "Squad sync", "Internal", "Squad A", "2026-06-03T10:00:00", "2026-06-03T11:00:00"),
  evt("m11", "Security review — Duff Beverages", "Customer", "Sam Chen", "2026-06-03T14:00:00", "2026-06-03T15:30:00"),
  evt("m12", "Quick sync — Legal", "Internal", "Robin Park", "2026-06-03T14:30:00", "2026-06-03T15:00:00"),
  // Thu Jun 4
  evt("m13", "1:1 with manager", "Internal", "Jordan Lee", "2026-06-04T09:00:00", "2026-06-04T10:00:00"),
  evt("m14", "Lunch & learn", "Internal", "Squad A", "2026-06-04T12:00:00", "2026-06-04T13:00:00"),
  evt("m15", "Aperture Storage POC walkthrough", "Customer", "Jamie Fox", "2026-06-04T13:30:00", "2026-06-04T17:00:00"),
  // Fri Jun 5
  evt("m16", "Partner sync — Pied Piper", "Internal", "Jordan Lee", "2026-06-05T09:30:00", "2026-06-05T11:00:00"),
  evt("m17", "QBR — Globex", "Customer", "Priya Patel", "2026-06-05T13:00:00", "2026-06-05T14:30:00"),
  evt("m18", "Week wrap-up & forecast", "Focus", "Jordan Lee", "2026-06-05T16:00:00", "2026-06-05T17:00:00"),
  // Multi-day all-day event spanning Wed–Fri
  evt("m19", "SaaS Summit (offsite)", "Out of office", "Jordan Lee", "2026-06-03T00:00:00", "2026-06-05T00:00:00"),
];

const MEETING_FIELDS = { id: "id", start: "start", end: "end", title: "title", subtitle: "owner", color: "color" };

const MEETING_TYPE_FILTER = {
  name: "type",
  type: "multiselect",
  placeholder: "All types",
  chipLabel: "Type",
  options: Object.keys(MEETING_TYPE_COLOR).map((t) => ({ label: t, value: t })),
};

// ---------------------------------------------------------------------------
// Demos
// ---------------------------------------------------------------------------

const DealCalendarDemo = () => (
  <Calendar
    events={DEALS}
    eventFields={DEAL_CALENDAR_FIELDS}
    defaultView="month"
    views={["month", "week", "day", "agenda"]}
    showSearch
    searchFields={["name", "owner", "stage"]}
    filters={[STAGE_FILTER]}
    maxEventsPerDay={3}
    overlayMode="popover"
  />
);

const WeekScheduleDemo = () => (
  <Calendar
    events={MEETINGS}
    eventFields={MEETING_FIELDS}
    defaultView="week"
    views={["week", "day", "agenda"]}
    dayStartHour={8}
    dayEndHour={18}
    weekStartsOn={1}
    showSearch
    searchFields={["title", "owner", "type"]}
    filters={[MEETING_TYPE_FILTER]}
    overlayMode="popover"
  />
);

const TimeZoneDemo = () => (
  <Calendar
    events={MEETINGS}
    eventFields={MEETING_FIELDS}
    defaultView="week"
    views={["week", "day", "agenda"]}
    dayStartHour={8}
    dayEndHour={18}
    weekStartsOn={1}
    showTimeZoneSelect
    showSearch
    searchFields={["title", "owner", "type"]}
    filters={[MEETING_TYPE_FILTER]}
    overlayMode="popover"
  />
);

const DayScheduleDemo = () => (
  <Calendar
    events={MEETINGS}
    eventFields={MEETING_FIELDS}
    defaultView="day"
    views={["day", "week", "agenda"]}
    dayStartHour={8}
    dayEndHour={18}
    showSearch
    searchFields={["title", "owner", "type"]}
    filters={[MEETING_TYPE_FILTER]}
    overlayMode="popover"
  />
);

export const CALENDAR_DEMOS = [
  {
    id: "calendar-deal-close-dates",
    name: "Deal close-date calendar",
    description:
      "Deals plotted on their close date, colored by stage. The calendar auto-focuses today's month (no defaultFocusedDate set). Switch between Month / Week / Day / Agenda via the view selector; search and a stage filter scope the events; clicking an event opens a Popover.",
    package: "calendar",
    Component: DealCalendarDemo,
    githubUrl: CALENDAR_DOCS,
    sourceCode: `<Calendar
  events={deals}
  eventFields={{ id: "id", start: "closeDate", title: "name", subtitle: "owner", color: "color" }}
  defaultView="month"
  views={["month", "week", "day", "agenda"]}
  showSearch
  searchFields={["name", "owner", "stage"]}
  filters={[{ name: "stage", type: "multiselect", placeholder: "All stages", options: stageOptions }]}
  maxEventsPerDay={3}
  overlayMode="popover"
/>`,
  },
  {
    id: "calendar-week-schedule",
    name: "Week schedule (time grid)",
    description:
      "A rep's full week in an hour-row Table (Monday start, 8 AM–6 PM): back-to-back meetings, multi-hour blocks that span rows with a '↑ cont. through …' note, overlapping events, and an all-day band. Times render exactly as the event data provides them — no timezone layer. Search + a meeting-type filter scope it; clicking opens a Popover.",
    package: "calendar",
    Component: WeekScheduleDemo,
    githubUrl: CALENDAR_DOCS,
    sourceCode: `<Calendar
  events={meetings}
  eventFields={{ id: "id", start: "start", end: "end", title: "title", subtitle: "owner", color: "color" }}
  defaultView="week"
  views={["week", "day", "agenda"]}
  dayStartHour={8}
  dayEndHour={18}
  weekStartsOn={1}
  showSearch
  searchFields={["title", "owner", "type"]}
  filters={[{ name: "type", type: "multiselect", placeholder: "All types", options: typeOptions }]}
  overlayMode="popover"
/>`,
  },
  {
    id: "calendar-timezones",
    name: "Timezones (opt-in)",
    description:
      "Timezones are off by default — events render exactly as sent. Opt in with showTimeZoneSelect (or a timeZone prop) and a toolbar dropdown appears with DST-aware 'UTC −05:00 Central Time' labels; the layer starts at UTC and re-renders every time, the grid placement, and day-grouping in the chosen IANA zone.",
    package: "calendar",
    Component: TimeZoneDemo,
    githubUrl: CALENDAR_DOCS,
    sourceCode: `// Off by default: with no timeZone / showTimeZoneSelect, events render as-sent.
// Opt in to expose the built-in selector (starts at UTC):
<Calendar
  events={meetings}
  eventFields={{ id: "id", start: "start", end: "end", title: "title", subtitle: "owner", color: "color" }}
  defaultView="week"
  views={["week", "day", "agenda"]}
  dayStartHour={8}
  dayEndHour={18}
  weekStartsOn={1}
  showTimeZoneSelect            // built-in tz dropdown; or pass timeZone="America/Chicago"
  showSearch
  searchFields={["title", "owner", "type"]}
  filters={[{ name: "type", type: "multiselect", placeholder: "All types", options: typeOptions }]}
  overlayMode="popover"
/>`,
  },
  {
    id: "calendar-day-schedule",
    name: "Day schedule (time grid)",
    description:
      "The same week's events focused on a single day (auto-focused to today). One wide day column filling the width, hour rows 8 AM–6 PM, an all-day band, multi-hour blocks spanning rows, and a 'now' marker on the current hour. Clicking an event opens a Popover (the default).",
    package: "calendar",
    Component: DayScheduleDemo,
    githubUrl: CALENDAR_DOCS,
    sourceCode: `<Calendar
  events={meetings}
  eventFields={{ id: "id", start: "start", end: "end", title: "title", subtitle: "owner", color: "color" }}
  defaultView="day"
  views={["day", "week", "agenda"]}
  dayStartHour={8}
  dayEndHour={18}
  showSearch
  searchFields={["title", "owner", "type"]}
  filters={[{ name: "type", type: "multiselect", placeholder: "All types", options: typeOptions }]}
  // overlayMode defaults to "popover"; override with "modal"/"panel" or use onEventClick
/>`,
  },
];
