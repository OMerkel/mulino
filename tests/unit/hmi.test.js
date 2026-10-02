import { describe, expect, it } from 'vitest';
import { MOVE, PLACE, REMOVE, WHITE } from '../../html5/src/js/core/board.js';
import {
  activePlayerBadge,
  boardUnit,
  createHmi,
  iconSize,
  MAX_ICON,
  MIN_ICON,
  OFFSET_HEIGHT
} from '../../html5/src/js/ui/hmi.js';
import { createBoardView } from '../../html5/src/js/ui/svgBoard.js';
import { createController } from '../../html5/src/js/worker/controller.js';
import { createFakeWorker, immediate, loadApp } from './helpers/dom.js';
import { at, stateFrom } from './helpers/state.js';

const setup = () => {
  const { doc, win } = loadApp();
  const view = createBoardView(doc.getElementById('board'), { doc, schedule: immediate });
  const engine = createFakeWorker();
  const hmi = createHmi({ doc, view, engine, win });
  return { doc, win, view, engine, hmi };
};

/** Wires the real controller to the HMI so that whole turns can be played. */
const connected = (state = null) => {
  const context = setup();
  const controller = createController({
    postMessage: (message) => context.engine.emit(message)
  });
  if (state !== null) {
    controller.setState(state);
    context.view.synchronise(state.field, state.inHand);
  }
  context.engine.postMessage = (message) => {
    context.engine.posted.push(message);
    controller.handleMessage({ data: message });
  };
  context.engine.addEventListener('message', context.hmi.handleEngineMessage);
  return { ...context, controller };
};

const moving = () =>
  stateFrom({ white: ['a1', 'd1', 'g4', 'b6'], black: ['d2', 'b4', 'f6', 'd7'] });

const click = (win, node) => node.dispatchEvent(new win.Event('click'));

const performed = (engine) => engine.posted.filter((message) => message.request === 'perform');

const symbol = (doc) => doc.querySelector('#active-player .active-player-symbol').textContent;

describe('layout arithmetic', () => {
  it('fits the board into the free area', () => {
    expect(boardUnit(800, 600)).toBeCloseTo((600 - OFFSET_HEIGHT) / 7, 10);
    expect(boardUnit(500, 900)).toBeCloseTo(52, 10);
  });

  it('clamps the icon size', () => {
    expect(iconSize(10)).toBe(MIN_ICON);
    expect(iconSize(500)).toBe(MAX_ICON);
    expect(iconSize(80)).toBeCloseTo(56, 10);
  });

  it('describes the active player type, side and pieces in hand', () => {
    const options = { playerwhite: 'Human', playerblack: 'AI' };
    expect(activePlayerBadge({ turn: 0, inHand: [9, 9] }, options)).toEqual({
      label: 'Human Player ○, 9 in hand',
      symbol: '🧑○9'
    });
    expect(activePlayerBadge({ turn: 1, inHand: [0, 0], pendingRemoval: true }, options)).toEqual({
      label: 'AI Player ●, removes a piece',
      symbol: '🤖●✂'
    });
    expect(activePlayerBadge({ turn: 1 }, options)).toEqual({
      label: 'AI Player ●',
      symbol: '🤖●'
    });
  });
});

