import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import { MemeCommandName, readCommands } from '../lib/commands.ts';
import { cellAspect, fitToTerminal } from '../lib/fit.ts';
import { buildImageUrl, escapeCaption, ImageFormat } from '../lib/memegen.ts';
import { packageRoot } from '../lib/package-root.ts';
import { decodePng } from '../lib/png.ts';
import { canBake, wrapText } from '../lib/render.ts';
import { memeRule } from '../lib/rule.ts';
import { listTemplates, MemeTemplate } from '../lib/templates.ts';
import { isNoTty } from '../lib/terminal.ts';

// Builds a minimal PNG the way memegen serves them: 8-bit RGB, no interlacing.
// `filters` picks the filter byte per row, so the decoder is exercised beyond
// the trivial "None" path. CRCs are left at zero: the decoder does not check
// them, and faking them would only test node's zlib.
const buildPng = (
  width: number,
  height: number,
  rgb: readonly number[],
  filters: readonly number[],
): Buffer => {
  // 8 byte signature, then the IHDR chunk: length, type, 13 bytes of data and
  // the CRC the decoder does not read.
  const header = Buffer.alloc(33);
  header.writeUInt32BE(0x89504e47, 0);
  header.writeUInt32BE(0x0d0a1a0a, 4);
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12);
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  header[24] = 8;
  header[25] = 2;

  const stride = width * 3;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let row = 0; row < height; row++) {
    raw[row * (stride + 1)] = filters[row];
    for (let index = 0; index < stride; index++) {
      raw[row * (stride + 1) + 1 + index] = rgb[row * stride + index];
    }
  }

  const compressed = deflateSync(raw);
  const idat = Buffer.alloc(12 + compressed.length);
  idat.writeUInt32BE(compressed.length, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);

  const iend = Buffer.alloc(12);
  iend.write('IEND', 4);

  return Buffer.concat([header, idat, iend]);
};

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

// The inverse of lib/png.ts: encodes each row with the filter it is given, so
// the decoder has to undo all five of them to get the original back.
const encodeRows = (
  pixels: readonly number[],
  width: number,
  height: number,
  filters: readonly number[],
): number[] => {
  const stride = width * 3;
  const encoded: number[] = [];
  for (let row = 0; row < height; row++) {
    for (let index = 0; index < stride; index++) {
      const value = pixels[row * stride + index];
      const left = index >= 3 ? pixels[row * stride + index - 3] : 0;
      const above = row ? pixels[(row - 1) * stride + index] : 0;
      const upperLeft =
        row && index >= 3 ? pixels[(row - 1) * stride + index - 3] : 0;
      const predictors = [
        0,
        left,
        above,
        (left + above) >> 1,
        paeth(left, above, upperLeft),
      ];
      encoded.push((value - predictors[filters[row]]) & 0xff);
    }
  }
  return encoded;
};

describe('escapeCaption', () => {
  it('escapes memegen path characters in the right order', () => {
    expect(escapeCaption('a_b')).toBe('a__b');
    expect(escapeCaption('a-b')).toBe('a--b');
    expect(escapeCaption('hello world')).toBe('hello_world');
    expect(escapeCaption('why?')).toBe('why~q');
    expect(escapeCaption('100% #win a/b')).toBe('100~p_~hwin_a~sb');
  });

  it('renders an empty caption as a blank slot', () => {
    expect(escapeCaption('   ')).toBe('_');
  });
});

describe('buildImageUrl', () => {
  it('asks memegen for the exact pixel size the terminal box needs', () => {
    const box = fitToTerminal(0.639, { columns: 140, rows: 80 });
    const url = buildImageUrl(MemeTemplate.Drake, ['no', 'yes'], {
      format: ImageFormat.Png,
      width: box.pixelWidth,
      height: box.pixelHeight,
    });
    expect(url).toBe(
      `https://api.memegen.link/images/drake/no/yes.png?width=${box.pixelWidth}&height=${box.pixelHeight}`,
    );
  });

  it('requests the blank template when there are no captions', () => {
    const box = fitToTerminal(1, { columns: 140, rows: 80 });
    const url = buildImageUrl(MemeTemplate.Doge, [], {
      format: ImageFormat.Png,
      width: box.pixelWidth,
    });
    expect(url).toContain('/images/doge.png?');
  });

  // A terminal that draws real pixels decodes the image itself, so it gets JPEG:
  // the same meme is five times smaller, and size is what corrupts a frame on
  // its way through a terminal device.
  it('asks for a JPEG with no height when only a width is given', () => {
    const url = buildImageUrl(MemeTemplate.ChangeMyMind, ['hot take'], {
      format: ImageFormat.Jpeg,
      width: 600,
    });
    expect(url).toBe(
      'https://api.memegen.link/images/cmm/hot_take.jpg?width=600',
    );
  });
});

