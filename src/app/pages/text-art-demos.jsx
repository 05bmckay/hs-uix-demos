import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  DescriptionList,
  DescriptionListItem,
  Divider,
  Flex,
  Heading,
  Image,
  Input,
  Link,
  StepperInput,
  Text,
  Tile,
  ToggleGroup,
} from "@hubspot/ui-extensions";
import { StyledText } from "hs-uix";

// ═══════════════════════════════════════════════════════════════════════════
// Text Art demos
//
// HubSpot's standard <Text> component renders into a proportional font, so
// multi-line ASCII art will *not* align between lines. Most demos here are
// therefore designed around techniques that survive a proportional font:
//
//   • single-line sparklines built from block characters (▁▂▃▄▅▆▇█)
//   • inline progress meters / gauges (█░ ▰▱ ◖◗)
//   • status & trend glyphs as semantic prefixes (● ○ ▲ ▼ ◆ ★)
//   • activity journey "rails" rendered on one line (●─●─◌─○)
//   • heatmap strips made from shaded blocks (░▒▓█)
//   • braille spinners that animate via setInterval
//
// The final demo ("Monospace via StyledText") escapes the proportional-font
// limitation entirely: hs-uix's <StyledText> renders text as an SVG <Image>
// with a real fontFamily prop, so passing fontFamily="...monospace" gives
// pixel-perfect column alignment and unlocks true multi-line ASCII art:
// box-drawing borders, tree views, and aligned grids.
//
// Trade-off: StyledText is rendered as an image, so the text is NOT user-
// selectable. Use it for visual ornament; use <Text> anywhere copy matters.
// ═══════════════════════════════════════════════════════════════════════════

const TEXT_ART_DOCS =
  "https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/standard-components/text";

// ---------------------------------------------------------------------------
// Glyph palettes
// ---------------------------------------------------------------------------

// Eighth-block bars sorted from empty-ish to full. Used for sparklines and
// vertical bar-chart-in-a-line tricks.
const SPARK_BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

// Shaded blocks for heatmaps / density strips.
const SHADE_BLOCKS = [" ", "░", "▒", "▓", "█"];

// Braille frames — these all have the same visual weight so they animate
// smoothly even in proportional fonts.
const BRAILLE_SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const DOTS_SPINNER = ["⡿", "⣟", "⣯", "⣷", "⣾", "⣽", "⣻", "⢿"];
const PULSE_SPINNER = ["◐", "◓", "◑", "◒"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Build a sparkline string from numeric data. Values are normalized into the
// 8 block characters above. NaN / non-numeric values render as a thin space.
const sparkline = (values) => {
  if (!values || values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v) => {
      if (typeof v !== "number" || Number.isNaN(v)) return " ";
      const idx = Math.round(((v - min) / span) * (SPARK_BLOCKS.length - 1));
      return SPARK_BLOCKS[idx];
    })
    .join("");
};

// Single-line progress bar. `width` is the number of cells.
const progressBar = (pct, width = 20) => {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
};

// Segmented gauge: ◖▰▰▰▱▱▱◗
const segmentedGauge = (pct, segments = 10) => {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * segments);
  return (
    "◖" + "▰".repeat(filled) + "▱".repeat(segments - filled) + "◗"
  );
};

// Heatmap strip: each value becomes a shaded block.
const heatmap = (values) => {
  if (!values || values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v) => {
      const idx = Math.round(((v - min) / span) * (SHADE_BLOCKS.length - 1));
      return SHADE_BLOCKS[idx];
    })
    .join("");
};

// Star rating: ★★★★☆
const stars = (rating, max = 5) => {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(max - full);
};

// Journey rail. `steps` is an array of {state: "done" | "active" | "todo"}.
// Rendered as ●───●───◉───○ with em dashes between.
const journey = (steps) => {
  const dot = (s) => (s === "done" ? "●" : s === "active" ? "◉" : "○");
  return steps.map(dot).join(" ─── ");
};

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const KPI_SAMPLES = [
  {
    label: "Pipeline created",
    value: "$1.24M",
    delta: +12.4,
    series: [220, 230, 245, 260, 255, 280, 305, 290, 315, 340, 360, 380],
  },
  {
    label: "Win rate",
    value: "27.8%",
    delta: -2.1,
    series: [32, 31, 33, 30, 29, 28, 30, 29, 28, 27, 28, 27.8],
  },
  {
    label: "Avg. deal size",
    value: "$48,210",
    delta: +5.6,
    series: [42, 41, 44, 45, 43, 46, 47, 46, 48, 47, 48, 48.2],
  },
  {
    label: "Sales cycle (days)",
    value: "31.4",
    delta: -8.2,
    series: [38, 37, 36, 36, 35, 34, 34, 33, 32, 32, 31, 31.4],
  },
];

const PIPELINE_STAGES = [
  { name: "New",        count: 142, pct: 100 },
  { name: "Qualified",  count:  98, pct:  69 },
  { name: "Proposal",   count:  54, pct:  38 },
  { name: "Negotiation",count:  31, pct:  22 },
  { name: "Closed Won", count:  17, pct:  12 },
];

const REPS = [
  { name: "Avery R.",  rating: 5, deals: 14, trend: [3,4,5,6,7,8,9,9] },
  { name: "Jordan K.", rating: 4, deals: 11, trend: [5,4,4,5,6,6,7,8] },
  { name: "Sam P.",    rating: 4, deals:  9, trend: [2,3,3,4,5,5,6,7] },
  { name: "Mira B.",   rating: 3, deals:  6, trend: [4,5,4,3,4,4,5,5] },
  { name: "Lin M.",    rating: 5, deals: 13, trend: [6,7,8,8,9,9,9,9] },
];

// ---------------------------------------------------------------------------
// Reusable presentational pieces
// ---------------------------------------------------------------------------

// Inline monospace text via StyledText. Block characters (▁▂▃█░ etc.) only
// render as a continuous, gap-free chart in a real monospace font — the
// default <Text> font puts proportional side-bearings between them and the
// bars look broken. Use this for any "text-as-chart" glyph runs.
const MONO_FAMILY =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

const MonoText = ({ text, fontSize = 13, color, format }) => (
  <StyledText
    text={text === "" ? "\u00A0" : text}
    fontFamily={MONO_FAMILY}
    fontSize={fontSize}
    paddingX={fontSize}
    color={color}
    format={format}
  />
);

// A KPI card showing label, big value, delta with arrow glyph, and a sparkline.
const SparkKPI = ({ kpi }) => {
  const up = kpi.delta >= 0;
  const arrow = up ? "▲" : "▼";
  const sign = up ? "+" : "";
  return (
    <Tile>
      <Flex direction="column" gap="flush">
        <Text variant="microcopy" format={{ textTransform: "uppercase" }}>
          {kpi.label}
        </Text>
        <Text format={{ fontWeight: "bold" }}>
          {kpi.value}
          <Text inline format={{ fontWeight: "demibold" }}>
            {"   "}
            {arrow} {sign}
            {kpi.delta.toFixed(1)}%
          </Text>
        </Text>
        <MonoText text={sparkline(kpi.series)} fontSize={12} />
      </Flex>
    </Tile>
  );
};

// Status pill rendered as a glyph + label, all on one line.
const StatusGlyph = ({ glyph, label, hint }) => (
  <Text>
    <Text inline format={{ fontWeight: "bold" }}>
      {glyph}
    </Text>
    {"  "}
    <Text inline format={{ fontWeight: "demibold" }}>
      {label}
    </Text>
    {hint ? (
      <Text inline variant="microcopy">
        {"   "}
        {hint}
      </Text>
    ) : null}
  </Text>
);

// ═══════════════════════════════════════════════════════════════════════════
// Demo 1 — Text Art Gallery: a single page that shows every technique
// ═══════════════════════════════════════════════════════════════════════════

