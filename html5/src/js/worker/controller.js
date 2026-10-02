//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import {
  applyAction,
  BLACK,
  createInitialState,
  getActions,
  isDraw,
  NONE,
  phaseOf,
  piecesLeft
} from '../core/board.js';
import { opponent } from '../core/topology.js';
import { getActionInfo } from '../engine/uct.js';

export const MAX_ITERATIONS = 8000;
export const MAX_TIME = 5000;

export const toRules = (data) => ({
  flying: data.flying !== false,
  skipRemovalInMills: data.skipRemovalInMills === true
});

const isHuman = (data, turn) => (turn === BLACK ? data.playerblack : data.playerwhite) === 'Human';

const outcomeOf = (state, actions) => {
  if (actions.length > 0) return null;
  if (isDraw(state)) return { winner: null, reason: 'threefold-repetition' };
  return {
    winner: opponent(state.active),
    reason: piecesLeft(state, state.active) < 3 ? 'fewer-than-three-pieces' : 'no-legal-move'
  };
};

export const describe = (state, rules, data) => {
  const actions = getActions(state, rules);
  return {
    square: state.field.slice(),
    turn: state.active,
    phase: phaseOf(state, rules),
    inHand: state.inHand.slice(),
    actions,
    pendingRemoval: state.pendingRemoval,
    previous: state.previousAction,
    outcome: outcomeOf(state, actions),
    nextishuman: actions.length > 0 && isHuman(data, state.active)
  };
};

/**
 * Owns the authoritative game state. `scope` is the worker global (or any object
 * exposing postMessage), `search` is injected to keep the controller testable.
 */
export const createController = (scope, { search = getActionInfo } = {}) => {
  let state = createInitialState();

  const send = (message) => scope.postMessage(message);

  const draw = (data, actionInfo) => {
    const rules = toRules(data);
    send({
      eventClass: 'request',
      request: 'redraw',
      board: describe(state, rules, data),
      actioninfo: actionInfo
    });
  };

  const perform = (data) => {
    state = applyAction(state, data.action, toRules(data));
    draw(data, data);
  };

  const actionByAi = (data) => {
    const rules = toRules(data);
    const actionInfo = search(state, {
      maxIterations: MAX_ITERATIONS,
      maxTime: MAX_TIME,
      rules
    });
    if (actionInfo.action === null) {
      draw(data, null);
      return;
    }
    state = applyAction(state, actionInfo.action, rules);
    draw(data, actionInfo);
  };

  const restart = (data) => {
    state = createInitialState();
    send({
      eventClass: 'request',
      request: 'restore',
      board: describe(state, toRules(data), data)
    });
    draw(data, null);
  };

  const handlers = {
    start: (data) => draw(data, null),
    restart,
    perform,
    actionbyai: actionByAi
  };

  const handleRequest = (data) => {
    const handler = handlers[data.request];
    if (handler === undefined) return false;
    handler(data);
    return true;
  };

  const handleMessage = (event) => {
    const data = event.data;
    if (data.class !== 'request') return false;
    return handleRequest(data);
  };

  return {
    handleMessage,
    getState: () => state,
    setState: (next) => {
      state = next;
    }
  };
};

export { NONE };
