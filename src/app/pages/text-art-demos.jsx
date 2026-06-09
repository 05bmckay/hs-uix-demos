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
import { StyledText } from "hs-uix/common-components";

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
// Demo — Pixel Doom (framebuffer baked to an animated PNG)
//
// A self-contained software raycaster renders a Doom-style scene into a full
// RGBA framebuffer — DDA-cast textured walls, a perspective-cast textured
// floor, distance fog, billboarded imp sprites, a first-person shotgun and
// dynamic muzzle-flash lighting. Twelve consecutive frames are then encoded,
// entirely in JS, into one animated PNG (acTL/fcTL/fdAT) that the host <img>
// animates natively — no iframe and no per-frame React repaint.
//
// readDoomRgbaFrame() prefers the runtime's getRgbaFramebuffer(); the older
// ASCII / indexed-SVG helpers remain as the fallback path for an external
// WASM port that only exposes an indexed-color framebuffer + palette.
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
  const width = DOOM_SOURCE_W; // 320
  const height = DOOM_SOURCE_H; // 200
  // Direct RGBA render target — full per-pixel color & smooth shading, instead
  // of snapping to a ~23-slot indexed palette. We also keep a coarse indexed
  // framebuffer + palette so the real-WASM bridge contract (getFramebuffer)
  // still resolves; readDoomRgbaFrame prefers getRgbaFramebuffer() when present.
  const rgba = new Uint8Array(width * height * 4);
  const framebuffer = new Uint8Array(width * height);
  const depthBuf = new Float32Array(width);
  const palette = DOOM_FALLBACK_PALETTE.map((color) => color.slice());

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
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= mapW || iy < 0 || iy >= mapH) return true;
    return map[iy][ix] === "#";
  };

  // ── low-level pixel + math helpers ───────────────────────────────────────
  const clamp8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
  const px = (x, y, r, g, b) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = (y * width + x) * 4;
    rgba[i] = clamp8(r);
    rgba[i + 1] = clamp8(g);
    rgba[i + 2] = clamp8(b);
    rgba[i + 3] = 255;
  };
  const blend = (x, y, r, g, b, a) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = (y * width + x) * 4;
    rgba[i] = clamp8(rgba[i] * (1 - a) + r * a);
    rgba[i + 1] = clamp8(rgba[i + 1] * (1 - a) + g * a);
    rgba[i + 2] = clamp8(rgba[i + 2] * (1 - a) + b * a);
    rgba[i + 3] = 255;
  };
  // Cheap deterministic value noise in [0,1].
  const noise = (x, y) => {
    let n = (x * 374761393 + y * 668265263) | 0;
    n = (Math.imul(n ^ (n >> 13), 1274126177)) | 0;
    return ((n ^ (n >> 16)) & 0xff) / 255;
  };

  // ── procedural textures (return [r,g,b]) ─────────────────────────────────
  // Stone/brick wall, lightly varied. `cell` (the map tile) shifts the brick
  // palette so different walls feel like different surfaces.
  const sampleWall = (u, v, cell) => {
    const TX = 24;
    const TY = 40;
    const tu = u * TX;
    const tv = v * TY;
    const brickH = 7;
    const brickW = 12;
    const rowi = Math.floor(tv / brickH);
    const off = rowi % 2 ? brickW / 2 : 0;
    const bx = (((tu + off) % brickW) + brickW) % brickW;
    const by = tv % brickH;
    const mortar = bx < 1.1 || by < 1.0;
    // Per-brick (not per-texel) variation keeps large flat runs so DEFLATE
    // stays compact; fine per-pixel noise would wreck the compression ratio.
    const n2 = noise(rowi * 3 + 11, Math.floor((tu + off) / brickW) * 7);
    if (mortar) return [34, 30, 27];
    // Some walls read as cracked tech panels (greener/greyer).
    const tech = (cell * 5 + 3) % 7 === 0;
    if (tech) {
      const base = 74 + n2 * 30;
      const panel = by > brickH - 2 || bx > brickW - 2 ? -18 : 0;
      return [base * 0.78 + panel, base * 0.92 + panel, base * 0.7 + panel];
    }
    const shade = n2 * 40;
    return [100 + shade, 68 + shade * 0.7, 46 + shade * 0.45];
  };

  // Stone floor tiles with grout lines. Variation is per-tile (coarse) so the
  // perspective floor cast produces long identical runs that compress well.
  const sampleFloor = (fx, fy) => {
    const gx = fx - Math.floor(fx);
    const gy = fy - Math.floor(fy);
    const grout = gx < 0.05 || gy < 0.05 || gx > 0.95 || gy > 0.95;
    if (grout) return [26, 22, 19];
    const tile = (Math.floor(fx) + Math.floor(fy)) & 1;
    const n = noise(Math.floor(fx * 2), Math.floor(fy * 2));
    const base = tile ? [92, 66, 44] : [74, 54, 38];
    return [base[0] + n * 16 - 8, base[1] + n * 12 - 6, base[2] + n * 8 - 4];
  };

  // ── fog / lighting ───────────────────────────────────────────────────────
  const FOG = [14, 13, 20]; // far color (dusky)
  const fogMix = (c, dist, maxd) => {
    let f = 1 - dist / maxd;
    if (f < 0) f = 0;
    if (f > 1) f = 1;
    f = f * f * (3 - 2 * f); // smoothstep
    return [
      c[0] * f + FOG[0] * (1 - f),
      c[1] * f + FOG[1] * (1 - f),
      c[2] * f + FOG[2] * (1 - f),
    ];
  };
  // Additive muzzle-flash light: bright near the player, decays with distance.
  const flashLight = (dist) => {
    if (state.flash <= 0) return 0;
    const strength = (state.flash / 5) * 0.9;
    const fall = Math.max(0, 1 - dist / 6.5);
    return strength * fall * fall;
  };

  // ── sky ──────────────────────────────────────────────────────────────────
  const drawSky = (horizon) => {
    for (let y = 0; y < Math.min(height, horizon + 2); y++) {
      const t = horizon > 0 ? y / horizon : 0;
      // deep indigo at the top easing to a warm hellish band at the horizon
      const r = 16 + t * t * 92;
      const g = 18 + t * 34;
      const b = 44 + t * 18;
      for (let x = 0; x < width; x++) {
        let rr = r;
        let gg = g;
        let bb = b;
        // sparse stars high up
        if (y < horizon * 0.6 && noise(x, y) > 0.987) {
          rr = gg = bb = 150 + noise(x + 1, y) * 90;
        }
        // soft moon glow
        const dx = x - width * 0.62;
        const dy = y - horizon * 0.32;
        const m = dx * dx * 0.6 + dy * dy;
        if (m < 320) {
          const k = (1 - m / 320) * 0.8;
          rr += 90 * k;
          gg += 86 * k;
          bb += 70 * k;
        }
        px(x, y, rr, gg, bb);
      }
    }
  };

  // ── glyph helpers for the title / death screens (RGB) ────────────────────
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
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
  };
  const drawWord = (text, x, y, scale, color, shadow) => {
    let cursor = x;
    [...text].forEach((ch) => {
      if (ch === " ") {
        cursor += scale * 4;
        return;
      }
      const glyph = glyphs[ch];
      if (!glyph) {
        cursor += scale * 6; // keep spacing for unknown glyphs so text never jams
        return;
      }
      glyph.forEach((rowStr, gy) => {
        [...rowStr].forEach((bit, gx) => {
          if (bit !== "1") return;
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              if (shadow) px(cursor + gx * scale + sx + (scale >> 1), y + gy * scale + sy + (scale >> 1), shadow[0], shadow[1], shadow[2]);
            }
          }
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) px(cursor + gx * scale + sx, y + gy * scale + sy, color[0], color[1], color[2]);
          }
        });
      });
      cursor += scale * 6;
    });
  };

  const drawTitle = () => {
    const horizon = Math.floor(height * 0.62);
    drawSky(horizon);
    // jagged hell skyline
    for (let x = 0; x < width; x++) {
      const h = 18 + Math.floor((Math.sin(x * 0.06) + Math.sin(x * 0.013 + 1.3)) * 14 + (noise(x, 3) * 16));
      for (let y = horizon - h; y < horizon; y++) px(x, y, 22 + noise(x, y) * 16, 14, 18);
    }
    // smouldering ground
    for (let y = horizon; y < height; y++) {
      const t = (y - horizon) / (height - horizon);
      for (let x = 0; x < width; x++) {
        const ember = noise(x, y + state.titleTick) > 0.96 ? 1 : 0;
        px(x, y, 40 + t * 30 + ember * 120, 18 + t * 12 + ember * 50, 14 + t * 8);
      }
    }
    const flicker = 1 + Math.sin(state.titleTick * 0.4) * 0.06;
    drawWord("DOOM", 92, 44, 9, [Math.floor(196 * flicker), 40, 26], [40, 6, 4]);
    drawWord("PIXEL", 120, 116, 4, [232, 196, 90], [30, 18, 6]);
    if (Math.floor(state.titleTick / 8) % 2 === 0) drawWord("PRESS FIRE", 110, 150, 3, [236, 222, 120], [20, 16, 8]);
  };

  // ── the 3D scene (DDA raycaster) ─────────────────────────────────────────
  const FOV = 0.66; // camera-plane half-extent (~66° fov)

  const drawScene = () => {
    const horizon = Math.floor(height * 0.5 + Math.sin(state.bob) * 4);
    const dirX = Math.cos(state.angle);
    const dirY = Math.sin(state.angle);
    const planeX = -dirY * FOV;
    const planeY = dirX * FOV;

    drawSky(horizon);

    // Perspective-correct textured floor (cast per scanline below the horizon).
    const rayX0 = dirX - planeX;
    const rayY0 = dirY - planeY;
    const rayX1 = dirX + planeX;
    const rayY1 = dirY + planeY;
    for (let y = horizon + 1; y < height; y++) {
      const p = y - horizon;
      const rowDist = (0.5 * height) / p;
      const stepX = (rowDist * (rayX1 - rayX0)) / width;
      const stepY = (rowDist * (rayY1 - rayY0)) / width;
      let floorX = state.x + rowDist * rayX0;
      let floorY = state.y + rowDist * rayY0;
      const light = flashLight(rowDist);
      for (let x = 0; x < width; x++) {
        let c = sampleFloor(floorX, floorY);
        c = fogMix(c, rowDist, 13);
        if (light > 0) {
          c = [c[0] + 220 * light, c[1] + 150 * light, c[2] + 70 * light];
        }
        px(x, y, c[0], c[1], c[2]);
        floorX += stepX;
        floorY += stepY;
      }
    }

    // Walls via DDA — crisp grid-aligned hits and a stable texture coordinate.
    for (let x = 0; x < width; x++) {
      const cameraX = (2 * x) / width - 1;
      const rayDirX = dirX + planeX * cameraX;
      const rayDirY = dirY + planeY * cameraX;
      let mapX = Math.floor(state.x);
      let mapY = Math.floor(state.y);
      const deltaX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
      const deltaY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);
      let stepX;
      let stepY;
      let sideX;
      let sideY;
      if (rayDirX < 0) {
        stepX = -1;
        sideX = (state.x - mapX) * deltaX;
      } else {
        stepX = 1;
        sideX = (mapX + 1 - state.x) * deltaX;
      }
      if (rayDirY < 0) {
        stepY = -1;
        sideY = (state.y - mapY) * deltaY;
      } else {
        stepY = 1;
        sideY = (mapY + 1 - state.y) * deltaY;
      }
      let side = 0;
      let guard = 0;
      while (guard++ < 64) {
        if (sideX < sideY) {
          sideX += deltaX;
          mapX += stepX;
          side = 0;
        } else {
          sideY += deltaY;
          mapY += stepY;
          side = 1;
        }
        if (mapX < 0 || mapX >= mapW || mapY < 0 || mapY >= mapH || map[mapY][mapX] === "#") break;
      }
      const perpDist = side === 0 ? sideX - deltaX : sideY - deltaY;
      depthBuf[x] = perpDist;
      let wallX = side === 0 ? state.y + perpDist * rayDirY : state.x + perpDist * rayDirX;
      wallX -= Math.floor(wallX);

      const lineH = Math.floor(height / Math.max(0.0001, perpDist));
      let drawStart = Math.floor(horizon - lineH / 2);
      let drawEnd = Math.floor(horizon + lineH / 2);
      const top = Math.max(0, drawStart);
      const bottom = Math.min(height - 1, drawEnd);
      const cell = (mapX * 7 + mapY * 13) & 0xff;
      const sideShade = side === 1 ? 0.68 : 1; // N/S walls darker for fake light
      const light = flashLight(perpDist);

      for (let y = top; y <= bottom; y++) {
        const v = (y - drawStart) / lineH;
        let c = sampleWall(wallX, v, cell);
        c = [c[0] * sideShade, c[1] * sideShade, c[2] * sideShade];
        c = fogMix(c, perpDist, 13);
        if (light > 0) {
          c = [c[0] + 230 * light, c[1] + 158 * light, c[2] + 74 * light];
        }
        px(x, y, c[0], c[1], c[2]);
      }
    }
  };

  // ── enemy imps (billboarded sprites, depth-tested) ───────────────────────
  const drawEnemySprite = (enemy, transformX, transformY) => {
    const spriteH = Math.abs(Math.floor(height / transformY));
    const spriteW = Math.floor(spriteH * 0.62);
    const horizon = Math.floor(height * 0.5 + Math.sin(state.bob) * 4);
    const screenX = Math.floor((width / 2) * (1 + transformX / transformY));
    const bobY = Math.sin(state.bob + enemy.phase) * spriteH * 0.02;
    // Must floor: a fractional y makes px()'s typed-array index fractional,
    // which silently drops the write (this once made imps invisible).
    const top = Math.floor(horizon + spriteH / 2 - spriteH + bobY);
    const left = screenX - (spriteW >> 1);
    const fog = Math.max(0.25, 1 - transformY / 12);

    for (let sx = 0; sx < spriteW; sx++) {
      const x = left + sx;
      if (x < 0 || x >= width) continue;
      if (transformY >= depthBuf[x]) continue;
      const nx = (sx / spriteW - 0.5) * 2; // -1..1
      for (let sy = 0; sy < spriteH; sy++) {
        const y = top + sy;
        if (y < 0 || y >= height) continue;
        const ny = sy / spriteH; // 0 top .. 1 bottom
        let c = null;

        const head = (nx * nx) / 0.32 + ((ny - 0.16) * (ny - 0.16)) / 0.022 < 1;
        const hornL = ny < 0.14 && Math.abs(nx + 0.34 - ny * 0.6) < 0.07;
        const hornR = ny < 0.14 && Math.abs(nx - 0.34 + ny * 0.6) < 0.07;
        const torso = Math.abs(nx) < 0.5 * (1 - Math.max(0, ny - 0.4) * 0.8) && ny > 0.3 && ny < 0.78;
        const arms = ny > 0.34 && ny < 0.64 && (Math.abs(nx - 0.56) < 0.13 || Math.abs(nx + 0.56) < 0.13);
        const legs = ny >= 0.74 && ny < 0.98 && (Math.abs(nx - 0.2) < 0.15 || Math.abs(nx + 0.2) < 0.15);
        const eyes = head && ny > 0.13 && ny < 0.2 && (Math.abs(nx - 0.17) < 0.07 || Math.abs(nx + 0.17) < 0.07);
        const mouth = head && ny > 0.23 && ny < 0.27 && Math.abs(nx) < 0.16;

        const shadeN = noise(sx, sy) * 0.18 + 0.9;
        if (eyes) c = [255, 230, 80];
        else if (mouth) c = [120, 20, 10];
        else if (hornL || hornR) c = [150, 130, 110];
        else if (head) c = [120 * shadeN, 70 * shadeN, 58 * shadeN];
        else if (torso) c = [150 * shadeN, 52 * shadeN, 40 * shadeN];
        else if (arms || legs) c = [96 * shadeN, 44 * shadeN, 36 * shadeN];
        if (!c) continue;

        // dark rim + distance fog
        const rim = Math.abs(nx) > 0.5 || ny < 0.03 || ny > 0.95;
        if (rim && !eyes) c = [c[0] * 0.3, c[1] * 0.3, c[2] * 0.3];
        if (!eyes) c = [c[0] * fog, c[1] * fog, c[2] * fog];
        px(x, y, c[0], c[1], c[2]);
      }
    }
  };

  const drawEnemies = () => {
    const dirX = Math.cos(state.angle);
    const dirY = Math.sin(state.angle);
    const planeX = -dirY * FOV;
    const planeY = dirX * FOV;
    const invDet = 1 / (planeX * dirY - dirX * planeY);
    enemies
      .filter((e) => e.alive)
      .map((e) => {
        const relX = e.x - state.x;
        const relY = e.y - state.y;
        return {
          e,
          tx: invDet * (dirY * relX - dirX * relY),
          ty: invDet * (-planeY * relX + planeX * relY),
        };
      })
      .filter((s) => s.ty > 0.2)
      .sort((a, b) => b.ty - a.ty)
      .forEach((s) => drawEnemySprite(s.e, s.tx, s.ty));
  };

  // ── first-person shotgun ─────────────────────────────────────────────────
  const drawWeapon = () => {
    const bob = Math.sin(state.bob) * 4;
    const cx = Math.floor(width / 2 + Math.cos(state.bob * 0.5) * 3);
    const baseY = Math.floor(height * 0.74 + bob);
    const recoil = state.flash > 0 ? (5 - state.flash) * 3 : 0;
    const gy = baseY + recoil;

    // gloved hands / forearms
    for (let y = gy + 26; y < height; y++) {
      const t = (y - (gy + 26)) / Math.max(1, height - (gy + 26));
      const half = Math.floor(20 + t * 46);
      for (let x = cx - half; x <= cx + half; x++) {
        const edge = Math.abs(x - cx) > half - 6;
        const n = noise(x, y) * 18;
        px(x, y, (edge ? 70 : 120) + n, (edge ? 44 : 78) + n, (edge ? 36 : 60) + n);
      }
    }
    // wooden pump / receiver
    for (let y = gy + 8; y < gy + 30; y++) {
      const half = 16;
      for (let x = cx - half; x <= cx + half; x++) {
        const grain = noise(x, y * 3) * 26;
        px(x, y, 96 + grain, 58 + grain * 0.6, 30 + grain * 0.3);
      }
    }
    // twin steel barrels
    for (let y = gy - 34; y < gy + 12; y++) {
      for (const ox of [-7, 7]) {
        for (let dx = -5; dx <= 5; dx++) {
          const x = cx + ox + dx;
          const sheen = 1 - Math.abs(dx) / 6;
          const v = 60 + sheen * 110;
          px(x, y, v, v + 6, v + 14);
        }
      }
    }
    // muzzle + dark bore
    for (let y = gy - 38; y < gy - 32; y++) for (let dx = -13; dx <= 13; dx++) px(cx + dx, y, 30, 30, 36);

    // muzzle flash
    if (state.flash > 0) {
      const k = state.flash / 5;
      for (let y = gy - 70; y < gy - 28; y++) {
        for (let x = cx - 34; x <= cx + 34; x++) {
          const dx = (x - cx) / (30 * k + 6);
          const dy = (y - (gy - 46)) / (24 * k + 4);
          const r = dx * dx + dy * dy;
          if (r < 1) {
            const core = r < 0.35;
            blend(x, y, core ? 255 : 255, core ? 250 : 200, core ? 210 : 70, (1 - r) * (0.6 + k * 0.4));
          }
        }
      }
    }

    // crosshair
    const chx = Math.floor(width / 2);
    const chy = Math.floor(height * 0.5);
    for (let d = -5; d <= 5; d++) {
      if (Math.abs(d) > 1) {
        px(chx + d, chy, 230, 230, 200);
        px(chx, chy + d, 230, 230, 200);
      }
    }
  };

  const drawDamageOverlay = () => {
    if (state.hurtFlash > 0) {
      const a = (state.hurtFlash / 5) * 0.45;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const edge = Math.max(Math.abs(x - width / 2) / (width / 2), Math.abs(y - height / 2) / (height / 2));
          if (edge > 0.5) blend(x, y, 180, 20, 16, a * (edge - 0.5) * 2);
        }
      }
      state.hurtFlash--;
    }
    if (state.mode === "dead") {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) blend(x, y, 120, 10, 6, 0.55);
      }
      drawWord("DIED", 108, 70, 9, [210, 40, 28], [30, 4, 4]);
      drawWord("PRESS FIRE", 110, 150, 3, [236, 222, 120], [20, 16, 8]);
    }
  };

  const draw = () => {
    if (state.mode === "title") {
      drawTitle();
      return;
    }
    drawScene();
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
      if (forward > 0.2 && forward < bestForward && side < Math.max(0.3, forward * 0.12)) {
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
    getRgbaFramebuffer: () => ({ data: rgba, width, height }),
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
        if (state.flash > 0) state.flash--;
        draw();
        return;
      }
      if (state.mode === "dead") {
        if (state.flash > 0) state.flash--;
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
      if (state.flash > 0) state.flash--;

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

// ═══════════════════════════════════════════════════════════════════════════
// Pure-JS APNG encoder (CRC32 + Adler32 + DEFLATE + PNG/APNG chunks)
//
// The viewport used to be repainted as a fresh SVG ~10×/second, forcing React
// to diff a new <Image> every frame. Instead we now bake N consecutive Doom
// frames into a single animated PNG (acTL / fcTL / fdAT) and hand it to one
// <Image> as a data URI. If the host <img> supports APNG it animates the loop
// natively — motion with no iframe and no per-frame React work; if it doesn't,
// it degrades to a crisp static first frame. The whole pipeline (real DEFLATE
// with fixed-Huffman + greedy LZ77, adaptive scanline filtering, CRCs) is
// validated against Node's zlib inflate, so the streams are spec-correct.
// ═══════════════════════════════════════════════════════════════════════════

const DOOM_APNG_W = 200; // encoded frame width  (320×200 source / 1.6)
const DOOM_APNG_H = 125; // encoded frame height
const DOOM_APNG_FRAMES = 12; // frames per baked loop
const DOOM_APNG_DELAY_DEN = 12; // frame delay denominator → ~12 fps loop
const DOOM_APNG_SCALE = 2; // <Image> upscale factor for the pixel art
// Quantize each channel to 32 levels. The retro banding reads as authentic
// Doom and roughly halves the encoded loop (fewer distinct bytes → better
// DEFLATE runs). 0 disables.
const DOOM_APNG_POSTERIZE = 8;
const doomQuant = (v) => {
  if (!DOOM_APNG_POSTERIZE) return v < 0 ? 0 : v > 255 ? 255 : v | 0;
  const q = Math.round(v / DOOM_APNG_POSTERIZE) * DOOM_APNG_POSTERIZE;
  return q > 255 ? 255 : q;
};

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (bytes, start = 0, end = bytes.length) => {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const adler32 = (bytes) => {
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
};

// DEFLATE bit writer — codes are packed LSB-first per RFC 1951.
class DeflateBitWriter {
  constructor() {
    this.bytes = [];
    this.cur = 0;
    this.nbits = 0;
  }
  writeBits(value, count) {
    for (let i = 0; i < count; i++) {
      this.cur |= ((value >> i) & 1) << this.nbits;
      this.nbits++;
      if (this.nbits === 8) {
        this.bytes.push(this.cur);
        this.cur = 0;
        this.nbits = 0;
      }
    }
  }
  // Huffman codes are emitted most-significant-bit first.
  writeHuff(code, len) {
    for (let i = len - 1; i >= 0; i--) this.writeBits((code >> i) & 1, 1);
  }
  finish() {
    if (this.nbits > 0) {
      this.bytes.push(this.cur);
      this.cur = 0;
      this.nbits = 0;
    }
    return this.bytes;
  }
}

// Fixed Huffman literal/length code (RFC 1951 §3.2.6).
const fixedLitCode = (sym) => {
  if (sym <= 143) return { code: 0x30 + sym, len: 8 };
  if (sym <= 255) return { code: 0x190 + (sym - 144), len: 9 };
  if (sym <= 279) return { code: 0x000 + (sym - 256), len: 7 };
  return { code: 0xc0 + (sym - 280), len: 8 };
};

const DEFLATE_LEN_BASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
const DEFLATE_LEN_EXTRA = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
const DEFLATE_DIST_BASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
const DEFLATE_DIST_EXTRA = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

const deflateLenSym = (len) => {
  for (let i = DEFLATE_LEN_BASE.length - 1; i >= 0; i--) if (len >= DEFLATE_LEN_BASE[i]) return i;
  return 0;
};
const deflateDistSym = (dist) => {
  for (let i = DEFLATE_DIST_BASE.length - 1; i >= 0; i--) if (dist >= DEFLATE_DIST_BASE[i]) return i;
  return 0;
};

// Single fixed-Huffman block with greedy LZ77 matching, wrapped in a zlib
// stream. Validated to round-trip through Node's zlib.inflateSync.
const deflate = (data) => {
  const bw = new DeflateBitWriter();
  bw.writeBits(1, 1); // BFINAL = 1
  bw.writeBits(1, 2); // BTYPE = 01 (fixed Huffman)

  const n = data.length;
  const WSIZE = 32768;
  const MIN_MATCH = 3;
  const MAX_MATCH = 258;
  const head = new Int32Array(65536).fill(-1);
  const prev = new Int32Array(Math.max(1, n)).fill(-1);
  const hash = (i) => ((data[i] << 10) ^ (data[i + 1] << 5) ^ data[i + 2]) & 0xffff;

  const emitLiteral = (b) => {
    const { code, len } = fixedLitCode(b);
    bw.writeHuff(code, len);
  };
  const emitMatch = (length, dist) => {
    const ls = deflateLenSym(length);
    const lit = fixedLitCode(257 + ls); // length symbols are 257..285
    bw.writeHuff(lit.code, lit.len);
    bw.writeBits(length - DEFLATE_LEN_BASE[ls], DEFLATE_LEN_EXTRA[ls]);
    const ds = deflateDistSym(dist);
    bw.writeHuff(ds, 5); // fixed-Huffman distance codes are 5-bit, MSB-first
    bw.writeBits(dist - DEFLATE_DIST_BASE[ds], DEFLATE_DIST_EXTRA[ds]);
  };

  let i = 0;
  while (i < n) {
    let bestLen = 0;
    let bestDist = 0;
    if (i + MIN_MATCH <= n) {
      const h = hash(i);
      let j = head[h];
      let chain = 0;
      const maxLen = Math.min(MAX_MATCH, n - i);
      while (j >= 0 && i - j <= WSIZE && chain < 64) {
        if (data[j + bestLen] === data[i + bestLen]) {
          let l = 0;
          while (l < maxLen && data[j + l] === data[i + l]) l++;
          if (l > bestLen) {
            bestLen = l;
            bestDist = i - j;
            if (l >= maxLen) break;
          }
        }
        j = prev[j];
        chain++;
      }
    }
    if (bestLen >= MIN_MATCH) {
      emitMatch(bestLen, bestDist);
      const end = i + bestLen;
      while (i < end) {
        if (i + MIN_MATCH <= n) {
          const h = hash(i);
          prev[i] = head[h];
          head[h] = i;
        }
        i++;
      }
    } else {
      emitLiteral(data[i]);
      if (i + MIN_MATCH <= n) {
        const h = hash(i);
        prev[i] = head[h];
        head[h] = i;
      }
      i++;
    }
  }
  const eob = fixedLitCode(256);
  bw.writeHuff(eob.code, eob.len);

  const compressed = bw.finish();
  const out = new Uint8Array(2 + compressed.length + 4);
  out[0] = 0x78; // zlib CMF
  out[1] = 0x01; // zlib FLG
  out.set(compressed, 2);
  const ad = adler32(data);
  const o = 2 + compressed.length;
  out[o] = (ad >>> 24) & 0xff;
  out[o + 1] = (ad >>> 16) & 0xff;
  out[o + 2] = (ad >>> 8) & 0xff;
  out[o + 3] = ad & 0xff;
  return out;
};

// Paeth predictor + adaptive PNG scanline filtering (RGBA, 4 bytes/pixel).
const pngPaeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

const pngFilterImage = (rgba, w, h) => {
  const bpp = 4;
  const stride = w * bpp;
  const out = new Uint8Array(h * (stride + 1));
  const tmp = new Uint8Array(stride);
  const best = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const row = y * stride;
    const prevRow = row - stride;
    let bestType = 0;
    let bestScore = Infinity;
    // Try None/Sub/Up/Average/Paeth, keep the lowest absolute-deviation row.
    for (let type = 0; type < 5; type++) {
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const cur = rgba[row + x];
        const a = x >= bpp ? rgba[row + x - bpp] : 0;
        const b = y > 0 ? rgba[prevRow + x] : 0;
        const c = y > 0 && x >= bpp ? rgba[prevRow + x - bpp] : 0;
        let v;
        if (type === 0) v = cur;
        else if (type === 1) v = (cur - a) & 0xff;
        else if (type === 2) v = (cur - b) & 0xff;
        else if (type === 3) v = (cur - ((a + b) >> 1)) & 0xff;
        else v = (cur - pngPaeth(a, b, c)) & 0xff;
        tmp[x] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        bestType = type;
        best.set(tmp);
      }
    }
    out[y * (stride + 1)] = bestType;
    out.set(best, y * (stride + 1) + 1);
  }
  return out;
};

const pngU32 = (v) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
const pngU16 = (v) => [(v >>> 8) & 255, v & 255];

const pngChunk = (type, data) => {
  const body = new Uint8Array(4 + data.length);
  body[0] = type.charCodeAt(0);
  body[1] = type.charCodeAt(1);
  body[2] = type.charCodeAt(2);
  body[3] = type.charCodeAt(3);
  body.set(data, 4);
  const crc = crc32(body);
  const out = new Uint8Array(4 + body.length + 4);
  out.set(pngU32(data.length), 0);
  out.set(body, 4);
  out.set(pngU32(crc), 4 + body.length);
  return out;
};

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const bytesToBase64 = (bytes) => {
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64_CHARS[(n >> 18) & 63] + B64_CHARS[(n >> 12) & 63] + B64_CHARS[(n >> 6) & 63] + B64_CHARS[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += B64_CHARS[(n >> 18) & 63] + B64_CHARS[(n >> 12) & 63] + "==";
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64_CHARS[(n >> 18) & 63] + B64_CHARS[(n >> 12) & 63] + B64_CHARS[(n >> 6) & 63] + "=";
  }
  return out;
};

// Assemble RGBA frames into one APNG and return it as an <Image>-ready src.
const encodeDoomApng = (frames, w, h, delayDen) => {
  const parts = [];
  parts.push(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])); // PNG signature

  const ihdr = new Uint8Array(13);
  ihdr.set(pngU32(w), 0);
  ihdr.set(pngU32(h), 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6 = RGBA
  parts.push(pngChunk("IHDR", ihdr));

  const actl = new Uint8Array(8);
  actl.set(pngU32(frames.length), 0); // num_frames
  actl.set(pngU32(0), 4); // num_plays (0 = infinite)
  parts.push(pngChunk("acTL", actl));

  let seq = 0;
  frames.forEach((rgba, idx) => {
    const fctl = new Uint8Array(26);
    fctl.set(pngU32(seq++), 0); // sequence_number
    fctl.set(pngU32(w), 4);
    fctl.set(pngU32(h), 8);
    fctl.set(pngU32(0), 12); // x_offset
    fctl.set(pngU32(0), 16); // y_offset
    fctl.set(pngU16(1), 20); // delay_num
    fctl.set(pngU16(delayDen), 22); // delay_den
    fctl[24] = 0; // dispose_op: none
    fctl[25] = 0; // blend_op: source
    parts.push(pngChunk("fcTL", fctl));

    const z = deflate(pngFilterImage(rgba, w, h));
    if (idx === 0) {
      parts.push(pngChunk("IDAT", z));
    } else {
      const fdat = new Uint8Array(4 + z.length);
      fdat.set(pngU32(seq++), 0); // sequence_number
      fdat.set(z, 4);
      parts.push(pngChunk("fdAT", fdat));
    }
  });

  parts.push(pngChunk("IEND", new Uint8Array(0)));

  let total = 0;
  parts.forEach((p) => (total += p.length));
  const png = new Uint8Array(total);
  let off = 0;
  parts.forEach((p) => {
    png.set(p, off);
    off += p.length;
  });

  return {
    src: `data:image/png;base64,${bytesToBase64(png)}`,
    width: w * DOOM_APNG_SCALE,
    height: h * DOOM_APNG_SCALE,
    bytes: png.length,
  };
};

