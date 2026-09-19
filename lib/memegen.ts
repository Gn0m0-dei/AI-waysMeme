import type { MemeBox } from './fit.ts';
import { type DecodedImage, decodePng } from './png.ts';
import type { MemeTemplate } from './templates.ts';

// memegen.link needs no account, no API key and no scraping: the image is the
// URL. It also resizes server side, which is what removed the last piece of
// this package that only worked on macOS.
const IMAGE_ENDPOINT = 'https://api.memegen.link/images';
// The half-block renderer decodes the image itself and only reads PNG. A
// terminal that draws real pixels decodes it instead, and there JPEG is the
// right answer: the same meme is five times smaller, and the frame travels
// through a terminal device where size is what breaks it.
export enum ImageFormat {
  Png = '.png',
  Jpeg = '.jpg',
}
const BLANK_CAPTION = '_';

// Order matters: underscores double before spaces become underscores, and
// hyphens double before anything else introduces one.
const ESCAPE_RULES: readonly (readonly [RegExp, string])[] = [
  [/_/g, '__'],
  [/-/g, '--'],
  [/ /g, '_'],
  [/\?/g, '~q'],
  [/%/g, '~p'],
  [/#/g, '~h'],
  [/\//g, '~s'],
  [/"/g, "''"],
];

export const escapeCaption = (caption: string): string => {
  const trimmed = caption.trim();
  if (!trimmed.length) {
    return BLANK_CAPTION;
  }
  return ESCAPE_RULES.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    trimmed,
  );
};

// Asking for a width alone keeps the aspect ratio; memegen does the resizing,
// which is why there is nothing to scale locally.
export interface ImageRequest {
  readonly format: ImageFormat;
  readonly width?: number;
  readonly height?: number;
}

export const buildImageUrl = (
  template: MemeTemplate,
  captions: readonly string[],
  request: ImageRequest,
): string => {
  const path = captions.length
    ? `${template}/${captions.map(escapeCaption).join('/')}`
    : template;
  const size = new URLSearchParams();
  if (request.width) {
    size.set('width', String(request.width));
  }
  if (request.height) {
    size.set('height', String(request.height));
  }
  const query = size.size ? `?${size}` : '';
  return `${IMAGE_ENDPOINT}/${path}${request.format}${query}`;
};

export const fetchMemeBytes = async (
  template: MemeTemplate,
  captions: readonly string[],
  request: ImageRequest,
): Promise<Buffer> => {
  const url = buildImageUrl(template, captions, request);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`memegen answered ${response.status} for ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

export const fetchMeme = async (
  template: MemeTemplate,
  captions: readonly string[],
  box: MemeBox,
): Promise<DecodedImage> =>
  decodePng(
    await fetchMemeBytes(template, captions, {
      format: ImageFormat.Png,
      width: box.pixelWidth,
      height: box.pixelHeight,
    }),
  );
