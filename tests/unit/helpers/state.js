import { NONE, WHITE } from '../../../html5/src/js/core/board.js';
import { BLACK, fromAlgebraic, POINT_COUNT } from '../../../html5/src/js/core/topology.js';

export const at = fromAlgebraic;

/** Builds a position from algebraic point names; by default all pieces are placed. */
export const stateFrom = ({
  white = [],
  black = [],
  active = WHITE,
  inHand = [0, 0],
  pendingRemoval = false,
  history = null,
  previousAction = null
} = {}) => {
  const field = new Array(POINT_COUNT).fill(NONE);
  for (const name of white) field[at(name)] = WHITE;
  for (const name of black) field[at(name)] = BLACK;
  return { field, active, inHand, pendingRemoval, history, previousAction };
};