const TextArtGalleryDemo = () => (
  <Flex direction="column" gap="md">

    {/* ── KPI sparkline cards ─────────────────────────────────────────── */}
    <Tile>
      <Flex direction="column" gap="sm">
        <Text format={{ fontWeight: "demibold" }}>
          Sparkline KPI cards
        </Text>
        <Text variant="microcopy">
          A single Text node per metric. Blocks ▁▂▃▄▅▆▇█ are normalized over
          the series, giving a glanceable trend without a chart library.
        </Text>
        <Flex direction="row" gap="sm" wrap="wrap">
          {KPI_SAMPLES.map((kpi) => (
            <Flex key={kpi.label} direction="column">
              <SparkKPI kpi={kpi} />
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Tile>

    {/* ── Progress meters / gauges ────────────────────────────────────── */}
    <Tile>
      <Flex direction="column" gap="sm">
        <Text format={{ fontWeight: "demibold" }}>
          Progress meters & gauges
        </Text>
        <Text variant="microcopy">
          Each meter is one Text line: filled cells (█ / ▰) plus empty cells
          (░ / ▱). Works well for compact list rows where a real progress bar
          would be visually heavy.
        </Text>
        <Flex direction="column" gap="flush">
          {[
            { pct: 25, label: "Onboarding" },
            { pct: 48, label: "Data import" },
            { pct: 72, label: "Integration setup" },
            { pct: 96, label: "Final review" },
          ].map((row) => (
            <Flex key={row.label} direction="row" gap="sm" align="center">
              <MonoText text={progressBar(row.pct)} />
              <Text>{row.pct}%   {row.label}</Text>
            </Flex>
          ))}
        </Flex>
        <Divider />
        <Flex direction="column" gap="flush">
          {[
            { pct: 20, label: "Lead score · weak" },
            { pct: 55, label: "Lead score · warm" },
            { pct: 85, label: "Lead score · hot" },
          ].map((row) => (
            <Flex key={row.label} direction="row" gap="sm" align="center">
              <MonoText text={segmentedGauge(row.pct)} />
              <Text>{row.label}</Text>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Tile>

    {/* ── Pipeline funnel ─────────────────────────────────────────────── */}
    <Tile>
      <Flex direction="column" gap="sm">
        <Text format={{ fontWeight: "demibold" }}>
          Funnel as block bars
        </Text>
        <Text variant="microcopy">
          A funnel/conversion view where each stage's bar length encodes its
          percentage of the top of funnel.
        </Text>
        <Flex direction="column" gap="flush">
          {PIPELINE_STAGES.map((stage) => (
            <Flex key={stage.name} direction="row" gap="sm" align="center">
              <Box flex={2}>
                <Text format={{ fontWeight: "demibold" }}>{stage.name}</Text>
              </Box>
              <Box flex={5}>
                <MonoText text={progressBar(stage.pct, 28)} />
              </Box>
              <Box flex={1}>
                <Text variant="microcopy">{stage.count} deals</Text>
              </Box>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Tile>

    {/* ── Status glyphs / trend arrows / star ratings ─────────────────── */}
    <Tile>
      <Flex direction="column" gap="sm">
        <Text format={{ fontWeight: "demibold" }}>
          Status glyphs, trend arrows & ratings
        </Text>
        <Text variant="microcopy">
          Single-character semantic prefixes are tiny but unambiguous, and
          keep list rows scanable without leaning on color alone.
        </Text>
        <Flex direction="column" gap="flush">
          <StatusGlyph glyph="●" label="Active"      hint="responding within SLA" />
          <StatusGlyph glyph="◐" label="In progress" hint="awaiting customer reply" />
          <StatusGlyph glyph="○" label="Pending"     hint="not yet started" />
          <StatusGlyph glyph="▲" label="At risk"     hint="3 days past due" />
          <StatusGlyph glyph="◆" label="Hot lead"    hint="visited pricing 4×" />
          <StatusGlyph glyph="✕" label="Churned"     hint="closed 2024-11-08" />
        </Flex>
        <Divider />
        <Flex direction="column" gap="flush">
          {REPS.map((rep) => (
            <Flex key={rep.name} direction="row" gap="sm" align="center">
              <Box flex={2}>
                <Text format={{ fontWeight: "demibold" }}>{rep.name}</Text>
              </Box>
              <Box flex={2}>
                <Text>{stars(rep.rating)}</Text>
              </Box>
              <Box flex={3}>
                <MonoText text={sparkline(rep.trend)} />
              </Box>
              <Box flex={1}>
                <Text variant="microcopy">{rep.deals} deals</Text>
              </Box>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Tile>

    {/* ── Journey rail ────────────────────────────────────────────────── */}
    <Tile>
      <Flex direction="column" gap="sm">
        <Text format={{ fontWeight: "demibold" }}>
          Activity journey
        </Text>
        <Text variant="microcopy">
          Done ●  ·  Current ◉  ·  Upcoming ○. The em-dash spacers form a
          horizontal rail without any drawing primitives.
        </Text>
        <Flex direction="column" gap="flush">
          <Text>
            {journey([
              { state: "done" }, { state: "done" }, { state: "done" },
              { state: "active" }, { state: "todo" }, { state: "todo" },
            ])}
          </Text>
          <Text variant="microcopy">
            Lead   Qualify   Demo   <Text inline format={{ fontWeight: "demibold" }}>Propose</Text>   Negotiate   Close
          </Text>
        </Flex>
      </Flex>
    </Tile>

    {/* ── Heatmap strip ───────────────────────────────────────────────── */}
    <Tile>
      <Flex direction="column" gap="sm">
        <Text format={{ fontWeight: "demibold" }}>
          Heatmap strips
        </Text>
        <Text variant="microcopy">
          Shaded blocks ░▒▓█ encode density. Useful for "engagement over time"
          rows in a contact list — one cell per day or per hour.
        </Text>
        <Flex direction="column" gap="flush">
          {[
            { day: "Mon", values: [0,0,1,1,2,3,4,4,3,2,1,0,0,0,0,0,1,2,3,2,1,0,0,0] },
            { day: "Tue", values: [0,0,0,1,2,2,3,4,4,4,3,2,1,1,2,3,4,4,3,2,1,0,0,0] },
            { day: "Wed", values: [0,0,1,2,3,4,4,4,3,3,2,2,2,3,3,4,4,3,2,1,0,0,0,0] },
            { day: "Thu", values: [0,0,0,0,1,2,3,3,2,2,3,4,4,3,2,2,3,3,2,1,1,0,0,0] },
            { day: "Fri", values: [0,1,2,3,4,4,3,2,1,1,1,2,3,4,4,4,3,2,1,0,0,0,0,0] },
          ].map((row) => (
            <Flex key={row.day} direction="row" gap="sm" align="center">
              <Box flex={1}>
                <Text format={{ fontWeight: "demibold" }}>{row.day}</Text>
              </Box>
              <Box flex={6}>
                <MonoText text={heatmap(row.values)} />
              </Box>
            </Flex>
          ))}
          <Flex direction="row" gap="sm" align="center">
            <Box flex={1} />
            <Box flex={6}>
              <MonoText text="00      06      12      18      23" fontSize={11} />
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Tile>

    {/* ── Decorative section dividers ─────────────────────────────────── */}
    <Tile>
      <Flex direction="column" gap="sm">
        <Text format={{ fontWeight: "demibold" }}>
          Decorative dividers
        </Text>
        <Text variant="microcopy">
          A single Text line can stand in for a labeled divider. Heavy box-
          drawing horizontals (━) read as a strong rule even in proportional
          fonts.
        </Text>
        <Flex direction="column" gap="flush">
          <Text>━━━━━━━━━━  TODAY  ━━━━━━━━━━</Text>
          <Text>──────  YESTERDAY  ──────</Text>
          <Text>· · · · · ·  EARLIER  · · · · · ·</Text>
          <Text>◆ ─────────  Q4 PLANNING  ───────── ◆</Text>
        </Flex>
      </Flex>
    </Tile>

  </Flex>
);

// ═══════════════════════════════════════════════════════════════════════════
// Demo 2 — Animated braille spinners + ticker tape
// ═══════════════════════════════════════════════════════════════════════════

const TICKER_ITEMS = [
  "▲ ACME +2.4%",
  "▼ GLBX −0.8%",
  "▲ INIT +5.1%",
  "● HOT lead from Globex",
  "◆ 3 deals in negotiation",
  "▲ HUBS +1.2%",
  "○ 12 tasks queued",
];

const AnimatedTickerDemo = () => {
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(120);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), speed);
    return () => clearInterval(id);
  }, [running, speed]);

  const braille  = BRAILLE_SPINNER[tick % BRAILLE_SPINNER.length];
  const dots     = DOTS_SPINNER[tick % DOTS_SPINNER.length];
  const pulse    = PULSE_SPINNER[tick % PULSE_SPINNER.length];

  // Marquee: rotate the joined ticker string by 1 char per tick.
  const tape = useMemo(
    () => "   " + TICKER_ITEMS.join("   ·   ") + "   ",
    []
  );
  const offset = tick % tape.length;
  const view = (tape + tape).slice(offset, offset + 64);

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="row" gap="sm" align="center" justify="between">
          <Text format={{ fontWeight: "demibold" }}>
            Spinner & ticker controls
          </Text>
          <Flex direction="row" gap="xs">
            <Button
              variant="secondary"
              onClick={() => setRunning((r) => !r)}
            >
              {running ? "Pause" : "Resume"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSpeed((s) => Math.min(500, s + 40))}
            >
              Slower
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSpeed((s) => Math.max(40, s - 40))}
            >
              Faster
            </Button>
          </Flex>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Braille spinners</Text>
          <Text variant="microcopy">
            A useEffect interval steps through unicode frames. Braille frames
            (⠋⠙⠹…) and segmented dots (⡿⣟⣯…) keep a consistent visual weight
            so the animation reads smoothly.
          </Text>
          <Flex direction="column" gap="flush">
            <Text>
              <Text inline format={{ fontWeight: "bold" }}>{braille}</Text>
              {"   Syncing CRM properties…"}
            </Text>
            <Text>
              <Text inline format={{ fontWeight: "bold" }}>{dots}</Text>
              {"   Importing 1,284 contacts"}
            </Text>
            <Text>
              <Text inline format={{ fontWeight: "bold" }}>{pulse}</Text>
              {"   Awaiting webhook"}
            </Text>
          </Flex>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Marquee ticker</Text>
          <Text variant="microcopy">
            A long string is sliced on each tick to produce a scrolling tape.
            The arrow / dot prefixes survive the wraparound because the slice
            is taken from a doubled buffer.
          </Text>
          <Tile>
            <Text>{view}</Text>
          </Tile>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="flush">
          <Text format={{ fontWeight: "demibold" }}>Animation state</Text>
          <Text variant="microcopy">
            tick={tick}  ·  speed={speed}ms  ·  running={String(running)}
          </Text>
        </Flex>
      </Tile>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo 3 — Interactive gauges & sparkline regenerator
// ═══════════════════════════════════════════════════════════════════════════

const randomSeries = (n = 16, min = 10, max = 100) =>
  Array.from({ length: n }, () =>
    Math.round(min + Math.random() * (max - min))
  );

const InteractiveGaugesDemo = () => {
  const [score, setScore] = useState(58);
  const [width, setWidth] = useState(24);
  const [series, setSeries] = useState(() => randomSeries());
  const [style, setStyle] = useState("blocks");

  const renderBar = () => {
    if (style === "blocks") return progressBar(score, width);
    if (style === "segments") {
      return segmentedGauge(score, Math.max(4, Math.round(width / 2)));
    }
    const filled = Math.round((score / 100) * width);
    return "▕" + "▮".repeat(filled) + "▯".repeat(width - filled) + "▏";
  };

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Gauge style</Text>
          <ToggleGroup
            name="text-art-gauge-style"
            toggleType="radioButtonList"
            options={[
              { label: "Blocks  █░",     value: "blocks" },
              { label: "Segments ▰▱",    value: "segments" },
              { label: "Bars  ▮▯",       value: "bars" },
            ]}
            value={style}
            onChange={setStyle}
          />
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Flex direction="row" gap="sm" align="center" justify="between">
            <Text format={{ fontWeight: "demibold" }}>Score: {score}%</Text>
            <Flex direction="row" gap="xs">
              <Button
                variant="secondary"
                onClick={() => setScore((s) => Math.max(0, s - 5))}
              >
                −5
              </Button>
              <Button
                variant="secondary"
                onClick={() => setScore((s) => Math.min(100, s + 5))}
              >
                +5
              </Button>
              <Button
                variant="secondary"
                onClick={() => setWidth((w) => Math.max(8, w - 4))}
              >
                Width −
              </Button>
              <Button
                variant="secondary"
                onClick={() => setWidth((w) => Math.min(48, w + 4))}
              >
                Width +
              </Button>
            </Flex>
          </Flex>
          <Tile>
            <Flex direction="row" gap="sm" align="center">
              <MonoText text={renderBar()} fontSize={14} />
              <Text format={{ fontWeight: "demibold" }}>{score}%</Text>
            </Flex>
          </Tile>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Flex direction="row" gap="sm" align="center" justify="between">
            <Text format={{ fontWeight: "demibold" }}>Sparkline</Text>
            <Flex direction="row" gap="xs">
              <Button
                variant="secondary"
                onClick={() => setSeries(randomSeries(16))}
              >
                Regenerate
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSeries(randomSeries(32))}
              >
                Long series
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSeries(randomSeries(8))}
              >
                Short series
              </Button>
            </Flex>
          </Flex>
          <MonoText text={sparkline(series)} fontSize={14} />
          <Text variant="microcopy">
            min={Math.min(...series)}  ·  max={Math.max(...series)}  ·  n={series.length}
          </Text>
        </Flex>
      </Tile>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo — Monospace via StyledText (true ASCII art, multi-line aligned)
//
// StyledText bakes text into an SVG <Image> and exposes a fontFamily prop.
// Pick a monospace stack and every character lands on the same advance grid;
// stack one StyledText per line in a Flex column with gap="flush" and the
// columns align across rows. This is the only path to real box-drawing UI
// inside HubSpot UI extensions today.
// ═══════════════════════════════════════════════════════════════════════════

// MONO_FAMILY is defined near the top of the file (used by MonoText too).

// StyledText renders each line as an SVG with text-anchor="middle" and a
// content-fit canvas. Two consequences bite us for ASCII art:
//
//   1. SVG <text> collapses leading/trailing whitespace, so spaces at the
//      start/end of a line get silently stripped before the canvas width is
//      measured. We replace every space with U+00A0 (NBSP) so the renderer
//      can't trim it.
//   2. Each line's SVG is sized to its own content, then the inner text is
//      centered within that SVG. Shorter lines therefore appear horizontally
//      centered relative to longer ones — the columns drift. We right-pad
//      every line to the longest line's length so every SVG ends up the
//      same width and the per-SVG centering becomes a no-op visually.
const NBSP = "\u00A0";

// StyledText sizes its SVG canvas via estimateTextWidth() — a heuristic that
// undercounts width for NBSP and box-drawing glyphs, so the rightmost
// character can get clipped. Two safeguards:
//   • right-pad every line with a couple of extra NBSPs as a buffer
//   • bump paddingX up to a full character so the canvas has slack on both
//     sides regardless of the estimator's accuracy.
//
// Optional `onLineClick(index)`: wraps each line in a <Link onClick=…>. The
// Image itself isn't interactive (StyledText forwards only src/width/height/
// alt to <Image>), so we get clickability by wrapping the rendered row.
const MonoBlock = ({
  lines,
  fontSize = 13,
  color,
  onLineClick,
  selectedIndex,
  selectedColor = "#0091ae",
  isLineClickable,
}) => {
  const maxLen = lines.reduce((m, l) => Math.max(m, l.length), 1);
  const padded = lines.map(
    (line) => line.padEnd(maxLen, " ").replace(/ /g, NBSP) + NBSP + NBSP,
  );
  return (
    <Flex direction="column" gap="flush" align="start">
      {padded.map((line, i) => {
        const clickable =
          typeof onLineClick === "function" &&
          (isLineClickable ? isLineClickable(i) : true);
        const lineColor = i === selectedIndex ? selectedColor : color;
        const node = (
          <StyledText
            text={line}
            fontFamily={MONO_FAMILY}
            fontSize={fontSize}
            paddingX={fontSize}
            color={lineColor}
          />
        );
        if (!clickable) {
          return <Flex key={i}>{node}</Flex>;
        }
        return (
          <Link key={i} onClick={() => onLineClick(i)}>
            {node}
          </Link>
        );
      })}
    </Flex>
  );
};

// ---------------------------------------------------------------------------
// Sample multi-line designs that need true monospace to work
// ---------------------------------------------------------------------------

const BOX_CARD = [
  "┌──────────────────────────────────────────┐",
  "│  GLOBEX CORP                       ●     │",
  "│  Enterprise · 1,240 employees            │",
  "├──────────────────────────────────────────┤",
  "│  Pipeline    $1.24M     ▲ +12.4%         │",
  "│  Open deals  7          ◆ 2 hot          │",
  "│  Last touch  3 days ago                  │",
  "├──────────────────────────────────────────┤",
  "│  Engagement  ▁▂▃▅▆▇█▇▆▄▃▂▁▂▃▅▆▇█▇▆▄▃     │",
  "└──────────────────────────────────────────┘",
];

const TREE_VIEW = [
  "Globex Corp/",
  "├── Deals/",
  "│   ├── Q4 renewal              $480k   ◉ Negotiation",
  "│   ├── Platform expansion      $260k   ◐ Proposal",
  "│   └── Premium support add-on  $ 90k   ○ Qualify",
  "├── Contacts/",
  "│   ├── Avery Reyes      avery@globex.com    ●",
  "│   ├── Jordan Kim       jordan@globex.com   ●",
  "│   └── Sam Patel        sam@globex.com      ○",
  "└── Tickets/",
  "    ├── #4218  SSO config       ▲ urgent",
  "    └── #4221  Data export bug  ◆ in review",
];

const HEATMAP_GRID = [
  "          00   03   06   09   12   15   18   21",
  "  Mon     ░    ░    ▒    ▓    █    ▓    ▒    ░  ",
  "  Tue     ░    ░    ▒    █    █    ▓    ▒    ░  ",
  "  Wed     ░    ▒    ▓    █    █    █    ▓    ▒  ",
  "  Thu     ░    ░    ▒    ▓    █    ▓    ▓    ▒  ",
  "  Fri     ░    ▒    ▓    █    █    █    ▒    ░  ",
  "  Sat     ░    ░    ░    ▒    ▒    ░    ░    ░  ",
  "  Sun     ░    ░    ░    ░    ▒    ░    ░    ░  ",
];

const BAR_CHART = [
  "  Pipeline by stage",
  "",
  "  New           ████████████████████████████  142",
  "  Qualified     ███████████████████▌           98",
  "  Proposal      ██████████▊                    54",
  "  Negotiation   ██████▏                        31",
  "  Closed Won    ███▍                           17",
  "                └────┴────┴────┴────┴────┴────┘",
  "                0    30   60   90  120  150",
];

const TABLE = [
  "┌─────────────┬────────┬─────────┬──────────┐",
  "│ Rep         │ Deals  │ Trend   │ Quota    │",
  "├─────────────┼────────┼─────────┼──────────┤",
  "│ Avery R.    │   14   │ ▁▃▅▆▇█  │ ███████░ │",
  "│ Jordan K.   │   11   │ ▂▃▄▄▅▆  │ █████▒░░ │",
  "│ Sam P.      │    9   │ ▁▂▃▃▄▅  │ █████░░░ │",
  "│ Mira B.     │    6   │ ▂▃▂▂▃▃  │ ███▒░░░░ │",
  "│ Lin M.      │   13   │ ▄▅▆▆▇█  │ ███████░ │",
  "└─────────────┴────────┴─────────┴──────────┘",
];

// ---------------------------------------------------------------------------
// Sample data for the clickable tree demo
// ---------------------------------------------------------------------------

const INTERACTIVE_DEALS = [
  { name: "Q4 renewal",             amount: "$480k", stage: "Negotiation", glyph: "◉" },
  { name: "Platform expansion",     amount: "$260k", stage: "Proposal",    glyph: "◐" },
  { name: "Premium support add-on", amount: "$ 90k", stage: "Qualify",     glyph: "○" },
  { name: "EU data residency",      amount: "$140k", stage: "Discovery",   glyph: "○" },
  { name: "SSO migration",          amount: "$ 65k", stage: "Closed Won",  glyph: "●" },
];

// Build the tree's lines plus a parallel array describing which line index
// corresponds to which deal. The header lines (root + "Deals/") are not
// clickable; only the leaf rows are.
const buildDealTree = () => {
  const lines = ["Globex Corp/", "└── Deals/"];
  const dealIndexByLine = [null, null];
  INTERACTIVE_DEALS.forEach((deal, i) => {
    const isLast = i === INTERACTIVE_DEALS.length - 1;
    const branch = isLast ? "└──" : "├──";
    const namePad = deal.name.padEnd(26, " ");
    const stagePad = deal.stage.padEnd(12, " ");
    lines.push(`    ${branch} ${namePad}${deal.amount}   ${deal.glyph} ${stagePad}`);
    dealIndexByLine.push(i);
  });
  return { lines, dealIndexByLine };
};

const MonospaceArtDemo = () => {
  const [fontSize, setFontSize] = useState(13);
  const [selectedDeal, setSelectedDeal] = useState(0);

  const { lines: dealTreeLines, dealIndexByLine } = useMemo(buildDealTree, []);
  const selectedLineIndex = dealIndexByLine.findIndex((d) => d === selectedDeal);

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="row" gap="sm" align="center" justify="between">
          <Flex direction="column" gap="flush">
            <Text format={{ fontWeight: "demibold" }}>
              Real monospace through StyledText
            </Text>
            <Text variant="microcopy">
              Each line is its own &lt;StyledText fontFamily="…monospace"&gt;
              stacked in a Flex column. Rendered as SVG images, so columns
              align perfectly — but the text is not selectable.
            </Text>
          </Flex>
          <Flex direction="row" gap="xs">
            <Button
              variant="secondary"
              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
            >
              A−
            </Button>
            <Button
              variant="secondary"
              onClick={() => setFontSize((s) => Math.min(20, s + 1))}
            >
              A+
            </Button>
          </Flex>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Box-drawing card</Text>
          <Text variant="microcopy">
            Borders use ┌ ─ ┐ │ ├ ┤ └ ┘. Inline glyphs (● ▲ ◆) and a sparkline
            sit inside the box without breaking the frame.
          </Text>
          <MonoBlock lines={BOX_CARD} fontSize={fontSize} />
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Tree view</Text>
          <Text variant="microcopy">
            Classic ├── └── │ tree. Right-side columns (amount, status)
            stay aligned because every character has the same advance width.
          </Text>
          <MonoBlock lines={TREE_VIEW} fontSize={fontSize} />
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Aligned heatmap grid</Text>
          <Text variant="microcopy">
            Day rows × hour columns. Compare to the proportional-font heatmap
            in the gallery demo — those columns drift, these don't.
          </Text>
          <MonoBlock lines={HEATMAP_GRID} fontSize={fontSize} />
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Horizontal bar chart with axis</Text>
          <Text variant="microcopy">
            Eighth-block fractions (▏▎▍▌▋▊▉█) give sub-character precision so
            bar lengths read accurately, and the └─┴─┘ tick rule lines up with
            the labels below.
          </Text>
          <MonoBlock lines={BAR_CHART} fontSize={fontSize} />
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Bordered table</Text>
          <Text variant="microcopy">
            ┬ ┼ ┤ joins between heavy rules. Combining a real DataTable with a
            decorative summary block like this is a nice way to add character
            without giving up sortable, selectable rows above it.
          </Text>
          <MonoBlock lines={TABLE} fontSize={fontSize} />
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Clickable monospace rows</Text>
          <Text variant="microcopy">
            StyledText doesn't forward onClick to its underlying Image, but
            we can wrap each rendered line in a &lt;Link onClick=…&gt; so
            individual rows of an ASCII tree become real click targets. Click
            a deal below to select it; the selected row re-renders in a
            different color via StyledText's color prop.
          </Text>
          <MonoBlock
            lines={dealTreeLines}
            fontSize={fontSize}
            onLineClick={(lineIdx) => {
              const dealIdx = dealIndexByLine[lineIdx];
              if (dealIdx != null) setSelectedDeal(dealIdx);
            }}
            isLineClickable={(lineIdx) => dealIndexByLine[lineIdx] != null}
            selectedIndex={selectedLineIndex}
          />
          <Divider />
          <Flex direction="row" gap="sm" align="center" wrap="wrap">
            <Text format={{ fontWeight: "demibold" }}>
              Selected: {INTERACTIVE_DEALS[selectedDeal].name}
            </Text>
            <Text variant="microcopy">
              {INTERACTIVE_DEALS[selectedDeal].amount}  ·  {INTERACTIVE_DEALS[selectedDeal].stage}
            </Text>
          </Flex>
          <Flex direction="row" gap="xs" wrap="wrap">
            {INTERACTIVE_DEALS.map((deal, i) => (
              <Button
                key={deal.name}
                variant={i === selectedDeal ? "primary" : "secondary"}
                onClick={() => setSelectedDeal(i)}
              >
                {deal.name}
              </Button>
            ))}
          </Flex>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="flush">
          <Text format={{ fontWeight: "demibold" }}>⚠ Caveats</Text>
          <Text variant="microcopy">
            • StyledText is rendered as an SVG image — text is not selectable
            or searchable in the DOM.
          </Text>
          <Text variant="microcopy">
            • Each line is one network-free SVG data URI; long blocks stay
            cheap, but accessibility tooling sees them as images, so always
            provide an alt or pair with a real &lt;Text&gt; summary nearby.
          </Text>
          <Text variant="microcopy">
            • Pick a generic monospace stack (ui-monospace, Menlo, Consolas,
            monospace) so the SVG renders consistently across OSes.
          </Text>
          <Text variant="microcopy">
            • StyledText doesn't accept onClick directly, but wrapping each
            line in &lt;Link onClick=…&gt; (see the deal-tree example above)
            gives per-row click targets without any custom drawing surface.
          </Text>
        </Flex>
      </Tile>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo 4 — Clickable activity journey
// ═══════════════════════════════════════════════════════════════════════════

const JOURNEY_STEPS = [
  "Lead",
  "Qualify",
  "Demo",
  "Propose",
  "Negotiate",
  "Close",
];

const ClickableJourneyDemo = () => {
  const [active, setActive] = useState(2);

  const states = JOURNEY_STEPS.map((_, i) => {
    if (i < active) return "done";
    if (i === active) return "active";
    return "todo";
  });

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>Stage rail</Text>
          <Text>
            {journey(states.map((state) => ({ state })))}
          </Text>
          <Flex direction="row" gap="sm" wrap="wrap">
            {JOURNEY_STEPS.map((label, i) => (
              <Button
                key={label}
                variant={i === active ? "primary" : "secondary"}
                onClick={() => setActive(i)}
              >
                {`${i < active ? "●" : i === active ? "◉" : "○"}  ${label}`}
              </Button>
            ))}
          </Flex>
          <Divider />
          <Text variant="microcopy">
            Click any stage to advance the rail. Done ●  ·  Current ◉  ·  Upcoming ○.
          </Text>
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: "demibold" }}>
            Compact stage list (sparkline + journey)
          </Text>
          {REPS.map((rep, i) => {
            const repActive = (active + i) % JOURNEY_STEPS.length;
            const repStates = JOURNEY_STEPS.map((_, idx) => {
              if (idx < repActive) return "done";
              if (idx === repActive) return "active";
              return "todo";
            });
            return (
              <Text key={rep.name}>
                <Text inline format={{ fontWeight: "demibold" }}>
                  {rep.name.padEnd(11, " ")}
                </Text>
                <Text inline variant="microcopy">{sparkline(rep.trend)}</Text>
                {"   "}
                <Text inline>
                  {journey(repStates.map((state) => ({ state })))}
                </Text>
              </Text>
            );
          })}
        </Flex>
      </Tile>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo — Pixel Doom (WASM framebuffer rendered as one SVG)
//
// The renderer reads a Doom-style indexed-color framebuffer and emits one
// crisp pixel-art SVG image. The older ASCII row renderer is still present as
// a compatibility/fallback path, but the primary viewport now uses real
// palette colors instead of brightness glyphs for a higher-quality frame.
// ═══════════════════════════════════════════════════════════════════════════

// The WASM port is intentionally discovered at runtime so this demo can run
// in the extension sandbox without bundling a specific Doom implementation.
// Supported shapes include doom-wasm / chocolate-doom-wasm style globals with
// framebuffer pointers, typed-array framebuffers, palettes, and key APIs.
const DOOM_VIEW_W = 60;
const DOOM_VIEW_H = 18;
const DOOM_SOURCE_W = 320;
const DOOM_SOURCE_H = 200;
const DOOM_FONT_SIZE = 11;
const DOOM_LINE_HEIGHT = 11;
const DOOM_SVG_PADDING_X = 11;
const DOOM_SVG_PADDING_Y = 2;
const DOOM_CHAR_WIDTH = 6.65;
const DOOM_PIXEL_VIEW_W = 160;
const DOOM_PIXEL_VIEW_H = 100;
const DOOM_PIXEL_SIZE = 3;

// Brightness ramp from "bright pixel" to "dark pixel". The trailing space is
// important: black pixels should disappear rather than becoming noise.
const DOOM_SHADES = ["█", "▓", "▒", "░", "·", " "];

const DOOM_FALLBACK_PALETTE = Array.from({ length: 256 }, (_, i) => [i, i, i]);

const createDemoDoomFramebufferRuntime = () => {
  const width = DOOM_SOURCE_W;
  const height = DOOM_SOURCE_H;
  const framebuffer = new Uint8Array(width * height);
  const zBuffer = new Float32Array(width);
  const palette = DOOM_FALLBACK_PALETTE.map((color) => color.slice());

  // Doom-ish indexed palette slots used by the fallback framebuffer. A real
  // WASM port will provide its own PLAYPAL / framebuffer instead.
  palette[4] = [2, 3, 4];
  palette[8] = [8, 10, 12];
  palette[18] = [28, 46, 58];
  palette[28] = [70, 104, 126];
  palette[34] = [30, 22, 20];
  palette[42] = [48, 34, 28];
  palette[50] = [62, 42, 32];
  palette[58] = [82, 58, 42];
  palette[66] = [92, 62, 40];
  palette[76] = [112, 74, 48];
  palette[84] = [128, 84, 52];
  palette[92] = [70, 70, 72];
  palette[104] = [80, 78, 76];
  palette[118] = [96, 92, 86];
  palette[132] = [110, 104, 94];
  palette[146] = [126, 116, 98];
  palette[158] = [140, 124, 98];
  palette[172] = [158, 136, 104];
  palette[188] = [88, 120, 54];
  palette[204] = [196, 44, 28];
  palette[218] = [132, 22, 16];
  palette[238] = [255, 146, 36];
  palette[252] = [255, 224, 104];

  const map = [
    "################",
    "#..............#",
    "#..##..........#",
    "#..#...........#",
    "#..#.....####..#",
    "#........#.....#",
    "#........#.....#",
    "#....#####.....#",
    "#..............#",
    "#.....###......#",
    "#.....#........#",
    "#.....#....##..#",
    "#..........##..#",
    "#..............#",
    "#..............#",
    "################",
  ];
  const mapW = map[0].length;
  const mapH = map.length;
  const keys = new Set();
  const enemies = [
    { x: 8.5, y: 8.5, alive: true, phase: 0.0 },
    { x: 12.5, y: 3.5, alive: true, phase: 1.7 },
    { x: 10.5, y: 12.5, alive: true, phase: 3.2 },
  ];
  const state = {
    mode: "title",
    titleTick: 0,
    x: 3.5,
    y: 8.5,
    angle: 0,
    flash: 0,
    bob: 0,
    hurtFlash: 0,
    attackCooldown: 0,
    hp: 100,
    armor: 60,
  };

  const isWall = (x, y) => {
    if (x < 0 || x >= mapW || y < 0 || y >= mapH) return true;
    return map[Math.floor(y)][Math.floor(x)] === "#";
  };

  const put = (x, y, color) => {
    if (x >= 0 && x < width && y >= 0 && y < height) framebuffer[y * width + x] = color;
  };

  const fillRect = (x0, y0, w, h, color) => {
    for (let y = Math.max(0, y0); y < Math.min(height, y0 + h); y++) {
      for (let x = Math.max(0, x0); x < Math.min(width, x0 + w); x++) put(x, y, color);
    }
  };

  const glyphs = {
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
    Y: ["10001", "01010", "00100", "00100", "00100", "00100", "00100"],
    F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  };

  const drawWord = (text, x, y, scale, color, shadow = 8) => {
    let cursor = x;
    [...text].forEach((ch) => {
      if (ch === " ") {
        cursor += scale * 4;
        return;
      }
      const glyph = glyphs[ch];
      if (!glyph) return;
      glyph.forEach((row, gy) => {
        [...row].forEach((bit, gx) => {
          if (bit !== "1") return;
          if (shadow) fillRect(cursor + gx * scale + scale / 2, y + gy * scale + scale / 2, scale, scale, shadow);
          fillRect(cursor + gx * scale, y + gy * scale, scale, scale, color);
        });
      });
      cursor += scale * 6;
    });
  };

  const drawTitle = () => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const vignette = Math.abs(x - width / 2) / width + Math.abs(y - height / 2) / height;
        framebuffer[y * width + x] = vignette > 0.55 ? 4 : y < height * 0.52 ? 18 : 42;
      }
    }
    // Infernal skyline / floor.
    for (let x = 0; x < width; x += 12) {
      const h = 18 + ((x * 17 + state.titleTick) % 34);
      fillRect(x, Math.floor(height * 0.53) - h, 10, h, x % 3 ? 8 : 18);
    }
    for (let y = Math.floor(height * 0.58); y < height; y += 8) {
      for (let x = 0; x < width; x++) put(x, y, 76);
    }

    drawWord("DOOM", 40, 34, 12, 204, 8);
    drawWord("PIXEL", 80, 126, 4, 252, 8);
    if (Math.floor(state.titleTick / 8) % 2 === 0) drawWord("PRESS FIRE", 88, 160, 3, 252, 8);
    drawWord("WASD ARROWS", 78, 184, 2, 146, 4);
  };

  const castRay = (angle) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let dist = 0.05;
    let hitX = state.x;
    let hitY = state.y;
    while (dist < 18) {
      hitX = state.x + dx * dist;
      hitY = state.y + dy * dist;
      if (isWall(hitX, hitY)) break;
      dist += 0.025;
    }
    const fracX = hitX - Math.floor(hitX);
    const fracY = hitY - Math.floor(hitY);
    const seam = Math.min(fracX, 1 - fracX, fracY, 1 - fracY) < 0.045;
    return { dist, hitX, hitY, seam };
  };

  const drawBackground = () => {
    const horizon = Math.floor(height * 0.47);
    const cosA = Math.cos(state.angle);
    const sinA = Math.sin(state.angle);
    const sideCos = Math.cos(state.angle + Math.PI / 2);
    const sideSin = Math.sin(state.angle + Math.PI / 2);

    for (let y = 0; y < height; y++) {
      const row = y * width;
      if (y < horizon) {
        const t = y / Math.max(1, horizon);
        for (let x = 0; x < width; x++) {
          const cloud = Math.sin(x * 0.035 + state.angle * 2.5) + Math.sin((x + y) * 0.018);
          framebuffer[row + x] = cloud > 1.15 ? 28 : t < 0.34 ? 18 : t < 0.72 ? 28 : 34;
        }
      } else {
        const depth = (y - horizon) / Math.max(1, height - horizon);
        const perspective = 1 / Math.max(0.045, depth);
        for (let x = 0; x < width; x++) {
          const lateral = ((x - width / 2) / width) * perspective * 1.85;
          const worldX = state.x + cosA * perspective + sideCos * lateral;
          const worldY = state.y + sinA * perspective + sideSin * lateral;
          const tileX = Math.floor(worldX * 2);
          const tileY = Math.floor(worldY * 2);
          const checker = (tileX + tileY) % 2;
          const grout = Math.abs(worldX * 2 - Math.round(worldX * 2)) < 0.045 || Math.abs(worldY * 2 - Math.round(worldY * 2)) < 0.045;
          const speckle = (Math.floor(worldX * 17) * 13 + Math.floor(worldY * 19) * 7) % 11;
          let color = checker ? 58 : 42;
          if (depth > 0.66) color = checker ? 76 : 50;
          if (grout) color = 34;
          else if (speckle === 0) color = checker ? 66 : 50;
          framebuffer[row + x] = color;
        }
      }
    }
  };

  const drawWalls = () => {
    const fov = Math.PI / 3;
    const horizon = Math.floor(height * 0.49 + Math.sin(state.bob) * 3);
    for (let x = 0; x < width; x++) {
      const rayAngle = state.angle - fov / 2 + (x / width) * fov;
      const ray = castRay(rayAngle);
      const corrected = ray.dist * Math.cos(rayAngle - state.angle);
      zBuffer[x] = corrected;
      const wallH = Math.min(height * 1.6, Math.floor((height * 0.92) / Math.max(0.12, corrected)));
      const top = Math.max(0, Math.floor(horizon - wallH / 2));
      const bottom = Math.min(height - 1, Math.floor(horizon + wallH / 2));
      const shade = corrected < 2.3 ? 172 : corrected < 4.5 ? 146 : corrected < 7 ? 118 : 92;
      const wallU = Math.abs(ray.hitX - Math.round(ray.hitX)) < Math.abs(ray.hitY - Math.round(ray.hitY)) ? ray.hitY : ray.hitX;

      for (let y = top; y <= bottom; y++) {
        const v = (y - top) / Math.max(1, wallH);
        const brickY = Math.floor(v * 14);
        const brickOffset = brickY % 2 ? 0.5 : 0;
        const brickX = Math.floor((wallU * 5 + brickOffset) % 1 * 8);
        const mortar = ray.seam || Math.abs(v * 14 - Math.round(v * 14)) < 0.055 || brickX === 0;
        const panel = Math.floor(wallU * 3) % 5 === 0 && brickX > 2 && brickX < 5;
        const grime = (Math.floor(wallU * 41) + Math.floor(v * 37)) % 13 === 0;
        const torch = Math.floor(wallU * 2) % 9 === 0 && v > 0.18 && v < 0.38;
        const highlight = y === top || y === bottom;
        let color = shade;
        if (torch) color = v < 0.28 ? 238 : 204;
        else if (highlight) color = 252;
        else if (mortar) color = corrected < 4 ? 84 : 76;
        else if (panel) color = corrected < 4 ? 132 : 104;
        else if (grime) color = corrected < 4 ? 76 : 58;
        put(x, y, color);
      }
    }
  };

  const drawEnemySprite = (enemy, forward, side) => {
    const fov = Math.PI / 3;
    const projection = width / (2 * Math.tan(fov / 2));
    const screenX = Math.floor(width / 2 + (side / forward) * projection);
    const spriteH = Math.min(height * 1.2, Math.floor((height * 0.82) / forward));
    const spriteW = Math.floor(spriteH * 0.58);
    const top = Math.floor(height * 0.52 - spriteH * 0.58 + Math.sin(state.bob + enemy.phase) * 2);
    const left = screenX - Math.floor(spriteW / 2);

    for (let sy = 0; sy < spriteH; sy++) {
      const ny = sy / spriteH;
      const y = top + sy;
      if (y < 0 || y >= height) continue;
      for (let sx = 0; sx < spriteW; sx++) {
        const x = left + sx;
        if (x < 0 || x >= width || forward >= zBuffer[x]) continue;
        const nx = (sx / spriteW - 0.5) * 2;
        let color = 0;

        const head = (nx * nx) / 0.28 + ((ny - 0.18) * (ny - 0.18)) / 0.035 < 1;
        const torso = Math.abs(nx) < 0.48 * (1 - Math.max(0, ny - 0.35) * 0.7) && ny > 0.25 && ny < 0.74;
        const legs = ny >= 0.68 && ny < 0.98 && (Math.abs(nx - 0.18) < 0.16 || Math.abs(nx + 0.18) < 0.16);
        const arms = ny > 0.36 && ny < 0.62 && (Math.abs(nx - 0.58) < 0.12 || Math.abs(nx + 0.58) < 0.12);
        const eyes = head && ny > 0.16 && ny < 0.22 && (Math.abs(nx - 0.16) < 0.06 || Math.abs(nx + 0.16) < 0.06);

        if (eyes) color = 252;
        else if (head) color = 188;
        else if (torso) color = 218;
        else if (arms || legs) color = 76;
        if (!color) continue;

        // Cheap sprite shading by distance and a black outline near the edge.
        const edge = Math.abs(nx) > 0.52 || ny < 0.04 || ny > 0.94;
        if (edge) color = 8;
        else if (forward > 5 && color !== 252) color = color === 218 ? 204 : 92;
        put(x, y, color);
      }
    }
  };

  const drawEnemies = () => {
    const cosA = Math.cos(state.angle);
    const sinA = Math.sin(state.angle);
    enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => {
        const dx = enemy.x - state.x;
        const dy = enemy.y - state.y;
        return {
          enemy,
          forward: dx * cosA + dy * sinA,
          side: -dx * sinA + dy * cosA,
          dist2: dx * dx + dy * dy,
        };
      })
      .filter((item) => item.forward > 0.25 && Math.abs(item.side / item.forward) < 1.2)
      .sort((a, b) => b.dist2 - a.dist2)
      .forEach((item) => drawEnemySprite(item.enemy, item.forward, item.side));
  };

  const drawDamageOverlay = () => {
    if (state.hurtFlash > 0) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const edge = Math.max(
            Math.abs(x - width / 2) / (width / 2),
            Math.abs(y - height / 2) / (height / 2),
          );
          if (edge > 0.62 || (x + y + state.hurtFlash) % 13 === 0) put(x, y, 204);
        }
      }
      state.hurtFlash--;
    }

    if (state.mode === "dead") {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if ((x + y) % 3 === 0) put(x, y, 8);
          if (y > height * 0.62 && (x + y) % 2 === 0) put(x, y, 204);
        }
      }
      drawWord("DIED", 86, 72, 9, 204, 8);
      drawWord("PRESS FIRE", 88, 152, 3, 252, 8);
    }
  };

  const drawWeapon = () => {
    const bob = Math.sin(state.bob) * 3;
    const cx = Math.floor(width / 2);
    const baseY = Math.floor(height * 0.78 + bob);

    for (let y = baseY; y < height; y++) {
      const t = (y - baseY) / Math.max(1, height - baseY);
      const half = Math.floor(18 + t * 42);
      for (let x = cx - half; x <= cx + half; x++) {
        const edge = Math.abs(x - cx) > half - 5;
        put(x, y, edge ? 42 : 92);
      }
    }
    for (let y = baseY - 30; y < baseY + 20; y++) {
      const half = y < baseY - 8 ? 7 : 12;
      for (let x = cx - half; x <= cx + half; x++) put(x, y, 118);
    }
    for (let y = baseY - 34; y < baseY - 24; y++) {
      for (let x = cx - 4; x <= cx + 4; x++) put(x, y, 8);
    }

    if (state.flash > 0) {
      for (let y = baseY - 62; y < baseY - 20; y++) {
        for (let x = cx - 28; x <= cx + 28; x++) {
          const dx = (x - cx) / 28;
          const dy = (y - (baseY - 42)) / 22;
          if (dx * dx + dy * dy < 1) put(x, y, state.flash % 2 ? 252 : 238);
        }
      }
      state.flash--;
    }

    for (let d = -5; d <= 5; d++) {
      put(cx + d, Math.floor(height * 0.48), 252);
      put(cx, Math.floor(height * 0.48) + d, 252);
    }
  };

  const draw = () => {
    if (state.mode === "title") {
      drawTitle();
      return;
    }
    drawBackground();
    drawWalls();
    drawEnemies();
    drawWeapon();
    drawDamageOverlay();
  };

  const respawn = (mode = "title") => {
    state.mode = mode;
    state.titleTick = 0;
    state.x = 3.5;
    state.y = 8.5;
    state.angle = 0;
    state.flash = 0;
    state.bob = 0;
    state.hurtFlash = 0;
    state.attackCooldown = 0;
    state.hp = 100;
    state.armor = 60;
    enemies.forEach((enemy) => {
      enemy.alive = true;
    });
    keys.clear();
    draw();
  };

  const startGame = () => {
    if (state.mode === "title" || state.mode === "dead") {
      if (state.mode === "dead") respawn("game");
      else state.mode = "game";
      draw();
    }
  };

  const damagePlayer = (amount) => {
    if (state.mode !== "game") return;
    const armorHit = Math.min(state.armor, Math.ceil(amount * 0.6));
    state.armor -= armorHit;
    state.hp = Math.max(0, state.hp - (amount - armorHit));
    state.hurtFlash = 5;
    if (state.hp <= 0) state.mode = "dead";
  };

  const shoot = () => {
    state.flash = 5;
    if (state.mode === "title" || state.mode === "dead") {
      startGame();
      return;
    }
    const cosA = Math.cos(state.angle);
    const sinA = Math.sin(state.angle);
    let target = null;
    let bestForward = Infinity;
    enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      const dx = enemy.x - state.x;
      const dy = enemy.y - state.y;
      const forward = dx * cosA + dy * sinA;
      const side = Math.abs(-dx * sinA + dy * cosA);
      if (forward > 0.2 && forward < bestForward && side < Math.max(0.25, forward * 0.08)) {
        target = enemy;
        bestForward = forward;
      }
    });
    if (target) target.alive = false;
  };

  const getStatus = () => ({
    hp: state.hp,
    armor: state.armor,
    mode: state.mode,
    enemies: enemies.filter((enemy) => enemy.alive).length,
  });

  const runtime = {
    isDemoFramebuffer: true,
    width,
    height,
    framebuffer,
    palette,
    getFramebuffer: () => ({ data: framebuffer, width, height, palette }),
    getStatus,
    sendKey: (key, pressed) => {
      const normalized = key.length === 1 ? key.toLowerCase() : key;
      if (pressed) keys.add(normalized);
      else keys.delete(normalized);
      if (pressed && normalized === "Control") shoot();
      else if (pressed && state.mode === "title") startGame();
    },
    reset: () => {
      respawn("title");
    },
    tick: () => {
      if (state.mode === "title") {
        state.titleTick++;
        draw();
        return;
      }
      if (state.mode === "dead") {
        draw();
        return;
      }
      const forward = (keys.has("w") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("s") || keys.has("ArrowDown") ? 1 : 0);
      const strafe = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
      const turn = (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
      state.angle += turn * 0.075;
      if (forward || strafe) {
        const speed = 0.075;
        const dx = Math.cos(state.angle) * forward * speed + Math.cos(state.angle + Math.PI / 2) * strafe * speed;
        const dy = Math.sin(state.angle) * forward * speed + Math.sin(state.angle + Math.PI / 2) * strafe * speed;
        if (!isWall(state.x + dx, state.y)) state.x += dx;
        if (!isWall(state.x, state.y + dy)) state.y += dy;
        state.bob += 0.56;
      } else {
        state.bob *= 0.9;
      }

      state.attackCooldown = Math.max(0, state.attackCooldown - 1);
      enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        enemy.phase += 0.08;
        const dx = state.x - enemy.x;
        const dy = state.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1.05 && dist < 7) {
          const step = 0.03;
          const nx = enemy.x + (dx / dist) * step;
          const ny = enemy.y + (dy / dist) * step;
          if (!isWall(nx, enemy.y)) enemy.x = nx;
          if (!isWall(enemy.x, ny)) enemy.y = ny;
        } else if (dist <= 1.15 && state.attackCooldown === 0) {
          damagePlayer(18);
          state.attackCooldown = 8;
        }
      });
      draw();
    },
  };

  draw();
  return runtime;
};

