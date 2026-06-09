import React, { useState } from "react";
import { Button, Divider, Flex, Text, Tile } from "@hubspot/ui-extensions";
import { REPS, journey, sparkline } from "./shared.jsx";

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

export const ClickableJourneyDemo = () => {
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