// Downsample the live indexed framebuffer into one RGBA frame (alpha 255),
// averaging a small source rectangle per destination pixel.
const readDoomRgbaFrame = (targetW, targetH) => {
  const out = new Uint8Array(targetW * targetH * 4);

  // Preferred path: the demo runtime renders a full-color RGBA framebuffer, so
  // we box-filter it down (averaging all 4 channels) for crisp anti-aliasing.
  const doom = getDoomRuntime();
  if (doom && typeof doom.getRgbaFramebuffer === "function") {
    const src = doom.getRgbaFramebuffer();
    const cellW = src.width / targetW;
    const cellH = src.height / targetH;
    for (let y = 0; y < targetH; y++) {
      const sy0 = Math.floor(y * cellH);
      const sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * cellH));
      for (let x = 0; x < targetW; x++) {
        const sx0 = Math.floor(x * cellW);
        const sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * cellW));
        let rT = 0;
        let gT = 0;
        let bT = 0;
        let n = 0;
        for (let sy = sy0; sy < sy1; sy++) {
          const rowOff = sy * src.width * 4;
          for (let sx = sx0; sx < sx1; sx++) {
            const i = rowOff + sx * 4;
            rT += src.data[i];
            gT += src.data[i + 1];
            bT += src.data[i + 2];
            n++;
          }
        }
        const o = (y * targetW + x) * 4;
        out[o] = doomQuant(rT / n);
        out[o + 1] = doomQuant(gT / n);
        out[o + 2] = doomQuant(bT / n);
        out[o + 3] = 255;
      }
    }
    return out;
  }

  // Fallback: an external WASM port exposing an indexed framebuffer + palette.
  const fb = readDoomFramebuffer();
  if (!fb) {
    for (let p = 0; p < targetW * targetH; p++) {
      out[p * 4] = 8;
      out[p * 4 + 1] = 10;
      out[p * 4 + 2] = 12;
      out[p * 4 + 3] = 255;
    }
    return out;
  }
  const cellW = fb.width / targetW;
  const cellH = fb.height / targetH;
  for (let y = 0; y < targetH; y++) {
    const sy0 = Math.floor(y * cellH);
    const sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * cellH));
    const syStep = Math.max(1, Math.floor((sy1 - sy0) / 3));
    for (let x = 0; x < targetW; x++) {
      const sx0 = Math.floor(x * cellW);
      const sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * cellW));
      const sxStep = Math.max(1, Math.floor((sx1 - sx0) / 3));
      let rTotal = 0;
      let gTotal = 0;
      let bTotal = 0;
      let samples = 0;
      for (let sy = sy0; sy < sy1; sy += syStep) {
        const rowOff = sy * fb.width;
        for (let sx = sx0; sx < sx1; sx += sxStep) {
          const [r, g, b] = doomPaletteRgb(fb.data[rowOff + sx] || 0, fb.palette);
          rTotal += r;
          gTotal += g;
          bTotal += b;
          samples++;
        }
      }
      const o = (y * targetW + x) * 4;
      const denom = Math.max(1, samples);
      out[o] = doomQuant(rTotal / denom);
      out[o + 1] = doomQuant(gTotal / denom);
      out[o + 2] = doomQuant(bTotal / denom);
      out[o + 3] = 255;
    }
  }
  return out;
};

