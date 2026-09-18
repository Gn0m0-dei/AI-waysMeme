// Tier 1: hand the terminal the PNG and let it draw real pixels. Nothing to
// decode, nothing to approximate — when the terminal speaks one of these
// protocols the meme looks like a meme, captions included, at any size.

export enum TerminalGraphics {
  None = 'none',
  Iterm2 = 'iterm2',
  Kitty = 'kitty',
}

export enum GraphicsVariable {
  Protocol = 'AIWAYSMEME_GRAPHICS',
}

const BELL = '\u0007';
const ESCAPE = '\u001b';
const KITTY_CHUNK = 4096;

// TERM_PROGRAM as each terminal sets it. Warp, WezTerm and iTerm2 all speak the
// iTerm2 protocol; kitty and Ghostty speak the kitty one.
const BY_TERM_PROGRAM: Readonly<Record<string, TerminalGraphics>> =
  Object.freeze({
    WarpTerminal: TerminalGraphics.Iterm2,
    'iTerm.app': TerminalGraphics.Iterm2,
    WezTerm: TerminalGraphics.Iterm2,
    ghostty: TerminalGraphics.Kitty,
    kitty: TerminalGraphics.Kitty,
  });

const KITTY_TERMS = new Set(['xterm-kitty', 'xterm-ghostty']);

const isGraphics = (value: string): value is TerminalGraphics =>
  Object.values(TerminalGraphics).some((protocol) => protocol === value);

export const detectGraphics = (): TerminalGraphics => {
  const configured = process.env[GraphicsVariable.Protocol];
  if (configured && isGraphics(configured)) {
    return configured;
  }

  const term = process.env.TERM ?? '';
  if (KITTY_TERMS.has(term) || process.env.KITTY_WINDOW_ID) {
    return TerminalGraphics.Kitty;
  }
  return (
    BY_TERM_PROGRAM[process.env.TERM_PROGRAM ?? ''] ?? TerminalGraphics.None
  );
};

// tmux swallows unknown escape sequences unless they are wrapped in its own
// passthrough, and every ESC inside has to be doubled.
const forTmux = (sequence: string): string =>
  process.env.TMUX
    ? `${ESCAPE}Ptmux;${sequence.replaceAll(ESCAPE, `${ESCAPE}${ESCAPE}`)}${ESCAPE}\\`
    : sequence;

const iterm2 = (png: Buffer, columns: number): string =>
  `${ESCAPE}]1337;File=inline=1;width=${columns};preserveAspectRatio=1;size=${png.length}:${png.toString('base64')}${BELL}`;

// The kitty protocol takes the payload in 4096 byte chunks, each one flagged
// with m=1 while more follow and m=0 on the last.
const kitty = (png: Buffer, columns: number): string => {
  const payload = png.toString('base64');
  const chunks: string[] = [];
  for (let start = 0; start < payload.length; start += KITTY_CHUNK) {
    const slice = payload.slice(start, start + KITTY_CHUNK);
    const more = start + KITTY_CHUNK < payload.length ? 1 : 0;
    const header =
      start === 0 ? `a=T,f=100,c=${columns},m=${more}` : `m=${more}`;
    chunks.push(`${ESCAPE}_G${header};${slice}${ESCAPE}\\`);
  }
  return chunks.join('');
};

export const inlineImage = (
  png: Buffer,
  columns: number,
  protocol: TerminalGraphics,
): string => {
  if (protocol === TerminalGraphics.Kitty) {
    return forTmux(kitty(png, columns));
  }
  return forTmux(iterm2(png, columns));
};