describe('fitToTerminal', () => {
  const screenAspect = (aspect: number, columns: number): number => {
    const box = fitToTerminal(aspect, { columns, rows: 80 });
    return (box.columns * cellAspect()) / box.rows;
  };

  it('keeps a portrait template from being stretched', () => {
    expect(screenAspect(0.639, 140)).toBeCloseTo(0.639, 1);
  });

  it('keeps a landscape template from being stretched', () => {
    expect(screenAspect(1.7867, 140)).toBeCloseTo(1.7867, 1);
  });

  it('never exceeds the columns it was given', () => {
    expect(
      fitToTerminal(1.7867, { columns: 60, rows: 80 }).columns,
    ).toBeLessThanOrEqual(60);
  });

  // The bug this guards against: a meme taller than the window scrolls off the
  // top and the host client repaints over the remains.
  it('never exceeds the rows it was given', () => {
    for (const spec of listTemplates()) {
      const box = fitToTerminal(spec.aspect, { columns: 139, rows: 65 });
      expect(box.rows, spec.id).toBeLessThanOrEqual(65);
    }
  });

  it('refuses to bake captions once the box is too narrow to read them', () => {
    expect(fitToTerminal(1, { columns: 140, rows: 80 }).canBakeCaptions).toBe(
      true,
    );
    expect(fitToTerminal(1, { columns: 40, rows: 80 }).canBakeCaptions).toBe(
      false,
    );
  });
});

describe('canBake', () => {
  it('bakes short captions and rejects long ones', () => {
    expect(canBake(['TESTS RED', 'THIS IS FINE'], true)).toBe(true);
    expect(canBake(['the test suite is currently failing'], true)).toBe(false);
  });

  it('never bakes when the box itself is too narrow', () => {
    expect(canBake(['SHORT'], false)).toBe(false);
  });
});

describe('wrapText', () => {
  it('wraps on spaces without splitting words', () => {
    expect(wrapText('one two three four', 9)).toEqual([
      'one two',
      'three',
      'four',
    ]);
  });

  it('keeps a word longer than the width on its own line', () => {
    expect(wrapText('supercalifragilistic ok', 5)).toEqual([
      'supercalifragilistic',
      'ok',
    ]);
  });
});

describe('decodePng', () => {
  it('reconstructs pixels through every supported filter', () => {
    const pixels = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30,
    ];
    const filters = [0, 1, 2, 3, 4];
    const encoded = encodeRows(pixels, 2, 5, filters);
    const decoded = decodePng(buildPng(2, 5, encoded, filters));

    expect(decoded.width).toBe(2);
    expect(decoded.height).toBe(5);
    expect([...decoded.pixels]).toEqual(pixels);
  });

  it('rejects formats memegen never serves', () => {
    const png = buildPng(1, 1, [0, 0, 0], [0]);
    png[25] = 6;
    expect(() => decodePng(png)).toThrow(/Unsupported PNG/);
  });

  it('rejects a response that is not a PNG at all', () => {
    expect(() => decodePng(Buffer.alloc(64))).toThrow(/not a PNG/);
  });
});

describe('catalogue', () => {
  const skill = readFileSync(
    join(packageRoot, 'skills', 'aiwaysmeme', 'SKILL.md'),
    'utf8',
  );

  // The skill table is what the model reads to pick a template; templates.ts is
  // what the renderer validates against. If they drift, the model starts asking
  // for ids that do not exist.
  it('documents every template exactly once in the skill', () => {
    for (const spec of listTemplates()) {
      const row = new RegExp(
        `^\\| \`${spec.id.replace('-', '\\-')}\` \\| ${spec.captions.length} \\|`,
        'm',
      );
      expect(skill, `${spec.id} missing or wrong caption count`).toMatch(row);
    }
  });

  it('documents no template the renderer does not know', () => {
    const documented = [...skill.matchAll(/^\| `([a-z-]+)` \| \d \|/gm)].map(
      (match) => match[1],
    );
    const known = listTemplates().map((spec) => spec.id);
    expect(documented.sort()).toEqual([...known].sort());
  });
});

describe('meme mode reinjection', () => {
  // The hosts recognise the two commands by name to decide whether the rule
  // applies to the turn. A renamed command file would silently stop the mode
  // from ever turning on.
  it('names the commands the hosts watch for', () => {
    const names = readCommands().map((command) => command.name);
    expect(names.sort()).toEqual([MemeCommandName.Off, MemeCommandName.On]);
  });

  // The rule is lifted out of SKILL.md instead of being written twice. Renaming
  // that heading breaks the extraction, so it is worth failing loudly here.
  it('lifts the rule out of the skill', () => {
    const rule = memeRule();
    expect(rule).toContain('meme mode is ON');
    expect(rule).toContain('Your entire visible reply is the meme');
    expect(rule).not.toContain('## ');
  });
});

describe('isNoTty', () => {
  // `ps` spells "this process has no terminal" differently per platform. Reading
  // one of those as a device name builds /dev/? and openSync fails with EACCES.
  it('recognises every spelling of no terminal', () => {
    for (const value of ['?', '??', '???', '-', '']) {
      expect(isNoTty(value), value).toBe(true);
    }
  });

  it('still accepts real terminals', () => {
    for (const value of ['ttys011', 'pts/0', 'console', 'tty1']) {
      expect(isNoTty(value), value).toBe(false);
    }
  });
});
