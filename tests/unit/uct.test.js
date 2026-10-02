import { describe, expect, it } from 'vitest';
import {
  applyAction,
  BLACK,
  createInitialState,
  getActions,
  MOVE,
  REMOVE,
  WHITE
} from '../../html5/src/js/core/board.js';
import { toAlgebraic } from '../../html5/src/js/core/topology.js';
import {
  addChild,
  BLOCK_SIZE,
  backpropagate,
  createNode,
  getActionInfo,
  mostVisitedChild,
  playout,
  selectChild,
  ucb1,
  update
} from '../../html5/src/js/engine/uct.js';
import { stateFrom } from './helpers/state.js';

const RULES = { flying: true, skipRemovalInMills: false };

/** White has to remove a piece; every removal leaves Black with two pieces. */
const winningRemoval = () =>
  stateFrom({ white: ['a7', 'd7', 'g7'], black: ['a1', 'd1', 'g1'], pendingRemoval: true });

/** White has to remove a piece and only b6 is outside a mill. */
const singleRemoval = () =>
  stateFrom({
    white: ['a7', 'd7', 'g7'],
    black: ['a1', 'd1', 'g1', 'b6'],
    pendingRemoval: true
  });

/** White wins at once with g4-g1 and the following removal. */
const millToClose = () => stateFrom({ white: ['a1', 'd1', 'g4', 'b6'], black: ['b4', 'f6', 'd7'] });

const finished = () => stateFrom({ white: ['a1', 'd1'], black: ['b4', 'f6', 'd7'] });

const sequence = (values) => {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
};

/** Small deterministic pseudo random generator (mulberry32). */
const seeded = (seed) => {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

describe('uct nodes', () => {
  it('collects the untried actions and the player who moved', () => {
    const state = createInitialState();
    const node = createNode(null, state, null, RULES);
    expect(node.unexamined).toHaveLength(24);
    expect(node.mover).toBeNull();
    expect(node.children).toEqual([]);
    expect(node.parentNode).toBeNull();
  });

  it('computes the UCB1 value', () => {
    const child = { wins: 3, visits: 4 };
    expect(ucb1(child, 10)).toBeCloseTo(3 / 4 + Math.sqrt((2 * Math.log(10)) / 4), 12);
  });

  it('selects the child with the greatest UCB1 value and none without children', () => {
    expect(selectChild({ visits: 10, children: [] })).toBeNull();
    const weak = { wins: 0, visits: 5 };
    const strong = { wins: 5, visits: 5 };
    expect(selectChild({ visits: 10, children: [weak, strong] })).toBe(strong);
    expect(selectChild({ visits: 10, children: [strong, weak] })).toBe(strong);
  });

  it('moves an action from unexamined into a child node', () => {
    const state = createInitialState();
    const node = createNode(null, state, null, RULES);
    const child = addChild(node, applyAction(state, node.unexamined[0], RULES), 0, RULES);
    expect(node.unexamined).toHaveLength(23);
    expect(node.children).toEqual([child]);
    expect(child.parentNode).toBe(node);
    expect(child.mover).toBe(WHITE);
  });

  it('accumulates the result for the player who moved there', () => {
    const node = { wins: 0, visits: 0, mover: BLACK };
    update(node, [0, 1]);
    expect(node).toMatchObject({ wins: 0, visits: 1 });
    update(node, [1, 0]);
    expect(node).toMatchObject({ wins: 1, visits: 2 });
    const root = { wins: 0, visits: 0, mover: null };
    update(root, [1, 0]);
    expect(root).toMatchObject({ wins: 0, visits: 1 });
  });

  it('credits a draw with one half', () => {
    const node = { wins: 0, visits: 0, mover: WHITE };
    update(node, [0.5, 0.5]);
    expect(node).toMatchObject({ wins: 0.5, visits: 1 });
  });

  it('scores the mill-closing edge for the player keeping the turn', () => {
    const state = millToClose();
    const root = createNode(null, state, null, RULES);
    const index = root.unexamined.findIndex(
      (action) => toAlgebraic(action.from) === 'g4' && toAlgebraic(action.to) === 'g1'
    );
    const after = applyAction(state, root.unexamined[index], RULES);
    expect(after.active).toBe(WHITE);
    const child = addChild(root, after, index, RULES);
    update(child, [0, 1]);
    expect(child.wins).toBe(1);
  });

  it('reports the most visited child', () => {
    expect(mostVisitedChild({ children: [] })).toBeNull();
    const rare = { visits: 1 };
    const common = { visits: 7 };
    expect(mostVisitedChild({ children: [rare, common] })).toBe(common);
    expect(mostVisitedChild({ children: [common, rare] })).toBe(common);
  });

  it('backpropagates up to the root', () => {
    const root = { wins: 0, visits: 0, mover: null, parentNode: null };
    const leaf = { wins: 0, visits: 0, mover: WHITE, parentNode: root };
    backpropagate(leaf, [0, 1]);
    expect(leaf).toMatchObject({ wins: 1, visits: 1 });
    expect(root).toMatchObject({ wins: 0, visits: 1 });
  });
});

describe('playout', () => {
  it('expands one node and simulates to a terminal position', () => {
    const state = winningRemoval();
    const root = createNode(null, state, null, RULES);
    const simulated = playout(root, state, RULES, sequence([0]));
    expect(root.children).toHaveLength(1);
    expect(root.visits).toBe(1);
    expect(root.children[0].wins).toBe(1);
    expect(simulated).toBe(0);
  });

  it('counts the simulated actions of a rollout', () => {
    const state = createInitialState();
    const root = createNode(null, state, null, RULES);
    expect(playout(root, state, RULES, seeded(7))).toBeGreaterThan(0);
  });

  it('descends through fully expanded nodes', () => {
    const state = singleRemoval();
    const root = createNode(null, state, null, RULES);
    playout(root, state, RULES, sequence([0]));
    expect(root.unexamined).toHaveLength(0);
    playout(root, state, RULES, sequence([0]));
    expect(root.visits).toBe(2);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].visits).toBe(2);
  });
});

