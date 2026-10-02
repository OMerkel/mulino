import { describe, expect, it } from 'vitest';
import {
  applyAction,
  BLACK,
  createInitialState,
  DEFAULT_RULES,
  FLY,
  FLYING,
  formsMill,
  getActions,
  getFlights,
  getMoves,
  getPlacements,
  getRemovals,
  getResult,
  isDraw,
  isGameOver,
  isInMill,
  MOVE,
  MOVING,
  NONE,
  PIECES,
  PLACE,
  PLACING,
  phaseOf,
  pieceAt,
  piecesLeft,
  piecesOnBoard,
  positionKey,
  REMOVE,
  REMOVING,
  render,
  WHITE
} from '../../html5/src/js/core/board.js';
import { toAlgebraic } from '../../html5/src/js/core/topology.js';
import { at, stateFrom } from './helpers/state.js';

const notation = (action) => {
  if (action.type === REMOVE) return `x${toAlgebraic(action.at)}`;
  if (action.type === PLACE) return toAlgebraic(action.to);
  return `${toAlgebraic(action.from)}-${toAlgebraic(action.to)}`;
};

const notations = (actions) => actions.map(notation).sort();

const find = (state, text, rules = DEFAULT_RULES) => {
  const action = getActions(state, rules).find((candidate) => notation(candidate) === text);
  if (action === undefined) throw new Error(`no legal action ${text}`);
  return action;
};

const play = (state, texts, rules = DEFAULT_RULES) =>
  texts.reduce((current, text) => applyAction(current, find(current, text, rules), rules), state);

describe('setup', () => {
  const state = createInitialState();

  it('starts with an empty board and nine pieces in each hand', () => {
    expect(state.field).toHaveLength(24);
    expect(state.field.every((piece) => piece === NONE)).toBe(true);
    expect(state.inHand).toEqual([PIECES, PIECES]);
    expect(PIECES).toBe(9);
    expect(state.pendingRemoval).toBe(false);
    expect(state.history).toBeNull();
  });

  it('lets white place first', () => {
    expect(state.active).toBe(WHITE);
    expect(phaseOf(state)).toBe(PLACING);
    expect(state.previousAction).toBeNull();
  });

  it('renders a text diagram', () => {
    const text = render(play(state, ['a7', 'g1']));
    expect(text.split('\n')[0]).toBe('7 W--------+--------+');
    expect(text.split('\n')[12]).toBe('1 +--------+--------B');
    expect(text).toContain('  a  b  c  d  e  f  g');
  });
});

describe('placing', () => {
  it('offers every empty point while pieces are in hand', () => {
    const state = createInitialState();
    expect(getActions(state)).toHaveLength(24);
    expect(getActions(state).every((action) => action.type === PLACE)).toBe(true);
    const after = play(state, ['d2']);
    expect(getPlacements(after)).toHaveLength(23);
    expect(notations(getPlacements(after))).not.toContain('d2');
  });

  it('switches the player after an action without mill', () => {
    const after = play(createInitialState(), ['d2']);
    expect(after.active).toBe(BLACK);
    expect(after.inHand).toEqual([8, 9]);
    expect(pieceAt(after, at('d2'))).toBe(WHITE);
    expect(after.previousAction.type).toBe(PLACE);
  });

  it('never targets an occupied point', () => {
    const state = stateFrom({ white: ['a1', 'd1', 'b2'], black: ['g1', 'd2', 'f2'] });
    expect(notations(getMoves(state))).toEqual(['a1-a4', 'b2-b4']);
    for (const action of [...getMoves(state), ...getFlights(state)]) {
      expect(state.field[action.to]).toBe(NONE);
    }
  });
});

