import { describe, expect, it } from 'vitest';
import { createInitialState, getActions } from '../../html5/src/js/core/board.js';
import { toAlgebraic } from '../../html5/src/js/core/topology.js';
import { getActionInfo } from '../../html5/src/js/engine/random.js';
import { stateFrom } from './helpers/state.js';

const RULES = { flying: true, skipRemovalInMills: false };

describe('random engine', () => {
  it('picks the action addressed by the random source', () => {
    const state = createInitialState();
    const actions = getActions(state, RULES);
    const result = getActionInfo(state, { rules: RULES, random: () => 0.99 });
    expect(result.action).toStrictEqual(actions[actions.length - 1]);
    expect(result.info).toBe('Random select out of 24 available actions.');
  });

  it('picks the first action for a zero sample', () => {
    const result = getActionInfo(createInitialState(), { rules: RULES, random: () => 0 });
    expect(toAlgebraic(result.action.to)).toBe('a1');
  });

  it('returns no action when the game is over', () => {
    const lost = stateFrom({ white: ['a1', 'd1'], black: ['b4', 'f6', 'd7'] });
    const result = getActionInfo(lost, { rules: RULES });
    expect(result.action).toBeNull();
    expect(result.info).toBe('Random select out of 0 available actions.');
  });

  it('falls back to Math.random and the default rules', () => {
    expect(getActionInfo(createInitialState()).action).not.toBeNull();
  });
});