// Tick the runtime DOOM_APNG_FRAMES times, snapshotting each frame, then bake
// the loop into one APNG. `press`/`holdFrames` let an input hold keys for the
// first few ticks so a button tap reads as a short, natural movement.
const bakeDoomApngLoop = ({ press = null, holdFrames = 0 } = {}) => {
  if (press) press.forEach((key) => sendDoomKey(key, true));
  const frames = [];
  for (let f = 0; f < DOOM_APNG_FRAMES; f++) {
    if (press && f === holdFrames) press.forEach((key) => sendDoomKey(key, false));
    advanceDoomRuntime();
    frames.push(readDoomRgbaFrame(DOOM_APNG_W, DOOM_APNG_H));
  }
  if (press && holdFrames >= DOOM_APNG_FRAMES) press.forEach((key) => sendDoomKey(key, false));
  return encodeDoomApng(frames, DOOM_APNG_W, DOOM_APNG_H, DOOM_APNG_DELAY_DEN);
};

const DoomerDemo = () => {
  const [hp, setHp] = useState(100);
  const [armor, setArmor] = useState(60);
  const [ammo, setAmmo] = useState(50);
  const [commandInput, setCommandInput] = useState("");
  const [commandCursor, setCommandCursor] = useState(0);
  const [log, setLog] = useState(["Connected to Doom framebuffer bridge."]);
  // One baked APNG loop — the browser animates its 12 frames natively, so there
  // is no per-frame React work between bakes.
  const [viewport, setViewport] = useState(() => bakeDoomApngLoop());

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

  // Re-bake a fresh animated loop from the live framebuffer and swap the
  // <Image> src. `press`/`holdFrames` let a button tap hold its keys for the
  // first few of the 12 ticks so the motion reads as a short, natural step.
  const rebake = (opts) => {
    setViewport(bakeDoomApngLoop(opts));
    syncDoomStatus();
  };

  useEffect(() => {
    syncDoomStatus();
    // Low-frequency ambient refresh keeps idle motion (enemies, title pulse)
    // advancing; the smooth 12 fps animation runs inside the APNG, not React.
    const id = setInterval(() => rebake(), 1500);
    return () => clearInterval(id);
  }, []);

  const tapInput = (keys, message, holdFrames = 3) => {
    rebake({ press: keys, holdFrames });
    if (message) setLog((l) => [message, ...l].slice(0, 6));
  };

  const shoot = () => {
    if (ammo === 0) {
      setLog((l) => ["*click* — out of ammo.", ...l].slice(0, 6));
      return;
    }
    setAmmo((a) => Math.max(0, a - 1));
    tapInput(["Control"], "CTRL fire event forwarded to Doom.", 1);
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
    rebake();
    setHp(100);
    setArmor(60);
    setAmmo(50);
    setLog(["Respawned / reset requested on the Doom WASM port."]);
  };

  const hudLine =
    `HP ${doomBar(hp, 100, 10)} ${String(hp).padStart(3, " ")}` +
    `   AMMO ${String(ammo).padStart(2, " ")}` +
    `   ARMOR ${doomBar(armor, 100, 10)} ${String(armor).padStart(3, " ")}`;

  const hudSvg = useMemo(
    () => makeDoomHudSvg(hudLine),
    [hudLine],
  );

  return (
    <Flex direction="column" gap="md">
      <Tile>
        <Flex direction="column" gap="flush">
          <Text format={{ fontWeight: "demibold" }}>
            Pixel Doom — framebuffer baked to an animated PNG
          </Text>
          <Text variant="microcopy">
            {DOOM_APNG_FRAMES} full-color {DOOM_APNG_W}×{DOOM_APNG_H} frames are
            encoded — in pure JS — as one animated PNG (acTL / fcTL / fdAT) and
            handed to a single &lt;Image&gt;. If the host supports APNG it
            animates the loop natively; otherwise it degrades to a static first
            frame. Motion with no iframe and no per-frame React repaint
            ({(viewport.bytes / 1024).toFixed(1)} KB / loop). The HUD stays a
            separate stable SVG so counters do not flicker.
          </Text>
        </Flex>
      </Tile>

      {/* Viewport: one baked APNG loop animated natively by the host <img>. */}
      <Tile>
        <Flex direction="column" gap="flush" align="start">
          <Image
            src={viewport.src}
            width={viewport.width}
            height={viewport.height}
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
          <Text format={{ fontWeight: "demibold" }}>How the APNG viewport works</Text>
          <Text variant="microcopy">
            • bakeDoomApngLoop() ticks the runtime Doom framebuffer
            (e.g. doom-wasm / chocolate-doom-wasm globals) {DOOM_APNG_FRAMES}×,
            snapshotting each frame as downsampled RGBA.
          </Text>
          <Text variant="microcopy">
            • Those frames are encoded — entirely in JS — into one animated PNG:
            real DEFLATE (fixed-Huffman + greedy LZ77), adaptive scanline
            filtering, CRC32/Adler32, acTL/fcTL/fdAT chunks, base64 data URI.
          </Text>
          <Text variant="microcopy">
            • The D-pad onClicks forward Doom keyboard events (W/A/S/D,
            arrow keys, ctrl=fire), held for the first few ticks of the next
            bake so a tap reads as one short step.
          </Text>
          <Text variant="microcopy">
            • No per-frame React work: the host &lt;img&gt; animates the 12-frame
            loop natively. A slow 1.5 s interval re-bakes for ambient motion;
            inputs re-bake on demand. The HUD is a separate memoized SVG.
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
    name: "Pixel Doom (animated PNG)",
    description:
      "A software-rendered Doom-style raycaster — textured brick/tech walls, a perspective-cast floor, distance fog, billboarded imps and dynamic muzzle-flash lighting — baked entirely in JS into one animated PNG (acTL/fcTL/fdAT) and handed to a single <Image>. The host <img> animates the loop natively (no iframe, no per-frame React work) and degrades to a static frame if APNG is unsupported. The D-pad re-bakes the loop, forwarding W/A/S/D, arrow, and ctrl/fire events to the framebuffer.",
    package: "text-art",
    Component: DoomerDemo,
    githubUrl: TEXT_ART_DOCS,
    sourceCode: `// Tick the framebuffer 12x, snapshot each as RGBA, then bake one
// animated PNG (real DEFLATE + adaptive PNG filtering, all in JS).
const viewport = bakeDoomApngLoop();      // -> { src: data:image/png;base64,..., width, height }
const hudSvg = makeDoomHudSvg(hudLine);

<Flex direction="column" gap="flush" align="start">
  <Image src={viewport.src} width={viewport.width} height={viewport.height} />
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