describe('mills and removal', () => {
  const closing = () =>
    stateFrom({ white: ['a7', 'd7'], black: ['b6', 'a1', 'd1', 'g1'], inHand: [5, 5] });

  it('keeps the turn for a removal after closing a mill', () => {
    const after = play(closing(), ['g7']);
    expect(after.active).toBe(WHITE);
    expect(after.pendingRemoval).toBe(true);
    expect(phaseOf(after)).toBe(REMOVING);
    expect(formsMill(after.field, at('g7'), WHITE)).toBe(true);
  });

  it('offers only removals while a removal is pending', () => {
    const after = play(closing(), ['g7']);
    expect(getActions(after).every((action) => action.type === REMOVE)).toBe(true);
    const removed = play(after, ['xb6']);
    expect(removed.active).toBe(BLACK);
    expect(removed.pendingRemoval).toBe(false);
    expect(pieceAt(removed, at('b6'))).toBe(NONE);
  });

  it('protects pieces in a mill while others are available', () => {
    const after = play(closing(), ['g7']);
    expect(notations(getActions(after))).toEqual(['xb6']);
    expect(isInMill(after.field, at('a1'))).toBe(true);
    expect(isInMill(after.field, at('b6'))).toBe(false);
    expect(isInMill(after.field, at('d5'))).toBe(false);
  });

  it('allows taking from a mill when every piece is in one', () => {
    const state = stateFrom({ white: ['a7', 'd7'], black: ['a1', 'd1', 'g1'], inHand: [5, 5] });
    expect(notations(getActions(play(state, ['g7'])))).toEqual(['xa1', 'xd1', 'xg1']);
  });

  it('skips the removal when every piece is in a mill and the option is set', () => {
    const rules = { flying: true, skipRemovalInMills: true };
    const state = stateFrom({ white: ['a7', 'd7'], black: ['a1', 'd1', 'g1'], inHand: [5, 5] });
    const after = play(state, ['g7'], rules);
    expect(after.pendingRemoval).toBe(false);
    expect(after.active).toBe(BLACK);
    const protectedOnly = play(closing(), ['g7'], rules);
    expect(protectedOnly.pendingRemoval).toBe(true);
  });

  it('removes nothing when the opponent has no piece on the board', () => {
    const state = stateFrom({ white: ['a7', 'd7'], inHand: [5, 5] });
    const after = play(state, ['g7']);
    expect(after.pendingRemoval).toBe(false);
    expect(after.active).toBe(BLACK);
  });

  it('removes only one piece for two mills closed at once', () => {
    const state = stateFrom({
      white: ['d7', 'g7', 'a1', 'a4'],
      black: ['b2', 'f2', 'd6'],
      inHand: [3, 3]
    });
    const after = play(state, ['a7']);
    expect(after.pendingRemoval).toBe(true);
    const removed = play(after, ['xb2']);
    expect(removed.active).toBe(BLACK);
    expect(piecesOnBoard(removed, BLACK)).toBe(2);
    expect(getRemovals(removed).every((action) => action.by === BLACK)).toBe(true);
  });
});

describe('moving and flying', () => {
  const moving = () =>
    stateFrom({ white: ['a1', 'd1', 'g4', 'b6'], black: ['d2', 'b4', 'f6', 'd7'] });

  it('slides only to adjacent empty points after placing', () => {
    const state = moving();
    expect(phaseOf(state)).toBe(MOVING);
    expect(notations(getActions(state))).toEqual([
      'a1-a4',
      'b6-d6',
      'd1-g1',
      'g4-f4',
      'g4-g1',
      'g4-g7'
    ]);
    expect(getActions(state).every((action) => action.type === MOVE)).toBe(true);
  });

  it('counts a reformed mill again', () => {
    const state = stateFrom({ white: ['a1', 'd1', 'g1', 'b6'], black: ['d2', 'b4', 'f6', 'd7'] });
    const opened = play(state, ['g1-g4', 'd7-g7']);
    const reformed = play(opened, ['g4-g1']);
    expect(reformed.pendingRemoval).toBe(true);
    expect(reformed.active).toBe(WHITE);
  });

  it('flies with three pieces when flying is allowed', () => {
    const state = stateFrom({ white: ['a1', 'd1', 'g4'], black: ['d2', 'b4', 'f6', 'd7'] });
    expect(phaseOf(state)).toBe(FLYING);
    const actions = getActions(state);
    expect(actions.every((action) => action.type === FLY)).toBe(true);
    expect(actions).toHaveLength(3 * (24 - 7));
    const after = play(state, ['a1-g7']);
    expect(pieceAt(after, at('g7'))).toBe(WHITE);
    expect(after.active).toBe(BLACK);
  });

  it('keeps sliding with three pieces when flying is forbidden', () => {
    const rules = { flying: false, skipRemovalInMills: false };
    const state = stateFrom({ white: ['a1', 'd1', 'g4'], black: ['d2', 'b4', 'f6', 'd7'] });
    expect(phaseOf(state, rules)).toBe(MOVING);
    expect(getActions(state, rules).every((action) => action.type === MOVE)).toBe(true);
  });
});

