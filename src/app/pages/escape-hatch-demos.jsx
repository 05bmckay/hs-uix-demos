import React, { useMemo, useState } from "react";
import { Button, Flex, Image, Tag, Text } from "@hubspot/ui-extensions";

// ═══════════════════════════════════════════════════════════════════════════
// Rendering "escape hatches" — coercing an allowed primitive into rendering
// arbitrary visual content, inside the sandbox. The known one is
// SVG-via-<Image>. These are NON-SVG alternatives:
//   1. Pure-JS PNG  -> <Image>  (arbitrary raster, no canvas/DOM)
//   2. Pure-JS APNG -> <Image>  (animation without an iframe)
//
// (A braille/text bitmap was tried and dropped: <Text> is proportional and has
//  no fontFamily, so multi-line cells can't align without StyledText — which is
//  itself the SVG-via-Image hack. So text bitmaps aren't a non-SVG hatch.)
// ═══════════════════════════════════════════════════════════════════════════

// ── Byte / checksum helpers ────────────────────────────────────────────────
const u32 = (n) => new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);

const concat = (segments) => {
  let total = 0;
  for (const s of segments) total += s.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const s of segments) {
    out.set(s, o);
    o += s.length;
  }
  return out;
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

const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
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

// zlib stream using only stored (uncompressed) DEFLATE blocks — valid + simple.
const zlibStore = (data) => {
  const segments = [new Uint8Array([0x78, 0x01])];
  let pos = 0;
  const MAX = 65535;
  do {
    const len = Math.min(MAX, data.length - pos);
    const final = pos + len >= data.length ? 1 : 0;
    segments.push(new Uint8Array([final, len & 0xff, (len >>> 8) & 0xff, ~len & 0xff, (~len >>> 8) & 0xff]));
    segments.push(data.subarray(pos, pos + len));
    pos += len;
  } while (pos < data.length);
  segments.push(u32(adler32(data)));
  return concat(segments);
};

const chunk = (type, data) => {
  const body = new Uint8Array(4 + data.length);
  for (let i = 0; i < 4; i++) body[i] = type.charCodeAt(i);
  body.set(data, 4);
  return concat([u32(data.length), body, u32(crc32(body))]);
};

const PNG_SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const ihdrChunk = (w, h) => {
  const ihdr = new Uint8Array(13);
  ihdr.set(u32(w), 0);
  ihdr.set(u32(h), 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return chunk("IHDR", ihdr);
};

// Prepend the per-scanline filter byte (0 = none) the PNG format requires.
const filterRows = (w, h, rgba) => {
  const stride = 1 + w * 4;
  const raw = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0;
    raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * stride + 1);
  }
  return raw;
};

const encodePNG = (w, h, rgba) =>
  concat([
    PNG_SIG,
    ihdrChunk(w, h),
    chunk("IDAT", zlibStore(filterRows(w, h, rgba))),
    chunk("IEND", new Uint8Array(0)),
  ]);

// Animated PNG: acTL + per-frame fcTL; frame 0 is an IDAT, the rest are fdAT.
const encodeAPNG = (w, h, frames, delayNum, delayDen) => {
  const segments = [PNG_SIG, ihdrChunk(w, h)];

  const actl = new Uint8Array(8);
  actl.set(u32(frames.length), 0);
  actl.set(u32(0), 4); // num_plays: 0 = loop forever
  segments.push(chunk("acTL", actl));

  let seq = 0;
  const fctl = (seqNum) => {
    const d = new Uint8Array(26);
    d.set(u32(seqNum), 0);
    d.set(u32(w), 4);
    d.set(u32(h), 8);
    // x/y offsets stay 0
    d[20] = (delayNum >> 8) & 0xff;
    d[21] = delayNum & 0xff;
    d[22] = (delayDen >> 8) & 0xff;
    d[23] = delayDen & 0xff;
    d[24] = 0; // dispose_op: none (each frame is full-size and opaque)
    d[25] = 0; // blend_op: source
    return d;
  };

  segments.push(chunk("fcTL", fctl(seq++)));
  segments.push(chunk("IDAT", zlibStore(filterRows(w, h, frames[0]))));

  for (let f = 1; f < frames.length; f++) {
    segments.push(chunk("fcTL", fctl(seq++)));
    const frameData = zlibStore(filterRows(w, h, frames[f]));
    const fd = new Uint8Array(4 + frameData.length);
    fd.set(u32(seq++), 0);
    fd.set(frameData, 4);
    segments.push(chunk("fdAT", fd));
  }

  segments.push(chunk("IEND", new Uint8Array(0)));
  return concat(segments);
};

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const toBase64 = (bytes) => {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 === undefined ? 0 : b1) >> 4)];
    out += b1 === undefined ? "=" : B64[((b1 & 15) << 2) | ((b2 === undefined ? 0 : b2) >> 6)];
    out += b2 === undefined ? "=" : B64[b2 & 63];
  }
  return out;
};

