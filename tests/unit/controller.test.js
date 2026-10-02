import { describe, expect, it, vi } from 'vitest';
import {
  BLACK,
  createInitialState,
  getActions,
  NONE,
  PLACE,
  REMOVE,
  WHITE
} from '../../html5/src/js/core/board.js';
import { toAlgebraic } from '../../html5/src/js/core/topology.js';
import {
  createController,
  describe as describeBoard,
  MAX_ITERATIONS,
  MAX_TIME,
  toRules
} from '../../html5/src/js/worker/controller.js';
import { stateFrom } from './helpers/state.js';

const RULES = { flying: true, skipRemovalInMills: false };

const HUMANS = {
  class: 'request',
  playerwhite: 'Human',
  playerblack: 'Human',
  flying: true,
  skipRemovalInMills: false
};

const AI_WHITE = { ...HUMANS, playerwhite: 'AI' };

const scope = () => {
  const messages = [];
  return { messages, postMessage: (message) => messages.push(message) };
};

const send = (controller, data) => controller.handleMessage({ data });

describe('board snapshot', () => {
  it('describes square, hands, phase, turn, actions and who plays next', () => {
    const board = describeBoard(createInitialState(), RULES, HUMANS);
    expect(board.turn).toBe(WHITE);
    expect(board.phase).toBe('placing');
    expect(board.inHand).toEqual([9, 9]);
    expect(board.square).toHaveLength(24);
    expect(board.square.every((piece) => piece === NONE)).toBe(true);
    expect(board.actions).toHaveLength(24);
    expect(board.pendingRemoval).toBe(false);
    expect(board.outcome).toBeNull();
    expect(board.nextishuman).toBe(true);
    expect(board.previous).toBeNull();
  });

  it('describes a pending removal', () => {
    const state = stateFrom({ white: ['a7', 'd7', 'g7'], black: ['b6'], pendingRemoval: true });
    const board = describeBoard(state, RULES, HUMANS);
    expect(board.phase).toBe('removing');
    expect(board.pendingRemoval).toBe(true);
    expect(board.actions.map((action) => action.type)).toEqual([REMOVE]);
  });

  it('marks the next turn as non human for the AI and for a finished game', () => {
    expect(describeBoard(createInitialState(), RULES, AI_WHITE).nextishuman).toBe(false);
    const lost = stateFrom({ white: ['a1', 'd1'], black: ['b4', 'f6', 'd7'] });
    expect(describeBoard(lost, RULES, HUMANS).nextishuman).toBe(false);
  });

  it('describes the winner, the draw and why the game ended', () => {
    const lost = stateFrom({ white: ['a1', 'd1'], black: ['b4', 'f6', 'd7'] });
    expect(describeBoard(lost, RULES, HUMANS).outcome).toEqual({
      winner: BLACK,
      reason: 'fewer-than-three-pieces'
    });
    const blocked = stateFrom({ white: ['a1', 'd1', 'g1'], black: ['a4', 'd2', 'g4', 'f6'] });
    const noFlying = { flying: false, skipRemovalInMills: false };
    expect(describeBoard(blocked, noFlying, HUMANS).outcome).toEqual({
      winner: BLACK,
      reason: 'no-legal-move'
    });
    const repeated = stateFrom({
      white: ['a1', 'b2', 'f6', 'd7'],
      black: ['g1', 'f2', 'b6', 'e3'],
      history: { key: 'x', count: 3, previous: null }
    });
    expect(describeBoard(repeated, RULES, HUMANS).outcome).toEqual({
      winner: null,
      reason: 'threefold-repetition'
    });
  });
});

