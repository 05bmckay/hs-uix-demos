import React, { useMemo, useState } from "react";
import { Button, Divider, Flex, Link, Text, Tile } from "@hubspot/ui-extensions";
import { StyledText } from "hs-uix/common-components";
import { MONO_FAMILY } from "./shared.jsx";

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
export const NBSP = "\u00A0";

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

export const MonospaceArtDemo = () => {
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
