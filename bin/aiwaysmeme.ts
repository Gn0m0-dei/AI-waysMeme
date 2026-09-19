#!/usr/bin/env node
import { detectGraphics } from '../lib/graphics.ts';
import { renderMeme } from '../lib/render.ts';
import {
  isMemeTemplate,
  listTemplates,
  MEME_TEMPLATES,
} from '../lib/templates.ts';
import { outputDevice, paint, terminalBudget } from '../lib/terminal.ts';

// The frame never travels back through the model: it is written straight to the
// terminal device and stdout only carries a one-line receipt. A meme costs
// about 180 KB of escape sequences and roughly zero tokens.

const USAGE = `aiwaysmeme render <template> <caption...>
aiwaysmeme list`;

enum ExitCode {
  Ok = 0,
  Failure = 1,
}

const render = async (args: readonly string[]): Promise<string> => {
  const [template, ...captions] = args;
  if (!template || !isMemeTemplate(template)) {
    throw new Error(
      `Unknown template "${template ?? ''}". Run "aiwaysmeme list" for the catalogue.`,
    );
  }

  const spec = MEME_TEMPLATES[template];
  if (captions.length !== spec.captions.length) {
    throw new Error(
      `${spec.id} takes ${spec.captions.length} caption(s) — ${spec.captions.join(' | ')}.`,
    );
  }

  const device = outputDevice();
  const budget = terminalBudget(device);
  const graphics = detectGraphics();
  const meme = await renderMeme(spec, captions, budget, graphics);
  const target = paint(meme.frame, device);

  return `${spec.id} rendered to ${target} as ${graphics} (${meme.columns}x${meme.rows} cells, captions ${meme.captionsBaked ? 'baked in' : 'as terminal text'}).`;
};

const list = (): string =>
  listTemplates()
    .map(
      (spec) =>
        `${spec.id.padEnd(18)}${spec.captions.length}  ${spec.meaning} [${spec.captions.join(' | ')}]`,
    )
    .join('\n');

const COMMANDS: Readonly<
  Record<string, (args: readonly string[]) => Promise<string> | string>
> = Object.freeze({ render, list });

const main = async (): Promise<void> => {
  const [command, ...args] = process.argv.slice(2);
  const handler = command ? COMMANDS[command] : undefined;
  if (!handler) {
    throw new Error(`Unknown command "${command ?? ''}".\n${USAGE}`);
  }
  console.log(await handler(args));
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = ExitCode.Failure;
}