describe('controller', () => {
  it('answers start with a redraw of the initial position', () => {
    const host = scope();
    const controller = createController(host);
    expect(send(controller, { ...HUMANS, request: 'start' })).toBe(true);
    expect(host.messages).toHaveLength(1);
    expect(host.messages[0]).toMatchObject({
      eventClass: 'request',
      request: 'redraw',
      actioninfo: null
    });
    expect(host.messages[0].board.actions).toHaveLength(24);
  });

  it('applies a human action and redraws', () => {
    const host = scope();
    const controller = createController(host);
    const action = getActions(createInitialState(), RULES).find(
      (candidate) => toAlgebraic(candidate.to) === 'd2'
    );
    send(controller, { ...HUMANS, request: 'perform', action });
    expect(controller.getState().active).toBe(BLACK);
    expect(host.messages[0].board.turn).toBe(BLACK);
    expect(host.messages[0].board.inHand).toEqual([8, 9]);
    expect(host.messages[0].actioninfo.action).toBe(action);
  });

  it('keeps the turn for the removal after a mill', () => {
    const host = scope();
    const controller = createController(host);
    controller.setState(stateFrom({ white: ['a7', 'd7'], black: ['b6', 'b2'], inHand: [3, 3] }));
    const action = getActions(controller.getState(), RULES).find(
      (candidate) => toAlgebraic(candidate.to) === 'g7'
    );
    expect(action.type).toBe(PLACE);
    send(controller, { ...HUMANS, request: 'perform', action });
    expect(controller.getState().active).toBe(WHITE);
    expect(host.messages[0].board.turn).toBe(WHITE);
    expect(host.messages[0].board.pendingRemoval).toBe(true);
    expect(host.messages[0].board.actions.every((each) => each.type === REMOVE)).toBe(true);
  });

  it('lets the engine choose and apply an action', () => {
    const host = scope();
    const action = getActions(createInitialState(), RULES)[0];
    const search = vi.fn(() => ({ action, info: 'test' }));
    const controller = createController(host, { search });
    send(controller, { ...AI_WHITE, request: 'actionbyai' });
    expect(search).toHaveBeenCalledWith(expect.anything(), {
      maxIterations: MAX_ITERATIONS,
      maxTime: MAX_TIME,
      rules: RULES
    });
    expect(controller.getState().active).toBe(BLACK);
    expect(host.messages[0].actioninfo.info).toBe('test');
  });

  it('applies the rule options before evaluating an action', () => {
    expect(toRules({})).toEqual({ flying: true, skipRemovalInMills: false });
    expect(toRules({ flying: false, skipRemovalInMills: true, showavailablemove: true })).toEqual({
      flying: false,
      skipRemovalInMills: true
    });
    const host = scope();
    const search = vi.fn(() => ({ action: null, info: 'none' }));
    const controller = createController(host, { search });
    send(controller, {
      ...AI_WHITE,
      request: 'actionbyai',
      flying: false,
      skipRemovalInMills: true
    });
    expect(search.mock.calls[0][1].rules).toEqual({ flying: false, skipRemovalInMills: true });
    controller.setState(
      stateFrom({ white: ['a7', 'd7'], black: ['a1', 'd1', 'g1'], inHand: [3, 3] })
    );
    const action = getActions(controller.getState(), RULES).find(
      (candidate) => toAlgebraic(candidate.to) === 'g7'
    );
    send(controller, { ...HUMANS, request: 'perform', action, skipRemovalInMills: true });
    expect(controller.getState().pendingRemoval).toBe(false);
    expect(controller.getState().active).toBe(BLACK);
  });

  it('only redraws when the engine finds no action', () => {
    const host = scope();
    const search = () => ({ action: null, info: 'none' });
    const controller = createController(host, { search });
    send(controller, { ...AI_WHITE, request: 'actionbyai' });
    expect(host.messages).toHaveLength(1);
    expect(host.messages[0].actioninfo).toBeNull();
    expect(controller.getState().active).toBe(WHITE);
  });

  it('restores the initial position on restart', () => {
    const host = scope();
    const controller = createController(host);
    controller.setState(stateFrom({ white: ['a1'], active: BLACK }));
    send(controller, { ...HUMANS, request: 'restart' });
    expect(host.messages.map((message) => message.request)).toEqual(['restore', 'redraw']);
    expect(controller.getState().active).toBe(WHITE);
    expect(host.messages[1].board.actions).toHaveLength(24);
  });

  it('ignores unknown requests and foreign message classes', () => {
    const host = scope();
    const controller = createController(host);
    expect(send(controller, { ...HUMANS, request: 'nonsense' })).toBe(false);
    expect(send(controller, { class: 'response', state: 'message' })).toBe(false);
    expect(host.messages).toHaveLength(0);
  });
});
