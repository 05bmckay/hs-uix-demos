import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  DescriptionList,
  DescriptionListItem,
  Flex,
  Image,
  Input,
  StepperInput,
  Text,
  Tile,
} from "@hubspot/ui-extensions";
import { StyledText } from "hs-uix/common-components";
import { MONO_FAMILY } from "./shared.jsx";
import { NBSP } from "./monospace-art.jsx";
import { escapeDoomSvgText } from "./doom.jsx";

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

export const AsciiTetrisDemo = () => {
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
