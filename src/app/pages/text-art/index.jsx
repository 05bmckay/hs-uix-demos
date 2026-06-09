import { TEXT_ART_DOCS } from "./shared.jsx";
import { TextArtGalleryDemo } from "./gallery.jsx";
import { AnimatedTickerDemo } from "./ticker.jsx";
import { InteractiveGaugesDemo } from "./gauges.jsx";
import { MonospaceArtDemo } from "./monospace-art.jsx";
import { ClickableJourneyDemo } from "./journey.jsx";
import { DoomerDemo } from "./doom.jsx";
import { AsciiTetrisDemo } from "./tetris.jsx";

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
