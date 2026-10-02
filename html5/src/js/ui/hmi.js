//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import { PLACING, REMOVING, WHITE } from '../core/board.js';
import { fromAlgebraic, toAlgebraic } from '../core/topology.js';
import { readOptions, request } from './options.js';
import { VIEW_HEIGHT, VIEW_WIDTH } from './svgBoard.js';

export const OFFSET_HEIGHT = 64;
export const MIN_ICON = 38;
export const MAX_ICON = 100;
export const ICON_IDS = ['customMenu', 'customBackRules', 'customBackOptions', 'customBackAbout'];

/** Size of one board unit so that the whole 9 x 7 canvas fits into the free area. */
export const boardUnit = (innerWidth, innerHeight) =>
  Math.min((innerWidth - 32) / VIEW_WIDTH, (innerHeight - OFFSET_HEIGHT) / VIEW_HEIGHT);

export const iconSize = (unit) => Math.min(MAX_ICON, Math.max(MIN_ICON, unit * 0.7));

export const activePlayerBadge = (board, options) => {
  const white = board.turn === WHITE;
  const type = (white ? options.playerwhite : options.playerblack) === 'AI' ? 'AI' : 'Human';
  const side = white ? '○' : '●';
  const inHand = board.inHand?.[board.turn] ?? 0;
  const removing = board.pendingRemoval === true;
  const details = [
    ...(inHand > 0 ? [`${inHand} in hand`] : []),
    ...(removing ? ['removes a piece'] : [])
  ];
  return {
    label: [`${type} Player ${side}`, ...details].join(', '),
    symbol: `${type === 'AI' ? '🤖' : '🧑'}${side}${removing ? '✂' : inHand > 0 ? inHand : ''}`
  };
};

const pointOf = (node) => fromAlgebraic(node.getAttribute('data-point'));

export const createHmi = ({ doc, view, engine, win = globalThis }) => {
  let board = null;
  let selection = null;

  const post = (name, extra = {}) => engine.postMessage({ ...request(doc, name), ...extra });

  const resize = () => {
    const unit = boardUnit(win.innerWidth, win.innerHeight);
    view.setSize(unit);
    const boardElement = doc.getElementById('board');
    boardElement.style.marginTop = `${(win.innerHeight - OFFSET_HEIGHT - VIEW_HEIGHT * unit) / 2}px`;
    doc.getElementById('game-page').style.backgroundSize = `auto ${unit}px`;
    const icon = iconSize(unit);
    doc
      .getElementById('game-page')
      .style.setProperty('--game-title-bar-height', `${Math.max(OFFSET_HEIGHT, icon + 6)}px`);
    for (const id of ICON_IDS) {
      const node = doc.getElementById(id);
      if (node === null) continue;
      node.style.width = `${icon}px`;
      node.style.height = `${icon}px`;
      node.style.backgroundSize = `${icon}px ${icon}px`;
    }
  };

  const phase = () => board.phase ?? (board.pendingRemoval ? REMOVING : null);

  const matchesSelection = (action) =>
    action.from === undefined || (selection !== null && action.from === selection.from);

  const clearHighlights = () => {
    if (board === null) return;
    for (const action of board.actions) {
      if (action.from !== undefined) view.setSourceSelectable(action.from, false);
      if (action.at !== undefined) view.setRemovable(action.at, false);
      if (action.to !== undefined) view.setTargetVisible(action.to, false);
    }
  };

  const submit = (chosen) => {
    view.clearHandlers();
    clearHighlights();
    if (chosen === undefined) return;
    selection = null;
    post('perform', { action: chosen });
  };

  const clickTarget = (event) => {
    const to = pointOf(event.currentTarget);
    submit(board.actions.find((action) => action.to === to && matchesSelection(action)));
  };

  const clickRemove = (event) => {
    const at = pointOf(event.currentTarget);
    submit(board.actions.find((action) => action.at === at));
  };

  const offerTargets = () => {
    const visible = readOptions(doc).showavailablemove;
    for (const action of board.actions) {
      if (!matchesSelection(action)) continue;
      view.setTargetVisible(action.to, visible);
      view.bind(view.at(action.to), clickTarget);
    }
  };

  const deactivateSelection = () => {
    if (selection === null) return;
    view.setSourceSelected(selection.from, false);
    for (const action of board.actions) {
      if (action.from !== selection.from) continue;
      view.setTargetVisible(action.to, false);
      view.unbind(view.at(action.to));
    }
  };

  const clickSelect = (event) => {
    deactivateSelection();
    selection = { from: pointOf(event.currentTarget) };
    view.setSourceSelected(selection.from, true);
    offerTargets();
  };

  const prepareHumanMove = () => {
    if (phase() === REMOVING) {
      for (const action of board.actions) {
        view.setRemovable(action.at, true);
        view.bind(view.at(action.at), clickRemove);
      }
      return;
    }
    if (phase() === PLACING) {
      offerTargets();
      return;
    }
    for (const action of board.actions) {
      view.setSourceSelectable(action.from, true);
      view.bind(view.at(action.from), clickSelect);
    }
  };

  const requestAiAction = () => post('actionbyai');

  const continueTurn = () => {
    if (board.nextishuman) prepareHumanMove();
    else if (board.actions.length > 0) requestAiAction();
  };

  const update = (next, actionInfo) => {
    resize();
    clearHighlights();
    view.setCelebration(null);
    const options = readOptions(doc);
    view.showNotation(options.showalgebraicnotation);
    const badge = activePlayerBadge(next, options);
    const badgeNode = doc.getElementById('active-player');
    badgeNode.querySelector('.active-player-symbol').textContent = badge.symbol;
    badgeNode.setAttribute('aria-label', badge.label);
    badgeNode.setAttribute('title', badge.label);
    board = next;
    selection = null;
    if (actionInfo) {
      view.animateAction(actionInfo.action, () => {
        view.setLastMove(actionInfo.action);
        view.setCelebration(next.outcome ?? null);
        continueTurn();
      });
    } else {
      view.setCelebration(next.outcome ?? null);
      continueTurn();
    }
  };

  const restart = () => {
    view.clearHandlers();
    clearHighlights();
    selection = null;
    post('restart');
  };

  const handleEngineMessage = (event) => {
    const data = event.data;
    if (data.eventClass !== 'request') return false;
    if (data.request === 'redraw') {
      update(data.board, data.actioninfo);
      return true;
    }
    if (data.request === 'restore') {
      view.setLastMove(null);
      view.setCelebration(null);
      view.restoreInitial();
      return true;
    }
    return false;
  };

  return {
    resize,
    update,
    restart,
    handleEngineMessage,
    start: () => post('start'),
    getSelection: () => selection,
    describeSelection: () => (selection === null ? null : toAlgebraic(selection.from))
  };
};
