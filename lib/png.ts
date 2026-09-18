import { inflateSync } from 'node:zlib';

// A 35-line decoder instead of sharp or jimp: memegen only ever serves 8-bit
// non-interlaced RGB, node ships zlib, and every image library that would do
// this carries native binaries that break on a Windows install. Verified
// pixel-for-pixel against sips on a 85x134 drake: zero difference per channel.

export interface DecodedImage {
  readonly width: number;
  readonly height: number;
  // Row-major RGB triplets, three bytes per pixel, no padding.
  readonly pixels: Buffer;
}

enum PngFilter {
  None = 0,
  Sub = 1,
  Up = 2,
  Average = 3,
  Paeth = 4,
}

const PNG_SIGNATURE = 0x89504e47;
const BYTES_PER_PIXEL = 3;
const HEADER = Object.freeze({
  signature: 0,
  width: 16,
  height: 20,
  bitDepth: 24,
  colorType: 25,
  interlace: 28,
  firstChunk: 8,
});
const SUPPORTED = Object.freeze({ bitDepth: 8, colorType: 2, interlace: 0 });
const CHUNK_OVERHEAD = 12;

// Left, above and above-left neighbours, as the PNG spec names them.
const paeth = (left: number, above: number, upperLeft: number): number => {
  const estimate = left + above - upperLeft;
  const toLeft = Math.abs(estimate - left);
  const toAbove = Math.abs(estimate - above);
  const toUpperLeft = Math.abs(estimate - upperLeft);
  if (toLeft <= toAbove && toLeft <= toUpperLeft) {
    return left;
  }
  return toAbove <= toUpperLeft ? above : upperLeft;
};

const readPixelData = (source: Buffer): Buffer => {
  const chunks: Buffer[] = [];
  let offset = HEADER.firstChunk;
  while (offset + HEADER.firstChunk <= source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.toString('ascii', offset + 4, offset + 8);
    if (type === 'IEND') {
      break;
    }
    if (type === 'IDAT') {
      chunks.push(source.subarray(offset + 8, offset + 8 + length));
    }
    offset += CHUNK_OVERHEAD + length;
  }
  return inflateSync(Buffer.concat(chunks));
};

const unfilter = (raw: Buffer, width: number, height: number): Buffer => {
  const stride = width * BYTES_PER_PIXEL;
  const pixels = Buffer.allocUnsafe(height * stride);
  for (let row = 0; row < height; row++) {
    const filter = raw[row * (stride + 1)];
    const source = row * (stride + 1) + 1;
    const target = row * stride;
    const previous = target - stride;
    for (let index = 0; index < stride; index++) {
      const value = raw[source + index];
      const left =
        index >= BYTES_PER_PIXEL ? pixels[target + index - BYTES_PER_PIXEL] : 0;
      const above = row ? pixels[previous + index] : 0;
      const upperLeft =
        row && index >= BYTES_PER_PIXEL
          ? pixels[previous + index - BYTES_PER_PIXEL]
          : 0;
      switch (filter) {
        case PngFilter.None:
          pixels[target + index] = value;
          break;
        case PngFilter.Sub:
          pixels[target + index] = value + left;
          break;
        case PngFilter.Up:
          pixels[target + index] = value + above;
          break;
        case PngFilter.Average:
          pixels[target + index] = value + ((left + above) >> 1);
          break;
        case PngFilter.Paeth:
          pixels[target + index] = value + paeth(left, above, upperLeft);
          break;
        default:
          throw new Error(`Unknown PNG filter type ${filter} on row ${row}.`);
      }
    }
  }
  return pixels;
};

export const decodePng = (source: Buffer): DecodedImage => {
  if (source.readUInt32BE(HEADER.signature) !== PNG_SIGNATURE) {
    throw new Error('Response is not a PNG image.');
  }

  const bitDepth = source[HEADER.bitDepth];
  const colorType = source[HEADER.colorType];
  const interlace = source[HEADER.interlace];
  if (
    bitDepth !== SUPPORTED.bitDepth ||
    colorType !== SUPPORTED.colorType ||
    interlace !== SUPPORTED.interlace
  ) {
    throw new Error(
      `Unsupported PNG: depth=${bitDepth} colorType=${colorType} interlace=${interlace}.`,
    );
  }

  const width = source.readUInt32BE(HEADER.width);
  const height = source.readUInt32BE(HEADER.height);
  return {
    width,
    height,
    pixels: unfilter(readPixelData(source), width, height),
  };
};
