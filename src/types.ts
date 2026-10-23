export interface Cell {
  row: number;
  col: number;
  solution: string; // uppercase string (can be 1 char or rebus multi-char)
  isBlocked: boolean; // black square
  number?: number; // clue number
  acrossClueId?: string;
  downClueId?: string;
  isRebus?: boolean;
  unlockCondition?: string; // clueId that must be solved to reveal this cell
  isUnlocked?: boolean; // whether currently visible/playable
}

export interface Clue {
  id: string; // e.g. "1A", "2D"
  number: number;
  direction: 'across' | 'down';
  text: string;
  solution: string;
  row: number;
  col: number;
  length: number;
  unlockCondition?: string; // clueId or condition required to reveal this clue
  isUnlocked?: boolean;
  isSecret?: boolean; // secret bonus clue
}

export interface Puzzle {
  id: string;
  title: string;
  author: string;
  dimensions: { rows: number; cols: number };
  grid: Cell[][];
  clues: Clue[];
  progressiveTriggers: {
    triggerClueId: string;
    revealsGridCells: { row: number; col: number }[];
    revealsClueIds: string[];
    bannerMessage: string;
  }[];
}