const getDoomRuntime = () => {
  const root = typeof globalThis !== "undefined" ? globalThis : null;
  if (!root) return null;
  const runtime =
    root.doomWasm ||
    root.DoomWasm ||
    root.chocolateDoomWasm ||
    root.__CHOCOLATE_DOOM_WASM__ ||
    root.__DOOM_WASM__;
  if (runtime) return runtime;

  // Until a real doom-wasm/chocolate-doom-wasm bundle is provided by the host,
  // connect the renderer to a tiny in-memory framebuffer with the same API
  // shape. This keeps Stage 2 exercising the framebuffer + input path instead
  // of falling back to the old raycaster or a static placeholder.
  root.__DOOM_WASM__ = createDemoDoomFramebufferRuntime();
  return root.__DOOM_WASM__;
};

const advanceDoomRuntime = () => {
  const doom = getDoomRuntime();
  if (doom && typeof doom.tick === "function") doom.tick();
  return doom;
};

const normalizeDoomPalette = (palette) => {
  if (!palette) return DOOM_FALLBACK_PALETTE;
  if (Array.isArray(palette) && Array.isArray(palette[0])) return palette;
  const raw = palette.colors || palette.data || palette;
  const bytes = ArrayBuffer.isView(raw) ? raw : Array.isArray(raw) ? raw : [];
  const colors = [];
  for (let i = 0; i < Math.min(256, Math.floor(bytes.length / 3)); i++) {
    colors.push([bytes[i * 3], bytes[i * 3 + 1], bytes[i * 3 + 2]]);
  }
  return colors.length ? colors : DOOM_FALLBACK_PALETTE;
};

