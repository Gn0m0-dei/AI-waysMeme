// Every knob the renderer reads from the environment, in one place. They are
// one family of identifiers — same prefix, same documentation table in the
// readme — and scattering them across the modules that happen to read them is
// how a name ends up misspelled in one of them.

export enum EnvironmentVariable {
  CellAspect = 'AIWAYSMEME_CELL',
  Columns = 'AIWAYSMEME_COLS',
  Graphics = 'AIWAYSMEME_GRAPHICS',
  Output = 'AIWAYSMEME_OUTPUT',
  Rows = 'AIWAYSMEME_ROWS',
  Tty = 'AIWAYSMEME_TTY',
}

export enum OutputTarget {
  Auto = 'auto',
  Stdout = 'stdout',
  Tty = 'tty',
}
