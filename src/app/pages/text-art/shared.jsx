import React from "react";
import { Flex, Text, Tile } from "@hubspot/ui-extensions";
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

export const TEXT_ART_DOCS =
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
export const BRAILLE_SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
export const DOTS_SPINNER = ["⡿", "⣟", "⣯", "⣷", "⣾", "⣽", "⣻", "⢿"];
export const PULSE_SPINNER = ["◐", "◓", "◑", "◒"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Build a sparkline string from numeric data. Values are normalized into the
// 8 block characters above. NaN / non-numeric values render as a thin space.
export const sparkline = (values) => {
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
export const progressBar = (pct, width = 20) => {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
};

// Segmented gauge: ◖▰▰▰▱▱▱◗
export const segmentedGauge = (pct, segments = 10) => {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * segments);
  return (
    "◖" + "▰".repeat(filled) + "▱".repeat(segments - filled) + "◗"
  );
};

// Heatmap strip: each value becomes a shaded block.
export const heatmap = (values) => {
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
export const stars = (rating, max = 5) => {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(max - full);
};

// Journey rail. `steps` is an array of {state: "done" | "active" | "todo"}.
// Rendered as ●───●───◉───○ with em dashes between.
export const journey = (steps) => {
  const dot = (s) => (s === "done" ? "●" : s === "active" ? "◉" : "○");
  return steps.map(dot).join(" ─── ");
};

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

export const KPI_SAMPLES = [
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

export const PIPELINE_STAGES = [
  { name: "New",        count: 142, pct: 100 },
  { name: "Qualified",  count:  98, pct:  69 },
  { name: "Proposal",   count:  54, pct:  38 },
  { name: "Negotiation",count:  31, pct:  22 },
  { name: "Closed Won", count:  17, pct:  12 },
];

export const REPS = [
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
export const MONO_FAMILY =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

export const MonoText = ({ text, fontSize = 13, color, format }) => (
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
export const SparkKPI = ({ kpi }) => {
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
export const StatusGlyph = ({ glyph, label, hint }) => (
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