describe('end of game', () => {
  it('ends the game when a side is down to two pieces', () => {
    const state = stateFrom({ white: ['a7', 'd7', 'g4'], black: ['a1', 'f6', 'd2'] });
    const pending = play(state, ['g4-g7']);
    expect(isGameOver(pending)).toBe(false);
    const finished = play(pending, ['xa1']);
    expect(piecesLeft(finished, BLACK)).toBe(2);
    expect(getActions(finished)).toEqual([]);
    expect(isGameOver(finished)).toBe(true);
  });

  it('detects a blocked side as the loser', () => {
    const rules = { flying: false, skipRemovalInMills: false };
    const state = stateFrom({ white: ['a1', 'd1', 'g1'], black: ['a4', 'd2', 'g4', 'f6'] });
    expect(getActions(state, rules)).toEqual([]);
    expect(isGameOver(state, rules)).toBe(true);
    expect(isGameOver(state)).toBe(false);
  });

  it('scores the side to move as the loser', () => {
    expect(getResult(stateFrom({ active: WHITE }))).toEqual([1, 0]);
    expect(getResult(stateFrom({ active: BLACK }))).toEqual([0, 1]);
  });
});

describe('threefold repetition', () => {
  const shuffle = ['a1-a4', 'g1-g4', 'a4-a1', 'g4-g1'];
  const start = () =>
    stateFrom({ white: ['a1', 'b2', 'f6', 'd7'], black: ['g1', 'f2', 'b6', 'e3'] });

  it('draws on the third occurrence of a position', () => {
    const twice = play(start(), [...shuffle, ...shuffle]);
    expect(twice.history.count).toBe(2);
    expect(twice.history.key).toBe(positionKey(start()));
    expect(isDraw(twice)).toBe(false);
    expect(getActions(twice).length).toBeGreaterThan(0);
    const thrice = play(twice, ['a1-a4']);
    expect(thrice.history.count).toBe(3);
    expect(isDraw(thrice)).toBe(true);
    expect(getActions(thrice)).toEqual([]);
  });

  it('scores a draw as one half each', () => {
    const thrice = play(start(), [...shuffle, ...shuffle, 'a1-a4']);
    expect(getResult(thrice)).toEqual([0.5, 0.5]);
  });

  it('ignores repetitions before all pieces are placed', () => {
    const placing = play(createInitialState(), ['a1', 'g1', 'd2', 'f2']);
    expect(placing.history).toBeNull();
    const lastPlacement = stateFrom({
      white: ['a1', 'b2', 'f6'],
      black: ['g1', 'f2', 'b6', 'e3'],
      inHand: [1, 0]
    });
    expect(play(lastPlacement, ['d7']).history.count).toBe(1);
  });

  it('does not count positions with a pending removal', () => {
    const third = { key: 'x', count: 3, previous: null };
    expect(isDraw(stateFrom({ pendingRemoval: true, history: third }))).toBe(false);
    expect(isDraw(stateFrom({ history: third }))).toBe(true);
    const history = { key: 'x', count: 1, previous: null };
    const state = stateFrom({
      white: ['a1', 'd1', 'g4', 'b6'],
      black: ['d2', 'b4', 'f6', 'd7'],
      history
    });
    const pending = play(state, ['g4-g1']);
    expect(pending.history).toBe(history);
    const removed = play(pending, ['xd2']);
    expect(removed.history.count).toBe(1);
    expect(removed.history.previous).toBeNull();
  });
});

describe('state handling', () => {
  it('leaves the previous state unchanged', () => {
    const state = stateFrom({ white: ['a7', 'd7'], black: ['b6'], inHand: [5, 5] });
    const snapshot = JSON.stringify(state);
    play(state, ['g7', 'xb6']);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('counts the pieces of a player', () => {
    const state = stateFrom({ white: ['a1', 'd1'], black: ['g1'], inHand: [2, 0] });
    expect(piecesOnBoard(state, WHITE)).toBe(2);
    expect(piecesLeft(state, WHITE)).toBe(4);
    expect(piecesLeft(state, BLACK)).toBe(1);
  });
});