describe('hmi', () => {
  it('sizes the paper, the board margin and the icons', () => {
    const { doc, hmi } = setup();
    hmi.resize();
    const unit = (600 - OFFSET_HEIGHT) / 7;
    const svg = doc.querySelector('#board svg');
    expect(Number(svg.getAttribute('width'))).toBeCloseTo(9 * unit, 10);
    expect(Number(svg.getAttribute('height'))).toBeCloseTo(7 * unit, 10);
    expect(Number.parseFloat(doc.getElementById('board').style.marginTop)).toBeCloseTo(0, 10);
    expect(
      Number.parseFloat(doc.getElementById('game-page').style.backgroundSize.slice(5))
    ).toBeCloseTo(unit, 10);
    expect(doc.getElementById('game-page').style.getPropertyValue('--game-title-bar-height')).toBe(
      '64px'
    );
    expect(Number.parseFloat(doc.getElementById('customMenu').style.width)).toBeCloseTo(
      unit * 0.7,
      10
    );
  });

  it('skips icons that are missing from the document', () => {
    const { doc, hmi } = setup();
    doc.getElementById('customMenu').remove();
    expect(() => hmi.resize()).not.toThrow();
  });

  it('asks the engine to start and carries the options', () => {
    const { engine, hmi } = setup();
    hmi.start();
    expect(engine.posted[0]).toMatchObject({
      class: 'request',
      request: 'start',
      flying: true,
      skipRemovalInMills: false
    });
  });

  it('ignores foreign engine messages', () => {
    const { hmi } = setup();
    expect(hmi.handleEngineMessage({ data: { eventClass: 'response' } })).toBe(false);
    expect(hmi.handleEngineMessage({ data: { eventClass: 'request', request: 'nothing' } })).toBe(
      false
    );
  });

  it('restores the board on request', () => {
    const { hmi, view } = setup();
    view.animateAction({ type: PLACE, by: WHITE, to: at('a1') }, () => {});
    view.setLastMove({ type: PLACE, to: at('a1') });
    expect(hmi.handleEngineMessage({ data: { eventClass: 'request', request: 'restore' } })).toBe(
      true
    );
    expect(view.at(at('a1')).tagName).toBe('rect');
    expect(view.reserveCount(WHITE)).toBe(9);
    expect(view.svg.querySelector('.last-move-ring')).toBeNull();
  });

  it('lets a human place a piece on an empty point', () => {
    const { doc, win, view, engine, hmi } = connected();
    hmi.start();
    expect(symbol(doc)).toBe('🧑○9');
    expect(view.at(at('d2')).getAttribute('opacity')).toBe('0');
    click(win, view.at(at('d2')));
    expect(performed(engine)[0].action).toMatchObject({ type: PLACE, to: at('d2') });
    expect(view.at(at('d2')).getAttribute('href')).toContain('light');
    expect(view.reserveCount(WHITE)).toBe(8);
    expect(symbol(doc)).toBe('🧑●9');
    expect(view.svg.querySelectorAll('.last-move-ring')).toHaveLength(1);
  });

  it('shows the available targets when the option is set', () => {
    const { doc, view, hmi } = connected();
    doc.getElementById('showavailablemove').checked = true;
    hmi.start();
    expect(view.svg.querySelectorAll('rect[data-point][opacity="0.4"]')).toHaveLength(24);
  });

  it('lets a human select a piece and play a move', () => {
    const { doc, win, view, engine, hmi } = connected(moving());
    hmi.start();
    expect(view.at(at('g4')).classList.contains('selectable-source')).toBe(true);
    expect(view.svg.querySelectorAll('.selectable-source-ring')).toHaveLength(4);
    click(win, view.at(at('g4')));
    expect(hmi.describeSelection()).toBe('g4');
    expect(doc.querySelectorAll('.selected-source-ring')).toHaveLength(1);
    click(win, view.at(at('g7')));
    expect(performed(engine)[0].action).toMatchObject({ type: MOVE, from: at('g4'), to: at('g7') });
    expect(hmi.getSelection()).toBeNull();
    expect(view.at(at('g7')).getAttribute('href')).toContain('light');
    expect(view.at(at('g4')).tagName).toBe('rect');
    expect(view.svg.querySelectorAll('.last-move-ring')).toHaveLength(2);
  });

  it('offers every empty point to a flying piece', () => {
    const { doc, win, view, hmi } = connected(
      stateFrom({ white: ['a1', 'd1', 'g4'], black: ['d2', 'b4', 'f6', 'd7'] })
    );
    doc.getElementById('showavailablemove').checked = true;
    hmi.start();
    click(win, view.at(at('a1')));
    expect(view.svg.querySelectorAll('rect[data-point][opacity="0.4"]')).toHaveLength(17);
  });

  it('hides the targets of a previous selection', () => {
    const { doc, win, view, hmi } = connected(moving());
    doc.getElementById('showavailablemove').checked = true;
    hmi.start();
    click(win, view.at(at('g4')));
    expect(view.at(at('g7')).getAttribute('opacity')).toBe('0.4');
    click(win, view.at(at('a1')));
    expect(hmi.describeSelection()).toBe('a1');
    expect(doc.querySelectorAll('.selected-source-ring')).toHaveLength(1);
    expect(view.at(at('g7')).getAttribute('opacity')).toBe('0');
    expect(view.at(at('a4')).getAttribute('opacity')).toBe('0.4');
  });

  it('ignores a click on a point that is not a legal target', () => {
    const { win, view, engine, hmi } = connected(moving());
    hmi.start();
    click(win, view.at(at('g4')));
    const target = view.at(at('g7'));
    hmi.update({ turn: 0, actions: [], nextishuman: false }, null);
    click(win, target);
    expect(performed(engine)).toHaveLength(0);
  });

  it('lets a human remove a marked opponent piece', () => {
    const { doc, win, view, engine, hmi } = connected(
      stateFrom({
        white: ['a7', 'd7', 'g7'],
        black: ['a1', 'd1', 'g1', 'b6'],
        pendingRemoval: true
      })
    );
    hmi.start();
    expect(symbol(doc)).toBe('🧑○✂');
    const rings = view.svg.querySelectorAll('.removable-ring');
    expect(rings).toHaveLength(1);
    expect(rings[0].nextElementSibling).toBe(view.at(at('b6')));
    click(win, view.at(at('a1')));
    expect(performed(engine)).toHaveLength(0);
    click(win, view.at(at('b6')));
    expect(performed(engine)[0].action).toMatchObject({ type: REMOVE, at: at('b6') });
    expect(view.at(at('b6')).tagName).toBe('rect');
    expect(view.svg.querySelector('.removable-ring')).toBeNull();
    expect(symbol(doc)).toBe('🧑●');
  });

  it('switches on the algebraic notation board', () => {
    const { doc, hmi } = setup();
    doc.getElementById('showalgebraicnotation').checked = true;
    hmi.update({ turn: 0, actions: [], nextishuman: false }, null);
    expect(doc.querySelector('#board svg .board-notation').style.display).toBe('');
  });

  it('shows the active player and configured player type in the title bar', () => {
    const { doc, hmi } = setup();
    doc.getElementById('playerblackai').checked = true;
    hmi.update({ turn: 1, inHand: [0, 0], actions: [], nextishuman: false }, null);
    const badge = doc.getElementById('active-player');
    expect(symbol(doc)).toBe('🤖●');
    expect(badge.querySelector('.active-player-spinner').getAttribute('aria-hidden')).toBe('true');
    expect(badge.getAttribute('aria-label')).toBe('AI Player ●');
    expect(badge.getAttribute('title')).toBe('AI Player ●');
  });

  it('shows the pieces in hand and a pending removal in the badge', () => {
    const { doc, hmi } = setup();
    hmi.update({ turn: 0, inHand: [4, 5], actions: [], nextishuman: false }, null);
    expect(symbol(doc)).toBe('🧑○4');
    hmi.update(
      { turn: 0, inHand: [4, 5], pendingRemoval: true, actions: [], nextishuman: false },
      null
    );
    expect(symbol(doc)).toBe('🧑○✂');
    expect(doc.getElementById('active-player').getAttribute('aria-label')).toBe(
      'Human Player ○, 4 in hand, removes a piece'
    );
  });

  it('asks the engine for a move when the AI is on turn', () => {
    const { doc, engine, hmi } = setup();
    doc.getElementById('playerwhiteai').checked = true;
    hmi.update(
      { turn: 0, actions: [{ type: PLACE, by: WHITE, to: at('d2') }], nextishuman: false },
      null
    );
    expect(engine.posted[0]).toMatchObject({ request: 'actionbyai', playerwhite: 'AI' });
  });

  it('asks the engine again for the removal after an AI mill', () => {
    const { doc, engine, hmi, view } = setup();
    doc.getElementById('playerwhiteai').checked = true;
    view.placePiece('img/dark_normal.png', at('b6'));
    hmi.update(
      {
        turn: 0,
        pendingRemoval: true,
        actions: [{ type: REMOVE, by: WHITE, at: at('b6') }],
        nextishuman: false
      },
      { action: { type: PLACE, by: WHITE, to: at('g7') } }
    );
    expect(engine.posted).toHaveLength(1);
    expect(engine.posted[0].request).toBe('actionbyai');
    expect(view.svg.querySelector('.removable-ring')).toBeNull();
  });

  it('animates a reported action before continuing the turn', () => {
    const { engine, view, hmi } = setup();
    hmi.update(
      { turn: 1, actions: [], nextishuman: false },
      { action: { type: PLACE, by: WHITE, to: at('d2') } }
    );
    expect(view.at(at('d2')).getAttribute('href')).toContain('light');
    expect(view.svg.querySelectorAll('.last-move-ring')).toHaveLength(1);
    expect(engine.posted).toHaveLength(0);
  });

  it('shows the celebration for a finished game', () => {
    const { doc, hmi } = setup();
    hmi.update(
      {
        turn: 1,
        actions: [],
        nextishuman: false,
        outcome: { winner: 0, reason: 'no-legal-move' }
      },
      null
    );
    const panel = doc.querySelector('.winning-celebration');
    expect(panel.hidden).toBe(false);
    expect(panel.textContent).toContain('Congratulations, White!');
    expect(panel.textContent).toContain('Black has no legal move.');
  });

  it('restarts the game and drops the selection', () => {
    const { win, view, engine, hmi } = connected(moving());
    hmi.start();
    click(win, view.at(at('g4')));
    hmi.restart();
    expect(engine.posted.some((message) => message.request === 'restart')).toBe(true);
    expect(hmi.getSelection()).toBeNull();
    expect(view.at(at('g4')).tagName).toBe('rect');
    expect(view.reserveCount(WHITE)).toBe(9);
  });
});