const readDoomFramebuffer = () => {
  const doom = getDoomRuntime();
  if (!doom) return null;

  const module = doom.Module || doom.module || doom;
  const width = doom.width || doom.framebufferWidth || doom.screenWidth || DOOM_SOURCE_W;
  const height = doom.height || doom.framebufferHeight || doom.screenHeight || DOOM_SOURCE_H;
  const palette = normalizeDoomPalette(doom.palette || doom.doomPalette || module.palette);

  const direct =
    (typeof doom.getFramebuffer === "function" && doom.getFramebuffer()) ||
    doom.framebuffer ||
    doom.frameBuffer ||
    doom.screen ||
    module.framebuffer;
  if (direct && direct.data && (Array.isArray(direct.data) || ArrayBuffer.isView(direct.data))) {
    return {
      data: direct.data,
      width: direct.width || width,
      height: direct.height || height,
      palette: normalizeDoomPalette(direct.palette || palette),
    };
  }
  if (direct && (Array.isArray(direct) || ArrayBuffer.isView(direct))) {
    return { data: direct, width, height, palette };
  }

  const ptr =
    (typeof doom.getFramebufferPtr === "function" && doom.getFramebufferPtr()) ||
    doom.framebufferPtr ||
    doom.frameBufferPtr ||
    doom.screenPtr ||
    module.framebufferPtr;
  const heap = module.HEAPU8 || doom.HEAPU8;
  if (ptr !== undefined && ptr !== null && heap) {
    return { data: heap.subarray(ptr, ptr + width * height), width, height, palette };
  }

  return null;
};

