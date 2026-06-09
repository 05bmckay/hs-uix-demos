// ═══════════════════════════════════════════════════════════════════════════
// Pure-JS APNG encoder (CRC32 + Adler32 + DEFLATE + PNG/APNG chunks)
//
// The viewport used to be repainted as a fresh SVG ~10×/second, forcing React
// to diff a new <Image> every frame. Instead we now bake N consecutive Doom
// frames into a single animated PNG (acTL / fcTL / fdAT) and hand it to one
// <Image> as a data URI. If the host <img> supports APNG it animates the loop
// natively — motion with no iframe and no per-frame React work; if it doesn't,
// it degrades to a crisp static first frame. The whole pipeline (real DEFLATE
// with fixed-Huffman + greedy LZ77, adaptive scanline filtering, CRCs) is
// validated against Node's zlib inflate, so the streams are spec-correct.
// ═══════════════════════════════════════════════════════════════════════════

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (bytes, start = 0, end = bytes.length) => {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
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

// DEFLATE bit writer — codes are packed LSB-first per RFC 1951.
class DeflateBitWriter {
  constructor() {
    this.bytes = [];
    this.cur = 0;
    this.nbits = 0;
  }
  writeBits(value, count) {
    for (let i = 0; i < count; i++) {
      this.cur |= ((value >> i) & 1) << this.nbits;
      this.nbits++;
      if (this.nbits === 8) {
        this.bytes.push(this.cur);
        this.cur = 0;
        this.nbits = 0;
      }
    }
  }
  // Huffman codes are emitted most-significant-bit first.
  writeHuff(code, len) {
    for (let i = len - 1; i >= 0; i--) this.writeBits((code >> i) & 1, 1);
  }
  finish() {
    if (this.nbits > 0) {
      this.bytes.push(this.cur);
      this.cur = 0;
      this.nbits = 0;
    }
    return this.bytes;
  }
}

// Fixed Huffman literal/length code (RFC 1951 §3.2.6).
const fixedLitCode = (sym) => {
  if (sym <= 143) return { code: 0x30 + sym, len: 8 };
  if (sym <= 255) return { code: 0x190 + (sym - 144), len: 9 };
  if (sym <= 279) return { code: 0x000 + (sym - 256), len: 7 };
  return { code: 0xc0 + (sym - 280), len: 8 };
};

const DEFLATE_LEN_BASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
const DEFLATE_LEN_EXTRA = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
const DEFLATE_DIST_BASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
const DEFLATE_DIST_EXTRA = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

const deflateLenSym = (len) => {
  for (let i = DEFLATE_LEN_BASE.length - 1; i >= 0; i--) if (len >= DEFLATE_LEN_BASE[i]) return i;
  return 0;
};
const deflateDistSym = (dist) => {
  for (let i = DEFLATE_DIST_BASE.length - 1; i >= 0; i--) if (dist >= DEFLATE_DIST_BASE[i]) return i;
  return 0;
};

// Single fixed-Huffman block with greedy LZ77 matching, wrapped in a zlib
// stream. Validated to round-trip through Node's zlib.inflateSync.
export const deflate = (data) => {
  const bw = new DeflateBitWriter();
  bw.writeBits(1, 1); // BFINAL = 1
  bw.writeBits(1, 2); // BTYPE = 01 (fixed Huffman)

  const n = data.length;
  const WSIZE = 32768;
  const MIN_MATCH = 3;
  const MAX_MATCH = 258;
  const head = new Int32Array(65536).fill(-1);
  const prev = new Int32Array(Math.max(1, n)).fill(-1);
  const hash = (i) => ((data[i] << 10) ^ (data[i + 1] << 5) ^ data[i + 2]) & 0xffff;

  const emitLiteral = (b) => {
    const { code, len } = fixedLitCode(b);
    bw.writeHuff(code, len);
  };
  const emitMatch = (length, dist) => {
    const ls = deflateLenSym(length);
    const lit = fixedLitCode(257 + ls); // length symbols are 257..285
    bw.writeHuff(lit.code, lit.len);
    bw.writeBits(length - DEFLATE_LEN_BASE[ls], DEFLATE_LEN_EXTRA[ls]);
    const ds = deflateDistSym(dist);
    bw.writeHuff(ds, 5); // fixed-Huffman distance codes are 5-bit, MSB-first
    bw.writeBits(dist - DEFLATE_DIST_BASE[ds], DEFLATE_DIST_EXTRA[ds]);
  };

  let i = 0;
  while (i < n) {
    let bestLen = 0;
    let bestDist = 0;
    if (i + MIN_MATCH <= n) {
      const h = hash(i);
      let j = head[h];
      let chain = 0;
      const maxLen = Math.min(MAX_MATCH, n - i);
      while (j >= 0 && i - j <= WSIZE && chain < 64) {
        if (data[j + bestLen] === data[i + bestLen]) {
          let l = 0;
          while (l < maxLen && data[j + l] === data[i + l]) l++;
          if (l > bestLen) {
            bestLen = l;
            bestDist = i - j;
            if (l >= maxLen) break;
          }
        }
        j = prev[j];
        chain++;
      }
    }
    if (bestLen >= MIN_MATCH) {
      emitMatch(bestLen, bestDist);
      const end = i + bestLen;
      while (i < end) {
        if (i + MIN_MATCH <= n) {
          const h = hash(i);
          prev[i] = head[h];
          head[h] = i;
        }
        i++;
      }
    } else {
      emitLiteral(data[i]);
      if (i + MIN_MATCH <= n) {
        const h = hash(i);
        prev[i] = head[h];
        head[h] = i;
      }
      i++;
    }
  }
  const eob = fixedLitCode(256);
  bw.writeHuff(eob.code, eob.len);

  const compressed = bw.finish();
  const out = new Uint8Array(2 + compressed.length + 4);
  out[0] = 0x78; // zlib CMF
  out[1] = 0x01; // zlib FLG
  out.set(compressed, 2);
  const ad = adler32(data);
  const o = 2 + compressed.length;
  out[o] = (ad >>> 24) & 0xff;
  out[o + 1] = (ad >>> 16) & 0xff;
  out[o + 2] = (ad >>> 8) & 0xff;
  out[o + 3] = ad & 0xff;
  return out;
};

// Paeth predictor + adaptive PNG scanline filtering (RGBA, 4 bytes/pixel).
const pngPaeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

export const pngFilterImage = (rgba, w, h) => {
  const bpp = 4;
  const stride = w * bpp;
  const out = new Uint8Array(h * (stride + 1));
  const tmp = new Uint8Array(stride);
  const best = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const row = y * stride;
    const prevRow = row - stride;
    let bestType = 0;
    let bestScore = Infinity;
    // Try None/Sub/Up/Average/Paeth, keep the lowest absolute-deviation row.
    for (let type = 0; type < 5; type++) {
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const cur = rgba[row + x];
        const a = x >= bpp ? rgba[row + x - bpp] : 0;
        const b = y > 0 ? rgba[prevRow + x] : 0;
        const c = y > 0 && x >= bpp ? rgba[prevRow + x - bpp] : 0;
        let v;
        if (type === 0) v = cur;
        else if (type === 1) v = (cur - a) & 0xff;
        else if (type === 2) v = (cur - b) & 0xff;
        else if (type === 3) v = (cur - ((a + b) >> 1)) & 0xff;
        else v = (cur - pngPaeth(a, b, c)) & 0xff;
        tmp[x] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        bestType = type;
        best.set(tmp);
      }
    }
    out[y * (stride + 1)] = bestType;
    out.set(best, y * (stride + 1) + 1);
  }
  return out;
};

export const pngU32 = (v) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
export const pngU16 = (v) => [(v >>> 8) & 255, v & 255];

export const pngChunk = (type, data) => {
  const body = new Uint8Array(4 + data.length);
  body[0] = type.charCodeAt(0);
  body[1] = type.charCodeAt(1);
  body[2] = type.charCodeAt(2);
  body[3] = type.charCodeAt(3);
  body.set(data, 4);
  const crc = crc32(body);
  const out = new Uint8Array(4 + body.length + 4);
  out.set(pngU32(data.length), 0);
  out.set(body, 4);
  out.set(pngU32(crc), 4 + body.length);
  return out;
};

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export const bytesToBase64 = (bytes) => {
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64_CHARS[(n >> 18) & 63] + B64_CHARS[(n >> 12) & 63] + B64_CHARS[(n >> 6) & 63] + B64_CHARS[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += B64_CHARS[(n >> 18) & 63] + B64_CHARS[(n >> 12) & 63] + "==";
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64_CHARS[(n >> 18) & 63] + B64_CHARS[(n >> 12) & 63] + B64_CHARS[(n >> 6) & 63] + "=";
  }
  return out;
};
