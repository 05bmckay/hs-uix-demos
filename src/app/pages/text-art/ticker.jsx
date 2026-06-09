import React, { useEffect, useMemo, useState } from "react";
import { Button, Flex, Text, Tile } from "@hubspot/ui-extensions";
import { BRAILLE_SPINNER, DOTS_SPINNER, PULSE_SPINNER } from "./shared.jsx";

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

export const AnimatedTickerDemo = () => {
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
