import { EnvironmentVariable } from './environment.ts';
import type { TerminalBudget } from './terminal.ts';

// A half-block cell carries one pixel of width and two of height, but on screen
// it is roughly 0.6 as wide as it is tall. Ignoring that renders every portrait
// template stretched, which is exactly how the first draft looked.

// cellAspect is the calibration knob: it depends on the font, not on the code.
// Menlo, SF Mono and JetBrains Mono all sit near 0.6; a condensed font does not.
const LAYOUT = Object.freeze({
  cellAspect: 0.6,
  targetRows: 80,
  maxColumns: 110,
  // Below this width memegen's rasterised Impact stops being readable, so the
  // captions have to leave the image and become terminal text.
  minBakeColumns: 85,
});

const PIXEL_ROWS_PER_CELL = 2;

export interface MemeBox {
  readonly columns: number;
  readonly rows: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  // False when the box is too narrow for rasterised captions to be legible.
  readonly canBakeCaptions: boolean;
}

export const cellAspect = (): number => {
  const configured = Number(process.env[EnvironmentVariable.CellAspect]);
  return configured > 0 ? configured : LAYOUT.cellAspect;
};

// Height is the constraint that actually bites: a meme taller than the window
// scrolls off the top and the host client repaints over whatever is left, which
// looks exactly like a rendering bug. Width is clamped for the same reason.
export const fitToTerminal = (
  aspect: number,
  budget: TerminalBudget,
): MemeBox => {
  const cell = cellAspect();
  const columnCeiling = Math.min(LAYOUT.maxColumns, budget.columns);

  let rows = Math.min(LAYOUT.targetRows, budget.rows);
  let columns = Math.round((aspect * rows) / cell);
  if (columns > columnCeiling) {
    columns = columnCeiling;
    rows = Math.round((columns * cell) / aspect);
  }

  return {
    columns,
    rows,
    pixelWidth: columns,
    pixelHeight: rows * PIXEL_ROWS_PER_CELL,
    canBakeCaptions: columns >= LAYOUT.minBakeColumns,
  };
};
