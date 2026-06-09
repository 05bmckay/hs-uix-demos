import React, { useEffect, useMemo, useState } from "react";
import { Button, Flex, Image, Input, Text, Tile } from "@hubspot/ui-extensions";
import { MONO_FAMILY } from "./shared.jsx";
import {
  bytesToBase64,
  deflate,
  pngChunk,
  pngFilterImage,
  pngU16,
  pngU32,
} from "./apng.jsx";

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

export const escapeDoomSvgText = (text) =>
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

export const DoomerDemo = () => {
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
