import React, { useState } from "react";
import { Button, Flex, Text, Tile, ToggleGroup } from "@hubspot/ui-extensions";
import { MonoText, progressBar, segmentedGauge, sparkline } from "./shared.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// Demo 3 — Interactive gauges & sparkline regenerator
// ═══════════════════════════════════════════════════════════════════════════

const randomSeries = (n = 16, min = 10, max = 100) =>
  Array.from({ length: n }, () =>
    Math.round(min + Math.random() * (max - min))
  );

export const InteractiveGaugesDemo = () => {
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