const doomPaletteRgb = (indexedColor, palette) => {
  const color = palette[indexedColor] || [indexedColor, indexedColor, indexedColor];
  const r = color.r !== undefined ? color.r : color[0] || 0;
  const g = color.g !== undefined ? color.g : color[1] || 0;
  const b = color.b !== undefined ? color.b : color[2] || 0;
  return [r, g, b];
};

const doomPixelBrightness = (indexedColor, palette) => {
  const [r, g, b] = doomPaletteRgb(indexedColor, palette);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

const doomPaletteHex = (indexedColor, palette) => {
  const [r, g, b] = doomPaletteRgb(indexedColor, palette);
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
};

const doomShadeForBrightness = (brightness) => {
  const idx = Math.min(
    DOOM_SHADES.length - 1,
    Math.max(0, Math.floor((1 - brightness) * DOOM_SHADES.length)),
  );
  return DOOM_SHADES[idx];
};

const rowKindForSourceBand = (sourceY0, sourceY1, height, brightCenterCount) => {
  const counts = { sky: 0, wall: 0, floor: 0 };
  for (let y = sourceY0; y < sourceY1; y++) {
    if (y < height * 0.36) counts.sky++;
    else if (y > height * 0.66) counts.floor++;
    else counts.wall++;
  }
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  if (brightCenterCount > 4 && dominant === "floor") return "flash";
  return dominant;
};

const renderDoomBootFrame = (frameTick) => {
  const message = "DOOM FRAMEBUFFER BRIDGE";
  const pulse = DOOM_SHADES[frameTick % (DOOM_SHADES.length - 1)];
  return Array.from({ length: DOOM_VIEW_H }, (_, y) => {
    if (y === Math.floor(DOOM_VIEW_H / 2)) {
      const pad = Math.max(0, Math.floor((DOOM_VIEW_W - message.length) / 2));
      return {
        text: `${" ".repeat(pad)}${message}`.padEnd(DOOM_VIEW_W, " "),
        kind: "wall",
      };
    }
    const horizon = y < DOOM_VIEW_H / 2 ? "sky" : "floor";
    return {
      text: (y + frameTick) % 4 === 0 ? pulse.repeat(DOOM_VIEW_W) : " ".repeat(DOOM_VIEW_W),
      kind: horizon,
    };
  });
};

// Reads the live indexed-color Doom framebuffer and returns DOOM_VIEW_H rows
// where each row is { text, kind: "sky" | "wall" | "floor" | "flash" }.
// Each text cell averages a small framebuffer rectangle, maps palette color to
// luminance, then maps brightness to (█▓▒░· ).
const renderDoomFrame = (frameTick) => {
  const fb = readDoomFramebuffer();
  if (!fb) return renderDoomBootFrame(frameTick);

  const rows = new Array(DOOM_VIEW_H);
  const cellW = fb.width / DOOM_VIEW_W;
  const cellH = fb.height / DOOM_VIEW_H;
  const centerStart = Math.floor(DOOM_VIEW_W * 0.42);
  const centerEnd = Math.ceil(DOOM_VIEW_W * 0.58);

  for (let y = 0; y < DOOM_VIEW_H; y++) {
    const sy0 = Math.floor(y * cellH);
    const sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * cellH));
    let line = "";
    let brightCenterCount = 0;

    for (let x = 0; x < DOOM_VIEW_W; x++) {
      const sx0 = Math.floor(x * cellW);
      const sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * cellW));
      let total = 0;
      let samples = 0;

      for (let sy = sy0; sy < sy1; sy += Math.max(1, Math.floor((sy1 - sy0) / 3))) {
        const row = sy * fb.width;
        for (let sx = sx0; sx < sx1; sx += Math.max(1, Math.floor((sx1 - sx0) / 3))) {
          total += doomPixelBrightness(fb.data[row + sx] || 0, fb.palette);
          samples++;
        }
      }

      const brightness = samples ? total / samples : 0;
      if (x >= centerStart && x <= centerEnd && brightness > 0.82) brightCenterCount++;
      line += doomShadeForBrightness(brightness);
    }

    rows[y] = {
      text: line,
      kind: rowKindForSourceBand(sy0, sy1, fb.height, brightCenterCount),
    };
  }

  return rows;
};