describe('getActionInfo', () => {
  it('closes an available mill', () => {
    const result = getActionInfo(millToClose(), {
      maxIterations: 400,
      maxTime: 60_000,
      rules: RULES,
      random: seeded(1),
      now: () => 0
    });
    expect(result.action.type).toBe(MOVE);
    expect(toAlgebraic(result.action.from)).toBe('g4');
    expect(toAlgebraic(result.action.to)).toBe('g1');
    expect(result.info).toMatch(/nodes\/sec examined\.$/);
  });

  it('searches the removal as an action of its own', () => {
    const result = getActionInfo(winningRemoval(), {
      maxIterations: 3,
      maxTime: 100,
      rules: RULES,
      blockSize: 1,
      random: () => 0,
      now: sequence([0, 1, 2, 3, 4, 5])
    });
    expect(result.action.type).toBe(REMOVE);
    expect(result.action.by).toBe(WHITE);
  });

  it('returns no action for a finished game', () => {
    const state = finished();
    expect(getActions(state, RULES)).toEqual([]);
    const result = getActionInfo(state, {
      maxIterations: 1,
      maxTime: 0,
      rules: RULES,
      blockSize: 1,
      now: () => 0
    });
    expect(result.action).toBeNull();
    expect(result.info).toBe('0 nodes/sec examined.');
  });

  it('stops as soon as the time budget is spent', () => {
    let calls = 0;
    const now = () => (calls++ === 0 ? 0 : 10_000);
    const result = getActionInfo(createInitialState(), {
      maxIterations: 10_000,
      maxTime: 5,
      rules: RULES,
      blockSize: 1,
      now
    });
    expect(result.action).toBeNull();
  });

  it('defaults to a block size of fifty', () => {
    expect(BLOCK_SIZE).toBe(50);
  });

  it('uses Math.random and Date.now by default', () => {
    const result = getActionInfo(winningRemoval(), {
      maxIterations: 1,
      maxTime: 1000,
      rules: RULES,
      blockSize: 2
    });
    expect(result.action).not.toBeNull();
  });
});
