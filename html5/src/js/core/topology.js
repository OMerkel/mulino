//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

export const WHITE = 0;
export const BLACK = 1;
export const NONE = 2;

export const GRID = 7;
export const CENTRE = 3;

export const opponent = (player) => player ^ 1;

/** The 24 points on the three concentric squares, row 1 to row 7, each row from left to right. */
export const POINTS = Object.freeze(
  [
    [0, 0],
    [3, 0],
    [6, 0],
    [1, 1],
    [3, 1],
    [5, 1],
    [2, 2],
    [3, 2],
    [4, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [4, 3],
    [5, 3],
    [6, 3],
    [2, 4],
    [3, 4],
    [4, 4],
    [1, 5],
    [3, 5],
    [5, 5],
    [0, 6],
    [3, 6],
    [6, 6]
  ].map(([x, y]) => Object.freeze({ x, y }))
);

export const POINT_COUNT = POINTS.length;

/**
 * A drawn line holds three points. Row 4 and column d are interrupted by the empty centre,
 * so they split into two lines each.
 */
const linesAlong = (axis, cross) => {
  const groups = new Map();
  POINTS.forEach((point, index) => {
    const side = point[axis] === CENTRE ? Math.sign(point[cross] - CENTRE) : 0;
    const key = `${point[axis]}:${side}`;
    groups.set(key, [...(groups.get(key) ?? []), index]);
  });
  return [...groups.values()].map((line) =>
    Object.freeze(line.sort((a, b) => POINTS[a][cross] - POINTS[b][cross]))
  );
};

/** The 16 mills: eight horizontal and eight vertical lines of three points. */
export const MILLS = Object.freeze([...linesAlong('y', 'x'), ...linesAlong('x', 'y')]);

/** For every point the two mills running through it. */
export const MILLS_AT = Object.freeze(
  POINTS.map((_, index) => Object.freeze(MILLS.filter((mill) => mill.includes(index))))
);

/** Neighbours along the drawn lines: consecutive points of every line. */
export const ADJACENCY = Object.freeze(
  POINTS.map((_, index) =>
    Object.freeze(
      MILLS.flatMap((mill) => {
        const position = mill.indexOf(index);
        if (position < 0) return [];
        return [mill[position - 1], mill[position + 1]].filter((other) => other !== undefined);
      }).sort((a, b) => a - b)
    )
  )
);

export const isAdjacent = (a, b) => ADJACENCY[a].includes(b);

export const toAlgebraic = (index) => {
  const point = POINTS[index];
  return `${String.fromCharCode(97 + point.x)}${point.y + 1}`;
};

/** Returns the point index of an algebraic name, or -1 for a name that is not a point. */
export const fromAlgebraic = (name) => POINTS.findIndex((_, index) => toAlgebraic(index) === name);