const sendDoomKey = (key, pressed = true) => {
  const doom = getDoomRuntime();
  if (!doom) return;
  const module = doom.Module || doom.module || doom;
  const code = key === "Control" ? "ControlLeft" : key;
  const event = { key, code, keyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0, pressed };

  if (typeof doom.sendKey === "function") doom.sendKey(key, pressed);
  else if (pressed && typeof doom.keyDown === "function") doom.keyDown(key);
  else if (!pressed && typeof doom.keyUp === "function") doom.keyUp(key);
  else if (typeof doom.keyboardEvent === "function") doom.keyboardEvent(event);
  else if (typeof doom.postMessage === "function") doom.postMessage({ type: "key", ...event });
  else if (module.ccall) {
    const fn = pressed ? "doom_key_down" : "doom_key_up";
    module.ccall(fn, null, ["string"], [key]);
  }
};

const tapDoomKeys = (keys) => {
  keys.forEach((key) => sendDoomKey(key, true));
  // Keep button taps short. tapInput() advances one frame immediately, so a
  // long synthetic key hold can get picked up again by the 10 fps interval and
  // make each click feel like two or three inputs.
  setTimeout(() => keys.forEach((key) => sendDoomKey(key, false)), 12);
};

const DOOM_ROW_COLORS = {
  sky:   "#7fbada",
  wall:  "#33475b",
  floor: "#8a6646",
  flash: "#ffd166",
};

