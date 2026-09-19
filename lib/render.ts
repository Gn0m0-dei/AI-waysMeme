import { fitToTerminal } from './fit.ts';
import { inlineImage, TerminalGraphics } from './graphics.ts';
import { fetchMeme, fetchMemeBytes } from './memegen.ts';
import type { DecodedImage } from './png.ts';
import type { MemeTemplateSpec } from './templates.ts';
import type { TerminalBudget } from './terminal.ts';

// Half blocks give two pixels of vertical resolution per cell: the upper half
// is painted as foreground, the lower half as background. The alternative was a
// terminal image protocol, which only some terminals speak.

const UPPER_HALF_BLOCK = '▀';
const ANSI = Object.freeze({
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  foreground: (color: string): string => `\u001b[38;2;${color}m`,
  background: (color: string): string => `\u001b[48;2;${color}m`,
});

// A caption longer than this is unreadable once memegen rasterises Impact into
// 85 columns, so it leaves the image and becomes real terminal text instead.
// The side effect is welcome: short captions make better memes.
const BAKE_MAX_LENGTH = 15;
const GUTTER = 3;
const MIN_CAPTION_WIDTH = 20;
const PIXEL_ROWS_PER_CELL = 2;
const BYTES_PER_PIXEL = 3;
// Blank rows left under the frame. The host client redraws its own last block
// after the command returns, using a cursor position that knows nothing about
// the rows we just wrote; without this padding that redraw lands on the image.
const TRAILING_ROWS = 14;
const PADDING = '\n'.repeat(TRAILING_ROWS);

export interface RenderedMeme {
  readonly frame: string;
  readonly columns: number;
  readonly rows: number;
  readonly captionsBaked: boolean;
}

export const wrapText = (text: string, width: number): readonly string[] =>
  text.split(' ').reduce<string[]>((lines, word) => {
    const current = lines[lines.length - 1];
    if (current !== undefined && `${current} ${word}`.length <= width) {
      lines[lines.length - 1] = `${current} ${word}`;
      return lines;
    }
    lines.push(word);
    return lines;
  }, []);

export const canBake = (
  captions: readonly string[],
  boxCanBake: boolean,
): boolean =>
  boxCanBake && captions.every((caption) => caption.length <= BAKE_MAX_LENGTH);

const toHalfBlockRows = ({
  width,
  height,
  pixels,
}: DecodedImage): readonly string[] => {
  const colorAt = (x: number, y: number): string => {
    const offset = (y * width + x) * BYTES_PER_PIXEL;
    return `${pixels[offset]};${pixels[offset + 1]};${pixels[offset + 2]}`;
  };

  const rows: string[] = [];
  for (let row = 0; row + 1 < height; row += PIXEL_ROWS_PER_CELL) {
    let line = '';
    let foreground = '';
    let background = '';
    for (let column = 0; column < width; column++) {
      const upper = colorAt(column, row);
      const lower = colorAt(column, row + 1);
      if (upper !== foreground) {
        line += ANSI.foreground(upper);
        foreground = upper;
      }
      if (lower !== background) {
        line += ANSI.background(lower);
        background = lower;
      }
      line += UPPER_HALF_BLOCK;
    }
    rows.push(`${line}${ANSI.reset}`);
  }
  return rows;
};

// One vertical band per caption, each centred on the slice of the image it
// belongs to. With two captions this lines up with Drake's two panels.
const besideImage = (
  picture: readonly string[],
  captions: readonly string[],
  imageWidth: number,
  columns: number,
): string => {
  const textWidth = columns - imageWidth - GUTTER;
  const band = picture.length / captions.length;
  const sidebar: string[] = Array(picture.length).fill('');

  captions.forEach((caption, index) => {
    const lines = wrapText(caption.toUpperCase(), textWidth);
    const centred = Math.round(index * band + (band - lines.length) / 2);
    const top = Math.max(0, Math.min(picture.length - lines.length, centred));
    lines.forEach((line, offset) => {
      sidebar[top + offset] = `${ANSI.bold}${line}${ANSI.reset}`;
    });
  });

  return picture
    .map((row, index) => `${row}${' '.repeat(GUTTER)}${sidebar[index]}`)
    .join('\n');
};

const aboveImage = (
  picture: readonly string[],
  captions: readonly string[],
  imageWidth: number,
): string => {
  const header = captions
    .flatMap((caption) => wrapText(caption.toUpperCase(), imageWidth))
    .map((line) => `${ANSI.bold}${line}${ANSI.reset}`);
  return [...header, ...picture].join('\n');
};

export const renderMeme = async (
  spec: MemeTemplateSpec,
  captions: readonly string[],
  budget: TerminalBudget,
  graphics: TerminalGraphics = TerminalGraphics.None,
): Promise<RenderedMeme> => {
  // A terminal that draws real pixels needs none of what follows: no decoding,
  // no half blocks, and no caption length limit, because memegen rasterises at
  // full resolution and the terminal scales the result.
  if (graphics !== TerminalGraphics.None) {
    const box = fitToTerminal(spec.aspect, budget);
    const png = await fetchMemeBytes(spec.id, captions);
    return {
      frame: `\n${inlineImage(png, box.columns, graphics)}\n${PADDING}`,
      columns: box.columns,
      rows: box.rows,
      captionsBaked: true,
    };
  }

  const probe = fitToTerminal(spec.aspect, budget);
  const baked = canBake(captions, probe.canBakeCaptions);

  if (baked) {
    const image = await fetchMeme(spec.id, captions, probe);
    const picture = toHalfBlockRows(image);
    return {
      frame: `\n${picture.join('\n')}\n${PADDING}`,
      columns: image.width,
      rows: picture.length,
      captionsBaked: true,
    };
  }

  // Captions that stay outside the image need room of their own: beside it they
  // take columns, above it they take rows. Either way the image shrinks first,
  // and asking memegen for the smaller size beats resizing locally.
  const beside = fitToTerminal(spec.aspect, {
    columns: budget.columns - MIN_CAPTION_WIDTH - GUTTER,
    rows: budget.rows,
  });
  const fitsBeside =
    beside.columns + GUTTER + MIN_CAPTION_WIDTH <= budget.columns;

  const header = fitsBeside
    ? []
    : captions.flatMap((caption) =>
        wrapText(caption.toUpperCase(), beside.columns),
      );
  const box = fitsBeside
    ? beside
    : fitToTerminal(spec.aspect, {
        columns: budget.columns,
        rows: budget.rows - header.length,
      });

  const image = await fetchMeme(spec.id, [], box);
  const picture = toHalfBlockRows(image);
  const body = fitsBeside
    ? besideImage(picture, captions, image.width, budget.columns)
    : aboveImage(picture, captions, image.width);

  return {
    frame: `\n${body}\n${PADDING}`,
    columns: image.width,
    rows: body.split('\n').length,
    captionsBaked: false,
  };
};
