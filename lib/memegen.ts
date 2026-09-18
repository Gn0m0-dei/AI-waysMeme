import type { MemeBox } from './fit.ts';
import { type DecodedImage, decodePng } from './png.ts';
import type { MemeTemplate } from './templates.ts';

// memegen.link needs no account, no API key and no scraping: the image is the
// URL. It also resizes server side, which is what removed the last piece of
// this package that only worked on macOS.
const IMAGE_ENDPOINT = 'https://api.memegen.link/images';
const IMAGE_EXTENSION = '.png';
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

// Without a box the image comes at its native size, which is what a terminal
// that draws real pixels wants: it scales the PNG itself.
export const buildImageUrl = (
  template: MemeTemplate,
  captions: readonly string[],
  box?: MemeBox,
): string => {
  const path = captions.length
    ? `${template}/${captions.map(escapeCaption).join('/')}`
    : template;
  const size = box ? `?width=${box.pixelWidth}&height=${box.pixelHeight}` : '';
  return `${IMAGE_ENDPOINT}/${path}${IMAGE_EXTENSION}${size}`;
};

export const fetchMemeBytes = async (
  template: MemeTemplate,
  captions: readonly string[],
  box?: MemeBox,
): Promise<Buffer> => {
  const url = buildImageUrl(template, captions, box);
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
  decodePng(await fetchMemeBytes(template, captions, box));
