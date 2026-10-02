//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import {
  ADJACENCY,
  BLACK,
  MILLS_AT,
  NONE,
  opponent,
  POINT_COUNT,
  POINTS,
  WHITE
} from './topology.js';

export { BLACK, NONE, POINT_COUNT, WHITE };

export const PIECES = 9;

export const PLACE = 'place';
export const MOVE = 'move';
export const FLY = 'fly';
export const REMOVE = 'remove';

export const PLACING = 'placing';
export const MOVING = 'moving';
export const FLYING = 'flying';
export const REMOVING = 'removing';

export const DEFAULT_RULES = Object.freeze({ flying: true, skipRemovalInMills: false });

export const createInitialState = () => ({
  field: new Array(POINT_COUNT).fill(NONE),
  active: WHITE,
  inHand: [PIECES, PIECES],
  pendingRemoval: false,
  history: null,
  previousAction: null
});

export const pieceAt = (state, point) => state.field[point];

const pointsOf = (field, player) => {
  const points = [];
  for (let point = 0; point < POINT_COUNT; ++point) if (field[point] === player) points.push(point);
  return points;
};

const emptyPoints = (field) => pointsOf(field, NONE);

export const piecesOnBoard = (state, player) => pointsOf(state.field, player).length;

export const piecesLeft = (state, player) => piecesOnBoard(state, player) + state.inHand[player];

export const formsMill = (field, point, player) =>
  MILLS_AT[point].some((mill) => mill.every((member) => field[member] === player));

export const isInMill = (field, point) =>
  field[point] !== NONE && formsMill(field, point, field[point]);

export const phaseOf = (state, rules = DEFAULT_RULES) => {
  if (state.pendingRemoval) return REMOVING;
  if (state.inHand[state.active] > 0) return PLACING;
  if (rules.flying && piecesOnBoard(state, state.active) === 3) return FLYING;
  return MOVING;
};

/** Opponent pieces outside any mill, or all of them when every one stands in a mill. */
const removablePoints = (field, foe) => {
  const pieces = pointsOf(field, foe);
  const free = pieces.filter((point) => !isInMill(field, point));
  return free.length > 0 ? free : pieces;
};

export const getRemovals = (state) =>
  removablePoints(state.field, opponent(state.active)).map((at) => ({
    type: REMOVE,
    by: state.active,
    at
  }));

export const getPlacements = (state) =>
  emptyPoints(state.field).map((to) => ({ type: PLACE, by: state.active, to }));

export const getMoves = (state) =>
  pointsOf(state.field, state.active).flatMap((from) =>
    ADJACENCY[from]
      .filter((to) => state.field[to] === NONE)
      .map((to) => ({ type: MOVE, by: state.active, from, to }))
  );

export const getFlights = (state) => {
  const targets = emptyPoints(state.field);
  return pointsOf(state.field, state.active).flatMap((from) =>
    targets.map((to) => ({ type: FLY, by: state.active, from, to }))
  );
};

/** The same pieces on the same points with the same side to move form the same position. */
export const positionKey = (state) => `${state.field.join('')}${state.active}`;

/** A position occurring for the third time draws; it is never counted with a pending removal. */
export const isDraw = (state) =>
  !state.pendingRemoval && state.history !== null && state.history.count >= 3;

export const getActions = (state, rules = DEFAULT_RULES) => {
  if (state.pendingRemoval) return getRemovals(state);
  if (isDraw(state) || piecesLeft(state, state.active) < 3) return [];
  switch (phaseOf(state, rules)) {
    case PLACING:
      return getPlacements(state);
    case FLYING:
      return getFlights(state);
    default:
      return getMoves(state);
  }
};

const record = (history, key) => {
  let count = 1;
  for (let entry = history; entry !== null; entry = entry.previous) {
    if (entry.key === key) {
      count = entry.count + 1;
      break;
    }
  }
  return { key, count, previous: history };
};

/**
 * Hands the turn over. Positions are only counted once all pieces have been placed; a removal
 * makes every earlier position unreachable, so it starts a fresh history.
 */
const passTurn = (state, removed) => {
  const next = { ...state, active: opponent(state.active), pendingRemoval: false };
  const history = removed ? null : state.history;
  const placed = next.inHand[WHITE] === 0 && next.inHand[BLACK] === 0;
  return { ...next, history: placed ? record(history, positionKey(next)) : history };
};

const removalFollows = (state, rules) => {
  const pieces = pointsOf(state.field, opponent(state.active));
  if (pieces.length === 0) return false;
  if (!rules.skipRemovalInMills) return true;
  return pieces.some((point) => !isInMill(state.field, point));
};

export const applyAction = (state, action, rules = DEFAULT_RULES) => {
  const field = state.field.slice();
  if (action.type === REMOVE) {
    field[action.at] = NONE;
    return passTurn({ ...state, field, previousAction: action }, true);
  }
  let inHand = state.inHand;
  if (action.type === PLACE) {
    inHand = inHand.slice();
    inHand[state.active] -= 1;
  } else {
    field[action.from] = NONE;
  }
  field[action.to] = state.active;
  const next = { ...state, field, inHand, previousAction: action };
  if (formsMill(field, action.to, state.active) && removalFollows(next, rules)) {
    return { ...next, pendingRemoval: true };
  }
  return passTurn(next, false);
};

/** A drawn game scores one half each; otherwise the side to move has lost and is marked with 1. */
export const getResult = (state) => {
  if (isDraw(state)) return [0.5, 0.5];
  return state.active === WHITE ? [1, 0] : [0, 1];
};

export const isGameOver = (state, rules = DEFAULT_RULES) => getActions(state, rules).length === 0;

const DIAGRAM = [
  '7 +--------+--------+',
  '  |        |        |',
  '6 |  +-----+-----+  |',
  '  |  |     |     |  |',
  '5 |  |  +--+--+  |  |',
  '  |  |  |     |  |  |',
  '4 +--+--+     +--+--+',
  '  |  |  |     |  |  |',
  '3 |  |  +--+--+  |  |',
  '  |  |     |     |  |',
  '2 |  +-----+-----+  |',
  '  |        |        |',
  '1 +--------+--------+',
  '  a  b  c  d  e  f  g'
];

/** Text diagram in the style of rules.md with `W`, `B` and `+` for the points. */
export const render = (state) => {
  const lines = DIAGRAM.map((line) => [...line]);
  POINTS.forEach((point, index) => {
    const piece = state.field[index];
    lines[2 * (6 - point.y)][2 + 3 * point.x] = piece === WHITE ? 'W' : piece === BLACK ? 'B' : '+';
  });
  return lines.map((line) => line.join('')).join('\n');
};
