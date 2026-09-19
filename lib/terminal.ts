import { execFileSync } from 'node:child_process';
import { closeSync, openSync, writeSync } from 'node:fs';

import { EnvironmentVariable, OutputTarget } from './environment.ts';

// What the meme is allowed to occupy: the terminal minus whatever the host
// client keeps for itself.
export interface TerminalBudget {
  readonly columns: number;
  readonly rows: number;
}

// An AI client spawns its plugins without a controlling terminal: /dev/tty
// answers "device not configured" and stdout may be carrying protocol traffic.
// The terminal is still there, it just belongs to an ancestor process, and
// /dev/ttysNNN is writable by path. Walking up the process tree finds it, so
// nothing has to be configured by hand.

const WINDOWS = 'win32';
const MAX_ANCESTORS = 12;
// What `ps` prints for a process with no controlling terminal, which differs by
// platform: BSD and macOS say `??`, Linux says a single `?`, and either can say
// `-`. Reading one of those as a device name builds `/dev/?` and openSync fails
// with EACCES, which is how this looked when it broke on Linux.
const NO_TTY = /^(?:\?+|-)?$/;
const FALLBACK_COLUMNS = 100;
const FALLBACK_ROWS = 40;
// Claude Code, opencode and pi all keep a prompt box at the bottom of the
// window and repaint it constantly. Nothing of ours may land inside it. The
// reserve also keeps the frame from filling the window: a frame as tall as the
// terminal scrolls its own first row away the moment the host prints anything.
const HOST_RESERVED_ROWS = 22;
const MIN_ROWS = 10;
const PROCESS_LINE = /^(\d+)\s+(\S+)$/;
const TERMINAL_SIZE = /^(\d+)\s+(\d+)$/;

export const isNoTty = (value: string): boolean => NO_TTY.test(value);

const runQuietly = (command: string, args: readonly string[]): string => {
  try {
    // stderr is discarded on purpose: stty complains loudly about anything that
    // is not a terminal, and the caller already treats silence as "no answer".
    return execFileSync(command, [...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
};

export const findTty = (): string | undefined => {
  const configured = process.env[EnvironmentVariable.Tty];
  if (configured) {
    return configured;
  }
  // Windows has no tty device to open; stdout is the only way in.
  if (process.platform === WINDOWS) {
    return undefined;
  }

  let pid = process.pid;
  for (let step = 0; step < MAX_ANCESTORS && pid > 1; step++) {
    const line = runQuietly('ps', ['-o', 'ppid=,tty=', '-p', String(pid)]);
    const parsed = line.match(PROCESS_LINE);
    if (!parsed) {
      return undefined;
    }
    if (!isNoTty(parsed[2])) {
      return `/dev/${parsed[2]}`;
    }
    pid = Number(parsed[1]);
  }
  return undefined;
};

// stty reads the size from the device itself, which is the only source that
// still knows it once stdout is a pipe. BSD spells the flag -f, GNU spells it -F.
const readDeviceSize = (device: string): TerminalBudget | undefined => {
  for (const flag of ['-f', '-F']) {
    const size = runQuietly('stty', [flag, device, 'size']).match(
      TERMINAL_SIZE,
    );
    if (size) {
      return { rows: Number(size[1]), columns: Number(size[2]) };
    }
  }
  return undefined;
};

// Where the frame goes. The device is the right answer nearly always: it costs
// the model no tokens, and an AI client that swallows command output never
// shows the frame at all. Stdout stays available for a host that prefers it.
export const outputDevice = (): string | undefined =>
  process.env[EnvironmentVariable.Output] === OutputTarget.Stdout
    ? undefined
    : findTty();

// `paintDevice` is where the frame will be written, as returned by
// outputDevice: a path when we paint the terminal ourselves, undefined when the
// host prints it. The window is measured either way.
export const terminalBudget = (paintDevice?: string): TerminalBudget => {
  const measured = readDeviceSize(paintDevice ?? findTty() ?? '');
  const columns =
    Number(process.env[EnvironmentVariable.Columns]) ||
    process.stdout.columns ||
    measured?.columns ||
    FALLBACK_COLUMNS;
  const rows =
    Number(process.env[EnvironmentVariable.Rows]) ||
    process.stdout.rows ||
    measured?.rows ||
    FALLBACK_ROWS;

  // The host client owns the bottom of the window — its prompt, its status bar.
  // Painting into those rows means the next repaint erases half the meme.
  return { columns, rows: Math.max(MIN_ROWS, rows - HOST_RESERVED_ROWS) };
};

// Returns where the frame was written, so the CLI can report it instead of
// echoing 180 KB of escape sequences back into the model's context.
export const paint = (frame: string, device?: string): string => {
  if (!device) {
    process.stdout.write(frame);
    return 'stdout';
  }
  try {
    const handle = openSync(device, 'w');
    try {
      writeSync(handle, frame);
    } finally {
      closeSync(handle);
    }
    return device;
  } catch (error) {
    // The device was found by reading the process tree, which can name one this
    // process may not open — a detached session, a container, a tty owned by
    // another user. Printing the meme is still better than failing, and the
    // reason travels back in the receipt rather than being swallowed.
    process.stdout.write(frame);
    const reason = error instanceof Error ? error.message : String(error);
    return `stdout (${device} could not be opened: ${reason})`;
  }
};
