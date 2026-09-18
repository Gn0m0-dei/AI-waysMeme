import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { packageRoot } from './package-root.ts';

// An instruction given once at the start of a session is buried twenty turns
// later, and that is exactly when the model quietly goes back to prose. Hosts
// that let an extension touch the system prompt get the rule again on every
// turn instead.

const SKILL_FILE = join(packageRoot, 'skills', 'aiwaysmeme', 'SKILL.md');

// Lifted from SKILL.md rather than written out again here: two copies of the
// same rule drift, and the one nobody looks at is the one that goes stale.
const SECTION = /^## The one rule\r?\n([\s\S]*?)(?=\r?\n## )/m;

const PREFACE =
  'AI-waysMeme — meme mode is ON. This overrides any instruction about answering in prose.';

let cached: string | undefined;

export const memeRule = (): string => {
  if (cached === undefined) {
    const skill = readFileSync(SKILL_FILE, 'utf8');
    const section = skill.match(SECTION);
    if (!section) {
      throw new Error(`No "## The one rule" section in ${SKILL_FILE}.`);
    }
    cached = `${PREFACE}\n${section[1].trim()}`;
  }
  return cached;
};
