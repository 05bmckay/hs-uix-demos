import React from "react";
import { Box, Divider, Flex, Text, Tile } from "@hubspot/ui-extensions";
import {
  KPI_SAMPLES,
  PIPELINE_STAGES,
  REPS,
  MonoText,
  SparkKPI,
  StatusGlyph,
  heatmap,
  journey,
  progressBar,
  segmentedGauge,
  sparkline,
  stars,
} from "./shared.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// Demo 1 — Text Art Gallery: a single page that shows every technique
// ═══════════════════════════════════════════════════════════════════════════

export const TextArtGalleryDemo = () => (
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
