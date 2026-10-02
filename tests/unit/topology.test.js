import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ADJACENCY,
  BLACK,
  fromAlgebraic,
  isAdjacent,
  MILLS,
  MILLS_AT,
  opponent,
  POINT_COUNT,
  POINTS,
  toAlgebraic,
  WHITE
} from '../../html5/src/js/core/topology.js';

const names = (points) => points.map(toAlgebraic);

const RULES_TEXT = readFileSync(
  fileURLToPath(new URL('../../doc/rules.md', import.meta.url)),
  'utf8'
);

/** Reads the points (`+`) of the board diagram in rules.md. */
const diagramPoints = () => {
  const diagram = RULES_TEXT.match(/```text\r?\n([\s\S]*?)```/)[1].split(/\r?\n/);
  const points = [];
  diagram.forEach((line, row) => {
    if (row % 2 !== 0) return;
    [...line].forEach((symbol, column) => {
      if (symbol !== '+') return;
      points.push(`${String.fromCharCode(97 + (column - 2) / 3)}${7 - row / 2}`);
    });
  });
  return points.sort();
};

describe('board topology', () => {
  it('has twenty four points with algebraic names', () => {
    expect(POINT_COUNT).toBe(24);
    expect(names(POINTS.map((_, index) => index))).toEqual([
      'a1',
      'd1',
      'g1',
      'b2',
      'd2',
      'f2',
      'c3',
      'd3',
      'e3',
      'a4',
      'b4',
      'c4',
      'e4',
      'f4',
      'g4',
      'c5',
      'd5',
      'e5',
      'b6',
      'd6',
      'f6',
      'a7',
      'd7',
      'g7'
    ]);
  });

  it('matches the board diagram of the rules', () => {
    expect(diagramPoints()).toEqual(names(POINTS.map((_, index) => index)).sort());
  });

  it('round trips every algebraic name', () => {
    for (let point = 0; point < POINT_COUNT; ++point) {
      expect(fromAlgebraic(toAlgebraic(point))).toBe(point);
    }
    expect(fromAlgebraic('d4')).toBe(-1);
  });

  it('has a symmetric adjacency with thirty two edges', () => {
    let edges = 0;
    ADJACENCY.forEach((neighbours, point) => {
      for (const other of neighbours) {
        expect(ADJACENCY[other]).toContain(point);
        edges += 1;
      }
    });
    expect(edges / 2).toBe(32);
  });

  it('derives the adjacency from the drawn lines', () => {
    expect(names(ADJACENCY[fromAlgebraic('d2')])).toEqual(['d1', 'b2', 'f2', 'd3']);
    expect(names(ADJACENCY[fromAlgebraic('a4')])).toEqual(['a1', 'b4', 'a7']);
    expect(names(ADJACENCY[fromAlgebraic('c4')])).toEqual(['c3', 'b4', 'c5']);
    expect(isAdjacent(fromAlgebraic('c4'), fromAlgebraic('e4'))).toBe(false);
    expect(isAdjacent(fromAlgebraic('d6'), fromAlgebraic('d7'))).toBe(true);
  });

  it('knows the sixteen mills', () => {
    expect(MILLS).toHaveLength(16);
    const mills = MILLS.map((mill) => names(mill).join('-'));
    expect(mills).toContain('a7-d7-g7');
    expect(mills).toContain('a1-a4-a7');
    expect(mills).toContain('a4-b4-c4');
    expect(mills).toContain('e4-f4-g4');
    expect(mills).toContain('d1-d2-d3');
    expect(mills).toContain('d5-d6-d7');
    expect(mills).not.toContain('c4-e4');
  });

  it('derives the mills from the drawn lines', () => {
    for (const mill of MILLS) {
      const [a, b, c] = mill.map((point) => POINTS[point]);
      const sameRow = a.y === b.y && b.y === c.y;
      const sameColumn = a.x === b.x && b.x === c.x;
      expect(sameRow || sameColumn).toBe(true);
      expect(isAdjacent(mill[0], mill[1]) && isAdjacent(mill[1], mill[2])).toBe(true);
    }
  });

  it('puts every point into exactly two mills', () => {
    for (const mills of MILLS_AT) expect(mills).toHaveLength(2);
  });

  it('names the opponent', () => {
    expect(opponent(WHITE)).toBe(BLACK);
    expect(opponent(BLACK)).toBe(WHITE);
  });
});