const pngUri = (w, h, rgba) => `data:image/png;base64,${toBase64(encodePNG(w, h, rgba))}`;
const apngUri = (w, h, frames, dn, dd) =>
  `data:image/png;base64,${toBase64(encodeAPNG(w, h, frames, dn, dd))}`;

// ── Procedural pixel generator ─────────────────────────────────────────────
const plasma = (w, h, t) => {
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v =
        Math.sin(x / 7 + t) +
        Math.sin(y / 9 - t) +
        Math.sin((x + y) / 11) +
        Math.sin(Math.sqrt((x - w / 2) ** 2 + (y - h / 2) ** 2) / 6 - t);
      rgba[i] = 128 + 110 * Math.sin(v);
      rgba[i + 1] = 128 + 110 * Math.sin(v + 2.094);
      rgba[i + 2] = 128 + 110 * Math.sin(v + 4.188);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
};

// ── Demo: static PNG raster ────────────────────────────────────────────────
const PngRasterDemo = () => {
  const [seed, setSeed] = useState(0);
  const W = 96;
  const H = 64;
  const { uri, kb } = useMemo(() => {
    const data = pngUri(W, H, plasma(W, H, seed));
    return { uri: data, kb: (data.length / 1024).toFixed(1) };
  }, [seed]);

  return (
    <Flex direction="column" gap="sm">
      <Tag>Escape hatch · raster</Tag>
      <Text format={{ fontWeight: "demibold" }}>Pure-JS PNG → &lt;Image&gt;</Text>
      <Text variant="microcopy">
        Raw RGBA bytes encoded to a real PNG in JS (CRC32 + Adler32 + stored
        DEFLATE), base64'd into a data URI. No canvas, no DOM, no SVG — arbitrary
        per-pixel raster color. URI size: {kb} KB.
      </Text>
      <Image src={uri} width={288} alt="Procedural PNG generated in the worker" />
      <Flex direction="row" gap="xs">
        <Button variant="secondary" onClick={() => setSeed((s) => s + 0.6)}>
          Regenerate
        </Button>
      </Flex>
    </Flex>
  );
};

// ── Demo: APNG animation ───────────────────────────────────────────────────
const ApngAnimationDemo = () => {
  const [nonce, setNonce] = useState(0);
  const W = 64;
  const H = 64;
  const FRAMES = 12;
  const { uri, kb } = useMemo(() => {
    const frames = [];
    for (let f = 0; f < FRAMES; f++) {
      frames.push(plasma(W, H, (f / FRAMES) * Math.PI * 2 + nonce));
    }
    const data = apngUri(W, H, frames, 1, 12); // ~12 fps
    return { uri: data, kb: (data.length / 1024).toFixed(1) };
  }, [nonce]);

  return (
    <Flex direction="column" gap="sm">
      <Tag>Escape hatch · animation</Tag>
      <Text format={{ fontWeight: "demibold" }}>Pure-JS APNG → &lt;Image&gt;</Text>
      <Text variant="microcopy">
        {FRAMES} RGBA frames encoded as an animated PNG (acTL/fcTL/fdAT). If the
        host &lt;img&gt; supports APNG it animates; otherwise it degrades to a
        static first frame. Motion with no iframe. URI size: {kb} KB.
      </Text>
      <Image src={uri} width={256} alt="Animated PNG generated in the worker" />
      <Flex direction="row" gap="xs">
        <Button variant="secondary" onClick={() => setNonce((n) => n + 0.5)}>
          New sequence
        </Button>
      </Flex>
    </Flex>
  );
};

