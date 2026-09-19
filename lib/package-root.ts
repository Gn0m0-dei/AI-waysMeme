import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Found by walking up to the directory that holds package.json rather than by
// counting levels: this file runs from lib/ in the repository and from
// dist/lib/ in the published package, and the data it locates — commands/ and
// skills/ — stays at the root in both.
const MANIFEST = 'package.json';

const findPackageRoot = (start: string): string => {
  let directory = start;
  while (!existsSync(join(directory, MANIFEST))) {
    const parent = dirname(directory);
    if (parent === directory) {
      throw new Error(`No ${MANIFEST} above ${start}.`);
    }
    directory = parent;
  }
  return directory;
};

export const packageRoot = findPackageRoot(
  dirname(fileURLToPath(import.meta.url)),
);