const doomBar = (value, max, width) => {
  const filled = Math.max(0, Math.min(width, Math.round((value / max) * width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
};

const escapeDoomSvgText = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");

const makeDoomRowsSvg = (rows, rowWidth = DOOM_VIEW_W) => {
  const width = Math.ceil(rowWidth * DOOM_CHAR_WIDTH + DOOM_SVG_PADDING_X * 2);
  const height = Math.ceil(rows.length * DOOM_LINE_HEIGHT + DOOM_SVG_PADDING_Y * 2);
  const safeFontFamily = MONO_FAMILY.replace(/\"/g, "&quot;");
  const lines = rows
    .map((row, i) => {
      const y = DOOM_SVG_PADDING_Y + i * DOOM_LINE_HEIGHT + DOOM_FONT_SIZE * 0.82;
      const color = row.kind === "hud" ? "#0e8a5f" : DOOM_ROW_COLORS[row.kind];
      return (
        `<text x="${DOOM_SVG_PADDING_X}" y="${y}" ` +
        `font-family="${safeFontFamily}" font-size="${DOOM_FONT_SIZE}" ` +
        `fill="${color}">${escapeDoomSvgText(row.text)}</text>`
      );
    })
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" xml:space="preserve">${lines}</svg>`;
  return {
    src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    width,
    height,
  };
};

const makeDoomAsciiViewportSvg = (frame) => makeDoomRowsSvg(frame);

const makeDoomHudSvg = (hudLine) =>
  makeDoomRowsSvg([{ text: hudLine, kind: "hud" }], Math.max(DOOM_VIEW_W, hudLine.length));

const makeDoomPixelViewportSvg = () => {
  const fb = readDoomFramebuffer();
  if (!fb) return makeDoomAsciiViewportSvg(renderDoomBootFrame(0));

  const width = DOOM_PIXEL_VIEW_W * DOOM_PIXEL_SIZE;
  const height = DOOM_PIXEL_VIEW_H * DOOM_PIXEL_SIZE;
  const cellW = fb.width / DOOM_PIXEL_VIEW_W;
  const cellH = fb.height / DOOM_PIXEL_VIEW_H;
  let rects = "";
  let lastColor = null;
  let runStart = 0;
  let runY = 0;
  let runLen = 0;

  const flushRun = () => {
    if (!lastColor || runLen === 0) return;
    rects +=
      `<rect x="${runStart * DOOM_PIXEL_SIZE}" y="${runY * DOOM_PIXEL_SIZE}" ` +
      `width="${runLen * DOOM_PIXEL_SIZE}" height="${DOOM_PIXEL_SIZE}" fill="${lastColor}"/>`;
  };

  for (let py = 0; py < DOOM_PIXEL_VIEW_H; py++) {
    const sy0 = Math.floor(py * cellH);
    const sy1 = Math.max(sy0 + 1, Math.floor((py + 1) * cellH));
    lastColor = null;
    runStart = 0;
    runY = py;
    runLen = 0;

    for (let px = 0; px < DOOM_PIXEL_VIEW_W; px++) {
      const sx0 = Math.floor(px * cellW);
      const sx1 = Math.max(sx0 + 1, Math.floor((px + 1) * cellW));
      let rTotal = 0;
      let gTotal = 0;
      let bTotal = 0;
      let samples = 0;

      for (let sy = sy0; sy < sy1; sy += Math.max(1, Math.floor((sy1 - sy0) / 3))) {
        const row = sy * fb.width;
        for (let sx = sx0; sx < sx1; sx += Math.max(1, Math.floor((sx1 - sx0) / 3))) {
          const [r, g, b] = doomPaletteRgb(fb.data[row + sx] || 0, fb.palette);
          rTotal += r;
          gTotal += g;
          bTotal += b;
          samples++;
        }
      }

      const color = `#${[rTotal, gTotal, bTotal]
        .map((v) => Math.round(v / Math.max(1, samples)).toString(16).padStart(2, "0"))
        .join("")}`;

      if (color === lastColor) {
        runLen++;
      } else {
        flushRun();
        lastColor = color;
        runStart = px;
        runLen = 1;
      }
    }
    flushRun();
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">` +
    `<rect width="${width}" height="${height}" fill="#080a0c"/>${rects}</svg>`;

  return {
    src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    width,
    height,
  };
};

const DoomerDemo = () => {
  const [frameTick, setFrameTick] = useState(0);
  const [hp, setHp] = useState(100);
  const [armor, setArmor] = useState(60);
  const [ammo, setAmmo] = useState(50);
  const [commandInput, setCommandInput] = useState("");
  const [commandCursor, setCommandCursor] = useState(0);
  const [log, setLog] = useState(["Connected to Doom framebuffer bridge."]);

  const syncDoomStatus = (doom = getDoomRuntime()) => {
    if (!doom || typeof doom.getStatus !== "function") return;
    const status = doom.getStatus();
    if (typeof status.hp === "number") setHp(status.hp);
    if (typeof status.armor === "number") setArmor(status.armor);
    if (status.mode === "dead") {
      setLog((l) =>
        l[0] === "You were killed by a monster. Press SHOOT or Respawn."
          ? l
          : ["You were killed by a monster. Press SHOOT or Respawn.", ...l].slice(0, 6),
      );
    }
  };

  useEffect(() => {
    syncDoomStatus(advanceDoomRuntime());
    const id = setInterval(() => {
      syncDoomStatus(advanceDoomRuntime());
      setFrameTick((tick) => tick + 1);
    }, 100);
    return () => clearInterval(id);
  }, []);

  const frame = useMemo(
    () => renderDoomFrame(frameTick),
    [frameTick],
  );

  const tapInput = (keys, message) => {
    tapDoomKeys(keys);
    syncDoomStatus(advanceDoomRuntime());
    setFrameTick((tick) => tick + 1);
    if (message) setLog((l) => [message, ...l].slice(0, 6));
  };

  const shoot = () => {
    if (ammo === 0) {
      setLog((l) => ["*click* — out of ammo.", ...l].slice(0, 6));
      return;
    }
    setAmmo((a) => Math.max(0, a - 1));
    tapInput(["Control"], "CTRL fire event forwarded to Doom.");
  };

  const handleCommandInput = (value) => {
    const text = String(value || "").toLowerCase();
    const cursor = text.length < commandCursor ? 0 : commandCursor;
    const nextChars = text.slice(cursor);
    setCommandInput(text);
    const commands = {
      w: ["w", "ArrowUp"],
      a: ["a"],
      s: ["s", "ArrowDown"],
      d: ["d"],
      q: ["ArrowLeft"],
      e: ["ArrowRight"],
      f: ["Control"],
      " ": ["Control"],
    };

    [...nextChars].forEach((char) => {
      if (!commands[char]) return;
      if (char === "f" || char === " ") setAmmo((a) => Math.max(0, a - 1));
      tapInput(commands[char]);
    });
    setCommandCursor(text.length);
  };

  const reset = () => {
    const doom = getDoomRuntime();
    if (doom && typeof doom.reset === "function") doom.reset();
    syncDoomStatus(doom);
    setFrameTick((tick) => tick + 1);
    setHp(100);
    setArmor(60);
    setAmmo(50);
    setLog(["Respawned / reset requested on the Doom WASM port."]);
  };

  const hudLine =
    `HP ${doomBar(hp, 100, 10)} ${String(hp).padStart(3, " ")}` +
    `   AMMO ${String(ammo).padStart(2, " ")}` +
    `   ARMOR ${doomBar(armor, 100, 10)} ${String(armor).padStart(3, " ")}`;

  const viewportSvg = useMemo(
    () => makeDoomPixelViewportSvg(),
    [frameTick],
  );
  const hudSvg = useMemo(
    () => makeDoomHudSvg(hudLine),
    [hudLine],
  );

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="flush">
          <Text format={{ fontWeight: "demibold" }}>
            Pixel Doom — WASM framebuffer rendered as SVG
          </Text>
          <Text variant="microcopy">
            The Doom WASM framebuffer is downsampled to {DOOM_PIXEL_VIEW_W}×
            {DOOM_PIXEL_VIEW_H} with averaged palette colors, then emitted as
            one crisp pixel-art SVG.
            The HUD is a separate stable SVG so counters do not repaint on
            every animation frame.
          </Text>
        </Flex>
      </Tile>

      {/* Viewport: one animated pixel SVG for the framebuffer; HUD is stable. */}
      <Tile>
        <Flex direction="column" gap="flush" align="start">
          <Image
            src={viewportSvg.src}
            width={viewportSvg.width}
            height={viewportSvg.height}
            alt="Pixel Doom viewport"
          />
          <Image
            src={hudSvg.src}
            width={hudSvg.width}
            height={hudSvg.height}
            alt={hudLine}
          />
        </Flex>
      </Tile>

      {/* D-pad */}
      <Tile>
        <Flex direction="column" gap="sm" align="start">
          <Input
            label="Keyboard commands"
            name="doom-keyboard-commands"
            value={commandInput}
            placeholder="Focus here, then type W/A/S/D. Q/E turn, F fires."
            description="Each typed letter is translated into one short Doom key event. Try sequences like wwdeff."
            onInput={handleCommandInput}
            onChange={handleCommandInput}
          />
          <Flex direction="column" gap="sm" align="center">
            <Flex direction="row" gap="xs">
              <Button onClick={() => tapInput(["ArrowLeft"], "Turn-left key event sent.")}>⟲ Turn L</Button>
              <Button onClick={() => tapInput(["w", "ArrowUp"], "Forward key event sent.")}>↑ Forward</Button>
              <Button onClick={() => tapInput(["ArrowRight"], "Turn-right key event sent.")}>⟳ Turn R</Button>
            </Flex>
            <Flex direction="row" gap="xs">
              <Button onClick={() => tapInput(["a"], "Strafe-left key event sent.")}>← Strafe L</Button>
              <Button onClick={() => tapInput(["s", "ArrowDown"], "Back key event sent.")}>↓ Back</Button>
              <Button onClick={() => tapInput(["d"], "Strafe-right key event sent.")}>→ Strafe R</Button>
            </Flex>
            <Flex direction="row" gap="xs">
              <Button variant="primary" onClick={shoot} disabled={ammo === 0}>
                ⊕ SHOOT
              </Button>
              <Button variant="secondary" onClick={reset}>
                Respawn
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Tile>

      {/* Console log */}
      <Tile>
        <Flex direction="column" gap="flush">
          <Text format={{ fontWeight: "demibold" }}>Console</Text>
          {log.map((entry, i) => (
            <Text
              key={i}
              variant={i === 0 ? "bodytext" : "microcopy"}
              format={i === 0 ? { fontWeight: "demibold" } : undefined}
            >
              [{i === 0 ? "NEW" : "   "}] {entry}
            </Text>
          ))}
        </Flex>
      </Tile>

      {/* Stage 2 hand-off notes */}
      <Tile>
        <Flex direction="column" gap="flush">
          <Text format={{ fontWeight: "demibold" }}>Stage 2 WASM bridge</Text>
          <Text variant="microcopy">
            • renderDoomFrame() now reads a runtime Doom WASM framebuffer
            (e.g. doom-wasm or chocolate-doom-wasm globals) and returns the
            same {`{text, kind}`} row shape.
          </Text>
          <Text variant="microcopy">
            • The same framebuffer can be rendered as ASCII rows, but this
            viewport uses palette colors directly as chunky SVG pixels for a
            higher-quality Doom-like frame.
          </Text>
          <Text variant="microcopy">
            • The D-pad onClicks forward Doom keyboard events (W/A/S/D,
            arrow keys, ctrl=fire) via the WASM port's input API.
          </Text>
          <Text variant="microcopy">
            • The game loop is driven by a useEffect setInterval at 10 fps;
            setFrameTick() retriggers the viewport SVG. The HUD is memoized
            separately to prevent counter flicker.
          </Text>
        </Flex>
      </Tile>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo — ASCII Tetris
// ═══════════════════════════════════════════════════════════════════════════

const TETRIS_W = 10;
const TETRIS_H = 20;
const EMPTY_ROW = () => Array(TETRIS_W).fill(" ");
const TETRIS_PIECES = {
  I: { char: "I", rotations: [ [[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]] ] },
  O: { char: "O", rotations: [ [[1,0],[2,0],[1,1],[2,1]] ] },
  T: { char: "T", rotations: [ [[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]] ] },
  S: { char: "S", rotations: [ [[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]] ] },
  Z: { char: "Z", rotations: [ [[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]] ] },
  J: { char: "J", rotations: [ [[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]] ] },
  L: { char: "L", rotations: [ [[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]] ] },
};
const TETRIS_TYPES = Object.keys(TETRIS_PIECES);
const TETRIS_POINTS = [0, 100, 300, 500, 800];
const TETRIS_UNICODE_GLYPHS = {
  I: "█",
  O: "■",
  T: "◆",
  S: "▓",
  Z: "▒",
  J: "▣",
  L: "▰",
};
const TETRIS_COLORS = {
  I: "#00a4bd",
  O: "#f5c26b",
  T: "#7c3aed",
  S: "#00bda5",
  Z: "#f2545b",
  J: "#4f7df3",
  L: "#ff7a59",
  ghost: "#99acc2",
  empty: "#d5dde6",
  frame: "#33475b",
  hud: "#213343",
};

const makeTetrisBoard = () => Array.from({ length: TETRIS_H }, EMPTY_ROW);
const randomTetrisType = () => TETRIS_TYPES[Math.floor(Math.random() * TETRIS_TYPES.length)];
const makeTetrisPiece = (type = randomTetrisType()) => ({ type, x: 3, y: 0, r: 0 });
const tetrisCells = (piece) =>
  TETRIS_PIECES[piece.type].rotations[piece.r % TETRIS_PIECES[piece.type].rotations.length]
    .map(([x, y]) => [piece.x + x, piece.y + y]);
const canPlaceTetris = (board, piece) =>
  tetrisCells(piece).every(([x, y]) => x >= 0 && x < TETRIS_W && y >= 0 && y < TETRIS_H && board[y][x] === " ");
const mergeTetris = (board, piece) => {
  const next = board.map((row) => [...row]);
  tetrisCells(piece).forEach(([x, y]) => { if (y >= 0 && y < TETRIS_H) next[y][x] = TETRIS_PIECES[piece.type].char; });
  return next;
};
const clearTetrisLines = (board) => {
  const kept = board.filter((row) => row.some((cell) => cell === " "));
  const cleared = TETRIS_H - kept.length;
  return { board: [...Array.from({ length: cleared }, EMPTY_ROW), ...kept], cleared };
};
const initialTetrisGame = () => {
  const next = randomTetrisType();
  const active = makeTetrisPiece(randomTetrisType());
  return { board: makeTetrisBoard(), active, next, score: 0, lines: 0, level: 1, over: false, paused: false, command: "" };
};
const settleTetrisPiece = (game, piece = game.active) => {
  const merged = mergeTetris(game.board, piece);
  const { board, cleared } = clearTetrisLines(merged);
  const totalLines = game.lines + cleared;
  const level = Math.floor(totalLines / 10) + 1;
  const active = makeTetrisPiece(game.next);
  const next = randomTetrisType();
  const over = !canPlaceTetris(board, active);
  return {
    ...game,
    board,
    active,
    next,
    over,
    lines: totalLines,
    level,
    score: game.score + TETRIS_POINTS[cleared] * level + 5,
  };
};
const tickTetris = (game) => {
  if (game.over || game.paused) return game;
  const dropped = { ...game.active, y: game.active.y + 1 };
  return canPlaceTetris(game.board, dropped) ? { ...game, active: dropped } : settleTetrisPiece(game);
};
const moveTetris = (game, dx) => {
  if (game.over || game.paused) return game;
  const moved = { ...game.active, x: game.active.x + dx };
  return canPlaceTetris(game.board, moved) ? { ...game, active: moved } : game;
};
const rotateTetris = (game) => {
  if (game.over || game.paused) return game;
  const pieceDef = TETRIS_PIECES[game.active.type];
  const rotated = { ...game.active, r: (game.active.r + 1) % pieceDef.rotations.length };
  const kicks = [0, -1, 1, -2, 2].map((dx) => ({ ...rotated, x: rotated.x + dx }));
  const valid = kicks.find((candidate) => canPlaceTetris(game.board, candidate));
  return valid ? { ...game, active: valid } : game;
};
const hardDropTetris = (game) => {
  if (game.over || game.paused) return game;
  let piece = game.active;
  let distance = 0;
  while (canPlaceTetris(game.board, { ...piece, y: piece.y + 1 })) {
    piece = { ...piece, y: piece.y + 1 };
    distance += 1;
  }
  const settled = settleTetrisPiece(game, piece);
  return { ...settled, score: settled.score + distance * 2 };
};
const tetrisGlyph = (type, mode) =>
  mode === "unicode" ? "█" : TETRIS_PIECES[type].char;
const tetrisEmptyGlyph = (mode, y) =>
  mode === "unicode" ? (y % 2 === 0 ? "·" : "˙") : ".";
const getTetrisGhost = (board, active) => {
  let ghost = active;
  while (canPlaceTetris(board, { ...ghost, y: ghost.y + 1 })) {
    ghost = { ...ghost, y: ghost.y + 1 };
  }
  return ghost;
};
const tetrisPreviewLines = (type, mode = "ascii") => {
  const grid = Array.from({ length: 4 }, () => Array(4).fill(" "));
  TETRIS_PIECES[type].rotations[0].forEach(([x, y]) => { grid[y][x] = tetrisGlyph(type, mode); });
  return grid.map((row) => row.join("").replace(/\s+$/g, ""));
};
const getTetrisRenderGrid = (game, mode = "ascii") => {
  const grid = game.board.map((row) => row.map((cell) => ({ type: cell, ghost: false })));
  if (!game.over) {
    tetrisCells(getTetrisGhost(game.board, game.active)).forEach(([x, y]) => {
      if (y >= 0 && y < TETRIS_H && x >= 0 && x < TETRIS_W && grid[y][x].type === " ") {
        grid[y][x] = { type: "ghost", ghost: true };
      }
    });
    tetrisCells(game.active).forEach(([x, y]) => {
      if (y >= 0 && y < TETRIS_H && x >= 0 && x < TETRIS_W) grid[y][x] = { type: game.active.type, ghost: false };
    });
  }
  return grid;
};
const renderTetrisAscii = (game, mode = "ascii") => {
  const unicode = mode === "unicode";
  const grid = getTetrisRenderGrid(game, mode);
  const title = unicode ? "◢ UNICODE × ASCII TETRIS ◣" : "ASCII TETRIS";
  return [
    `${title}   SCORE ${String(game.score).padStart(5, "0")}`,
    `LINES ${String(game.lines).padStart(2, "0")}   LEVEL ${game.level}   ${game.paused ? "PAUSED" : game.over ? "GAME OVER" : "PLAY"}`,
    unicode ? "ghost=░░   solid=██   clear lines for combos" : "ghost=::   solid=##   clear lines for combos",
    "",
    unicode ? "╔════════════════════╗" : "+--------------------+",
    ...grid.map((row, y) => {
      const body = row.map(({ type, ghost }) => {
        if (ghost) return unicode ? "░░" : "::";
        if (type === " ") return tetrisEmptyGlyph(mode, y).repeat(2);
        return unicode ? tetrisGlyph(type, mode).repeat(2) : type.repeat(2);
      }).join("");
      return `${unicode ? "║" : "|"}${body}${unicode ? "║" : "|"}`;
    }),
    unicode ? "╚════════════════════╝" : "+--------------------+",
    "",
    "Controls: A/D move, W rotate, S soft drop, SPACE hard drop",
  ];
};
const TetrisGlyph = ({ text, color, fontSize = 12 }) => (
  <StyledText
    text={text.replace(/ /g, NBSP)}
    fontFamily={MONO_FAMILY}
    fontSize={fontSize}
    paddingX={Math.ceil(fontSize / 3)}
    color={color}
  />
);
const makeTetrisSvg = (game, mode = "unicode") => {
  const grid = getTetrisRenderGrid(game, "unicode");
  const safeFontFamily = MONO_FAMILY.replace(/"/g, "&quot;");
  const width = 304;
  const height = 414;
  const boardX = 54;
  const boardY = 28;
  const charW = 8.6;
  const lineH = 18;

  const text = (x, y, value, color = "#213343", size = 13, weight = 700, extra = "") =>
    `<text x="${x}" y="${y}" font-family="${safeFontFamily}" font-size="${size}" font-weight="${weight}" fill="${color}" ${extra}>${escapeDoomSvgText(value)}</text>`;
  const rect = (x, y, w, h, fill = "#ffffff", stroke = "#dbe4ed", rx = 6, extra = "") =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" ${extra}/>`;

  const topChars = ["┌", ...Array(TETRIS_W * 2).fill("─"), "┐"];
  const bottomChars = ["└", ...Array(TETRIS_W * 2).fill("─"), "┘"];
  const rightBorderX = boardX + charW * (TETRIS_W * 2 + 1);
  const frame =
    topChars.map((ch, i) => text(boardX + i * charW, boardY, ch, "#33475b", 14, 800)).join("") +
    bottomChars.map((ch, i) => text(boardX + i * charW, boardY + (TETRIS_H + 1) * lineH, ch, "#33475b", 14, 800)).join("") +
    Array.from({ length: TETRIS_H }, (_, y) =>
      text(boardX, boardY + (y + 1) * lineH, "│", "#33475b", 14, 800) +
      text(rightBorderX, boardY + (y + 1) * lineH, "│", "#33475b", 14, 800)
    ).join("");

  const cells = grid.map((row, y) => row.map(({ type, ghost }, x) => {
    const value = ghost ? "░░" : type === " " ? "··" : "██";
    const color = ghost ? "#99acc2" : type === " " ? "#dbe4ed" : TETRIS_COLORS[type];
    const weight = type === " " && !ghost ? 500 : 900;
    const opacity = type === " " && !ghost ? 0.78 : 1;
    return text(boardX + charW + x * charW * 2, boardY + (y + 1) * lineH, value, color, 14, weight, `opacity="${opacity}"`);
  }).join("")).join("");

  const rowNumbers = Array.from({ length: TETRIS_H }, (_, y) =>
    text(24, boardY + (y + 1) * lineH, String(y + 1).padStart(2, "0"), "#99acc2", 10, 800)
  ).join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    rect(0, 0, width, height, "#f6f9fc", "#dbe4ed", 8) +
    `<rect x="1" y="1" width="${width - 2}" height="5" rx="2" fill="#ff7a59" stroke="none"/>` +
    rowNumbers + frame + cells +
    `</svg>`;

  return {
    src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    width,
    height,
  };
};

const makeTetrisPieceSvg = (type, rotation = 0) => {
  const cell = 18;
  const gap = 2;
  const pad = 4;
  const width = pad * 2 + 4 * cell + 3 * gap;
  const height = width;
  const cells = TETRIS_PIECES[type].rotations[rotation % TETRIS_PIECES[type].rotations.length]
    .map(([x, y]) => {
      const px = pad + x * (cell + gap);
      const py = pad + y * (cell + gap);
      return `<rect x="${px}" y="${py}" width="${cell}" height="${cell}" rx="3" fill="${TETRIS_COLORS[type]}"/>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${cells}</svg>`;
  return { src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, width, height };
};

const AsciiTetrisDemo = () => {
  const [game, setGame] = useState(initialTetrisGame);
  const [commandCursor, setCommandCursor] = useState(0);
  const [speed, setSpeed] = useState(5);

  useEffect(() => {
    const intervalMs = Math.max(90, 960 - speed * 80 - (game.level - 1) * 45);
    const id = setInterval(() => setGame((g) => tickTetris(g)), intervalMs);
    return () => clearInterval(id);
  }, [game.level, speed]);

  const applyCommand = (command) => {
    setGame((g) => {
      if (command === "left") return moveTetris(g, -1);
      if (command === "right") return moveTetris(g, 1);
      if (command === "down") return tickTetris(g);
      if (command === "rotate") return rotateTetris(g);
      if (command === "drop") return hardDropTetris(g);
      if (command === "pause") return { ...g, paused: !g.paused };
      if (command === "reset") return initialTetrisGame();
      return g;
    });
  };

  const handleCommandInput = (value) => {
    const text = String(value || "").toLowerCase();
    const cursor = text.length < commandCursor ? 0 : commandCursor;
    [...text.slice(cursor)].forEach((char) => {
      if (char === "a") applyCommand("left");
      if (char === "d") applyCommand("right");
      if (char === "s") applyCommand("down");
      if (char === "w") applyCommand("rotate");
      if (char === " ") applyCommand("drop");
    });
    setGame((g) => ({ ...g, command: text }));
    setCommandCursor(text.length);
  };

  const ascii = useMemo(() => renderTetrisAscii(game, "unicode"), [game]);
  const tetrisSvg = useMemo(() => makeTetrisSvg(game, "unicode"), [game]);
  const playfieldWidth = 360;
  const playfieldHeight = Math.round((tetrisSvg.height / tetrisSvg.width) * playfieldWidth);
  const status = game.paused ? "Paused" : game.over ? "Game over" : "Playing";
  const currentPieceSvg = useMemo(
    () => makeTetrisPieceSvg(game.active.type, game.active.r),
    [game.active.type, game.active.r],
  );
  const nextPieceSvg = useMemo(() => makeTetrisPieceSvg(game.next), [game.next]);

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="flush">
          <Text format={{ fontWeight: "demibold" }}>Unicode + ASCII-rendered Tetris</Text>
          <Text variant="microcopy">
            The default view is a HubSpot-styled monospace SVG using a tiny
            glyph vocabulary: solid blocks for pieces, shaded blocks for the
            ghost projection, and dots for empty cells. Shape identity comes
            from color, not extra glyph complexity.
          </Text>
        </Flex>
      </Tile>
      <Flex direction="row" gap="md" align="start">
        <Box flex={1}>
          <Tile>
            <Flex direction="column" gap="sm">
              {game.over && (
                <Alert title="Game over" variant="danger">
                  Stack reached the top. Restart to try again.
                </Alert>
              )}
              <Flex direction="row" justify="center" align="center">
                <Image
                  src={tetrisSvg.src}
                  width={playfieldWidth}
                  height={playfieldHeight}
                  alt={ascii.join("\n")}
                />
              </Flex>
              {game.over && (
                <Flex direction="row" justify="end">
                  <Button variant="secondary" onClick={() => applyCommand("reset")}>
                    Restart game
                  </Button>
                </Flex>
              )}
            </Flex>
          </Tile>
        </Box>
        <Box flex={1}>
          <Flex direction="column" gap="sm">
            <Tile compact={true}>
              <Flex direction="column" gap="xs">
                <Text format={{ fontWeight: "demibold" }}>Game state</Text>
                <DescriptionList direction="row">
                  <DescriptionListItem label="Score">
                    <Text format={{ fontWeight: "demibold" }}>{String(game.score).padStart(5, "0")}</Text>
                  </DescriptionListItem>
                  <DescriptionListItem label="Lines">
                    <Text format={{ fontWeight: "demibold" }}>{String(game.lines).padStart(2, "0")}</Text>
                  </DescriptionListItem>
                  <DescriptionListItem label="Level">
                    <Text format={{ fontWeight: "demibold" }}>{game.level}</Text>
                  </DescriptionListItem>
                  <DescriptionListItem label="Status">
                    <Text format={{ fontWeight: "demibold" }}>{status}</Text>
                  </DescriptionListItem>
                </DescriptionList>
              </Flex>
            </Tile>
            <Tile compact={true}>
              <Flex direction="column" gap="xs">
                <Text format={{ fontWeight: "demibold" }}>Pieces</Text>
                <Flex direction="row" gap="lg" align="start">
                  <Box flex={1}>
                    <Flex direction="column" gap="flush">
                      <Text variant="microcopy">Current · {game.active.type}</Text>
                      <Image
                        src={currentPieceSvg.src}
                        width={currentPieceSvg.width}
                        height={currentPieceSvg.height}
                        alt={`${game.active.type} tetromino`}
                      />
                    </Flex>
                  </Box>
                  <Box flex={1}>
                    <Flex direction="column" gap="flush">
                      <Text variant="microcopy">Next · {game.next}</Text>
                      <Image
                        src={nextPieceSvg.src}
                        width={nextPieceSvg.width}
                        height={nextPieceSvg.height}
                        alt={`${game.next} tetromino`}
                      />
                    </Flex>
                  </Box>
                </Flex>
              </Flex>
            </Tile>
            <Tile compact={true}>
              <Flex direction="column" gap="xs">
                <Input
                  label="Commands"
                  name="ascii-tetris-commands"
                  value={game.command}
                  placeholder="A/D move · W rotate · S soft drop · Space hard drop"
                  description="Type one or more commands."
                  onInput={handleCommandInput}
                  onChange={handleCommandInput}
                />
                <StepperInput
                  label="Speed"
                  name="ascii-tetris-speed"
                  description="Higher values drop pieces faster."
                  min={1}
                  max={10}
                  stepSize={1}
                  minValueReachedTooltip="Slowest drop speed."
                  maxValueReachedTooltip="Maximum drop speed."
                  value={speed}
                  onChange={setSpeed}
                />
              </Flex>
            </Tile>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Demo registry
// ═══════════════════════════════════════════════════════════════════════════

export const TEXT_ART_DEMOS = [
  {
    id: "text-art-gallery",
    name: "Text Art Gallery",
    description:
      "A tour of single-line unicode designs that work inside HubSpot's <Text> component: sparklines, progress meters, gauges, status glyphs, journey rails, and heatmap strips.",
    package: "text-art",
    Component: TextArtGalleryDemo,
    githubUrl: TEXT_ART_DOCS,
    sourceCode: `import { Text } from "@hubspot/ui-extensions";

// Sparkline from numeric data.
const SPARK_BLOCKS = ["▁","▂","▃","▄","▅","▆","▇","█"];
const sparkline = (values) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v) => {
    const idx = Math.round(((v - min) / span) * (SPARK_BLOCKS.length - 1));
    return SPARK_BLOCKS[idx];
  }).join("");
};

<Text>{sparkline([1,3,2,5,4,7,6,9])}</Text>`,
  },
  {
    id: "text-art-spinners",
    name: "Animated Spinners & Ticker",
    description:
      "Braille / dot / pulse spinners and a marquee ticker, all animated by a single setInterval that increments a tick counter. Pause, slow down, or speed up the animation.",
    package: "text-art",
    Component: AnimatedTickerDemo,
    githubUrl: TEXT_ART_DOCS,
    sourceCode: `const FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

const Spinner = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 120);
    return () => clearInterval(id);
  }, []);
  return <Text>{FRAMES[tick % FRAMES.length]}  Loading…</Text>;
};`,
  },
  {
    id: "text-art-gauges",
    name: "Interactive Gauges",
    description:
      "Three styles of single-line gauges (blocks, segmented, bars) plus a sparkline regenerator. Useful for comparing density and visual weight at a glance.",
    package: "text-art",
    Component: InteractiveGaugesDemo,
    githubUrl: TEXT_ART_DOCS,
    sourceCode: `const progressBar = (pct, width = 20) => {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
};

<Text>{progressBar(72)}  72%</Text>`,
  },
  {
    id: "text-art-journey",
    name: "Activity Journey",
    description:
      "Click-to-advance pipeline rail rendered as ●─●─◉─○─○. Demonstrates stateful unicode UIs without any custom drawing surface.",
    package: "text-art",
    Component: ClickableJourneyDemo,
    githubUrl: TEXT_ART_DOCS,
    sourceCode: `const journey = (steps) => {
  const dot = (s) => s === "done" ? "●" : s === "active" ? "◉" : "○";
  return steps.map(dot).join(" ─── ");
};

<Text>{journey([
  { state: "done" },
  { state: "done" },
  { state: "active" },
  { state: "todo" },
])}</Text>`,
  },
  {
    id: "text-art-doom",
    name: "Pixel Doom (SVG WASM framebuffer)",
    description:
      "A Doom WASM framebuffer rendered into a crisp pixel-art SVG image with a separate stable HUD SVG to prevent counter flicker. Indexed palette colors are rendered directly as chunky SVG pixels, and the D-pad forwards W/A/S/D, arrow, and ctrl/fire keyboard events to the WASM port.",
    package: "text-art",
    Component: DoomerDemo,
    githubUrl: TEXT_ART_DOCS,
    sourceCode: `// Per-frame: read the Doom WASM indexed-color framebuffer,
// downsample/average palette colors, then compose crisp SVG pixel rects.
const viewportSvg = makeDoomPixelViewportSvg();
const hudSvg = makeDoomHudSvg(hudLine);

<Flex direction="column" gap="flush" align="start">
  <Image src={viewportSvg.src} width={viewportSvg.width} height={viewportSvg.height} />
  <Image src={hudSvg.src} width={hudSvg.width} height={hudSvg.height} />
</Flex>`,
  },
  {
    id: "text-art-tetris",
    name: "Unicode + ASCII Tetris",
    description:
      "A playable Tetris mini-game rendered as monospace Unicode: solid blocks with per-shape colors, shaded ghost projection, dotted empty cells, next-piece preview, and HUD in a HubSpot-styled SVG card.",
    package: "text-art",
    Component: AsciiTetrisDemo,
    githubUrl: TEXT_ART_DOCS,
    sourceCode: `const glyphs = { I: "█", O: "■", T: "◆", S: "▓", Z: "▒", J: "▣", L: "▰" };
const renderTetrisAscii = (game) => [
  "◢ UNICODE × ASCII TETRIS ◣",
  "╔══════════╗",
  ...overlayGhostAndPiece(game).map((row) => "║" + row.join("") + "║"),
  "╚══════════╝",
];

<MonoBlock lines={renderTetrisAscii(game)} />`,
  },
  {
    id: "text-art-monospace",
    name: "Monospace via StyledText (true ASCII art)",
    description:
      "Real multi-line ASCII art — box-drawing cards, tree views, aligned heatmaps, bordered tables — by rendering each line as a StyledText with fontFamily set to a monospace stack. The SVG-image trade-off is that the text is not selectable.",
    package: "text-art",
    Component: MonospaceArtDemo,
    githubUrl: TEXT_ART_DOCS,
    sourceCode: `import { StyledText } from "hs-uix/common-components";

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const MonoBlock = ({ lines }) => (
  <Flex direction="column" gap="flush" align="start">
    {lines.map((line, i) => (
      <StyledText key={i} text={line || " "} fontFamily={MONO} fontSize={13} />
    ))}
  </Flex>
);

<MonoBlock lines={[
  "┌──────────────────────────┐",
  "│  GLOBEX     ●  Active   │",
  "│  Pipeline   $1.24M  ▲   │",
  "└──────────────────────────┘",
]} />`,
  },
];