// ── Demo: interactive PNG mosaic ───────────────────────────────────────────
// <Image> is whole-image clickable (onClick/href/overlay) but its event carries
// no coordinates — so region interactivity comes from tiling many small
// clickable <Image> cells, each its own PNG. Click granularity = cell.
const hsv = (h, s, v) => {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r;
  let g;
  let b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

const tileRgba = (size, hue, active) => {
  const [cr, cg, cb] = hsv(hue, 0.55, active ? 1 : 0.78);
  const rgba = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const border = active && (x < 2 || y < 2 || x >= size - 2 || y >= size - 2);
      rgba[i] = border ? 26 : cr;
      rgba[i + 1] = border ? 26 : cg;
      rgba[i + 2] = border ? 26 : cb;
      rgba[i + 3] = 255;
    }
  }
  return rgba;
};

const InteractivePngMosaicDemo = () => {
  const ROWS = 5;
  const COLS = 8;
  const SIZE = 22;
  const [active, setActive] = useState({});
  const [last, setLast] = useState(null);

  const toggle = (r, c) => {
    const key = `${r}-${c}`;
    setActive((a) => ({ ...a, [key]: !a[key] }));
    setLast({ cell: key, at: new Date().toLocaleTimeString() });
  };

  return (
    <Flex direction="column" gap="sm">
      <Tag>Escape hatch · interactive raster</Tag>
      <Text format={{ fontWeight: "demibold" }}>Clickable PNG mosaic → grid of &lt;Image&gt;</Text>
      <Text variant="microcopy">
        Image clicks carry no coordinates, so region interactivity comes from
        tiling {ROWS}×{COLS} individual clickable PNG cells. Click a cell to
        toggle its border — proving per-region clicks on custom-rendered pixels.
      </Text>
      <Flex direction="column" gap="flush">
        {Array.from({ length: ROWS }, (_, r) => (
          <Flex key={r} direction="row" gap="flush">
            {Array.from({ length: COLS }, (_, c) => {
              const key = `${r}-${c}`;
              const isActive = !!active[key];
              const hue = (c + r / ROWS) / COLS;
              return (
                <Image
                  key={key}
                  src={pngUri(SIZE, SIZE, tileRgba(SIZE, hue, isActive))}
                  width={SIZE}
                  height={SIZE}
                  alt={`cell ${key}`}
                  onClick={() => toggle(r, c)}
                />
              );
            })}
          </Flex>
        ))}
      </Flex>
      <Text variant="microcopy">
        {last ? `Last click: cell ${last.cell} (${last.at})` : "No cell clicked yet."}
      </Text>
    </Flex>
  );
};

const ESCAPE_DOCS = "https://developers.hubspot.com/docs/platform/ui-components";

export const ESCAPE_HATCH_DEMOS = [
  {
    id: "hatch-png",
    name: "Escape hatch: Pure-JS PNG raster",
    description:
      "Encodes arbitrary RGBA pixels to a real PNG in JS (no canvas/DOM/SVG) and renders it through <Image>.",
    package: "experimental",
    Component: PngRasterDemo,
    githubUrl: ESCAPE_DOCS,
    sourceCode: `// RGBA bytes -> PNG (CRC32 + Adler32 + stored DEFLATE) -> base64 data URI
<Image src={"data:image/png;base64," + toBase64(encodePNG(w, h, rgba))} width={288} />`,
  },
  {
    id: "hatch-apng",
    name: "Escape hatch: Pure-JS APNG animation",
    description:
      "Encodes multiple RGBA frames as an animated PNG (acTL/fcTL/fdAT) for motion through <Image> — no iframe.",
    package: "experimental",
    Component: ApngAnimationDemo,
    githubUrl: ESCAPE_DOCS,
    sourceCode: `// Multiple RGBA frames -> APNG (acTL/fcTL/fdAT) -> base64 data URI
<Image src={"data:image/png;base64," + toBase64(encodeAPNG(w, h, frames, 1, 12))} width={256} />`,
  },
  {
    id: "hatch-mosaic",
    name: "Escape hatch: Clickable PNG mosaic",
    description:
      "Image clicks carry no coordinates, so region interactivity comes from tiling many small clickable <Image> PNG cells.",
    package: "experimental",
    Component: InteractivePngMosaicDemo,
    githubUrl: ESCAPE_DOCS,
    sourceCode: `// Each cell is its own clickable PNG; click granularity = cell
<Image src={pngUri(SIZE, SIZE, tileRgba(SIZE, hue, isActive))} width={SIZE} height={SIZE} onClick={() => toggle(r, c)} />`,
  },
];
