//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import { BLACK, FLY, MOVE, NONE, PIECES, PLACE, REMOVE, WHITE } from '../core/board.js';
import { MILLS, POINT_COUNT, POINTS, toAlgebraic } from '../core/topology.js';

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const XLINK_NS = 'http://www.w3.org/1999/xlink';

export const FILEDARK = 'img/dark_normal.png';
export const FILELIGHT = 'img/light_normal.png';

/** A 7 x 7 board grid with one reserve column on each side. */
export const VIEW_WIDTH = 9;
export const VIEW_HEIGHT = 7;
export const PIECE_SIZE = 0.7;
export const RESERVE_STEP = 0.75;
export const RING_RADIUS = 0.45;

export const GROW_DURATION = 600;
export const SHRINK_DURATION = 300;
export const SLIDE_DURATION = 400;
export const FADE_DURATION = 300;
export const GROW = 0.3;

/** Model row 1 is at the bottom, the SVG y axis points down. */
export const centreX = (point) => POINTS[point].x + 1.5;
export const centreY = (point) => VIEW_HEIGHT - 0.5 - POINTS[point].y;

/** Centre of reserve slot `slot`, counted from the bottom of the player's column. */
export const reserveSlot = (player, slot) => ({
  x: player === WHITE ? 0.5 : VIEW_WIDTH - 0.5,
  y: VIEW_HEIGHT - 0.5 - RESERVE_STEP * slot
});

export const pieceFile = (piece) =>
  piece === WHITE ? FILELIGHT : piece === BLACK ? FILEDARK : null;

const setAttributes = (element, attributes) => {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  return element;
};

export const createBoardView = (
  container,
  {
    doc = container.ownerDocument,
    schedule = (callback, delay) => globalThis.setTimeout(callback, delay)
  } = {}
) => {
  const element = (name, attributes) =>
    setAttributes(doc.createElementNS(SVG_NS, name), attributes);

  const svg = element('svg', {
    xmlns: SVG_NS,
    viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`,
    width: 450,
    height: 350
  });
  svg.classList.add('mulino-paper');

  const celebration = doc.createElement('div');
  celebration.className = 'winning-celebration';
  celebration.setAttribute('role', 'status');
  celebration.setAttribute('aria-live', 'polite');
  celebration.hidden = true;

  const drawing = element('g', { class: 'board-drawing' });
  drawing.append(
    element('rect', { x: 1, y: 0, width: 7, height: 7, rx: 0.2, class: 'board-background' })
  );
  for (const mill of MILLS) {
    const first = mill[0];
    const last = mill[mill.length - 1];
    drawing.append(
      element('line', {
        x1: centreX(first),
        y1: centreY(first),
        x2: centreX(last),
        y2: centreY(last),
        class: 'board-line'
      })
    );
  }
  for (let point = 0; point < POINT_COUNT; ++point) {
    drawing.append(
      element('circle', { cx: centreX(point), cy: centreY(point), r: 0.09, class: 'board-dot' })
    );
  }

  const notation = element('g', { class: 'board-notation' });
  for (let column = 0; column < 7; ++column) {
    const label = element('text', { x: column + 1.5, y: VIEW_HEIGHT - 0.06 });
    label.textContent = String.fromCharCode(97 + column);
    notation.append(label);
  }
  for (let row = 0; row < 7; ++row) {
    const label = element('text', { x: 1.12, y: VIEW_HEIGHT - 0.4 - row });
    label.textContent = String(row + 1);
    notation.append(label);
  }
  notation.style.display = 'none';

  svg.append(drawing, notation);
  container.replaceChildren(svg, celebration);

  const field = new Array(POINT_COUNT).fill(null);
  const reserves = [[], []];
  const listeners = new Map();
  const sourceMarkers = new Map();
  const removalMarkers = new Map();
  let lastMoveMarkers = [];

  const ring = (point, className) =>
    element('circle', {
      cx: centreX(point),
      cy: centreY(point),
      r: RING_RADIUS,
      class: className
    });

  const dropMarker = (markers, point) => {
    markers.get(point)?.remove();
    markers.delete(point);
  };

  function unbind(node) {
    const bound = listeners.get(node);
    if (bound === undefined) return;
    for (const handler of bound) node.removeEventListener('click', handler);
    listeners.delete(node);
  }

  const bind = (node, handler) => {
    node.addEventListener('click', handler);
    const bound = listeners.get(node) ?? [];
    bound.push(handler);
    listeners.set(node, bound);
  };

  const remove = (point) => {
    dropMarker(sourceMarkers, point);
    dropMarker(removalMarkers, point);
    const previous = field[point];
    if (previous !== null) {
      unbind(previous);
      previous.remove();
    }
    field[point] = null;
  };

  const placeEmpty = (point) => {
    remove(point);
    const rect = element('rect', {
      x: centreX(point) - 0.5,
      y: centreY(point) - 0.5,
      width: 1,
      height: 1,
      stroke: 'none',
      fill: 'gray',
      opacity: 0,
      'data-point': toAlgebraic(point)
    });
    svg.append(rect);
    field[point] = rect;
    return rect;
  };

  const pieceImage = (href, x, y) => {
    const node = element('image', {
      x: x - PIECE_SIZE / 2,
      y: y - PIECE_SIZE / 2,
      width: PIECE_SIZE,
      height: PIECE_SIZE
    });
    node.setAttributeNS(XLINK_NS, 'xlink:href', href);
    node.setAttribute('href', href);
    return node;
  };

  const placePiece = (href, point) => {
    remove(point);
    const node = pieceImage(href, centreX(point), centreY(point));
    node.setAttribute('data-point', toAlgebraic(point));
    svg.append(node);
    field[point] = node;
    return node;
  };

  const reservePiece = (player, slot) => {
    const centre = reserveSlot(player, slot);
    const node = pieceImage(pieceFile(player), centre.x, centre.y);
    node.classList.add('reserve-piece');
    node.setAttribute('data-player', player === WHITE ? 'white' : 'black');
    svg.append(node);
    return node;
  };

  const fillReserves = (inHand) => {
    for (const player of [WHITE, BLACK]) {
      for (const node of reserves[player]) node.remove();
      reserves[player] = Array.from({ length: inHand[player] }, (_, slot) =>
        reservePiece(player, slot)
      );
    }
  };

  const synchronise = (square, inHand) => {
    for (let point = 0; point < POINT_COUNT; ++point) {
      const href = pieceFile(square[point]);
      if (href === null) placeEmpty(point);
      else placePiece(href, point);
    }
    fillReserves(inHand);
  };

  const restoreInitial = () => synchronise(new Array(POINT_COUNT).fill(NONE), [PIECES, PIECES]);

  const at = (point) => field[point];

  const reserveCount = (player) => reserves[player].length;

  const settle = (node, point) => {
    node.style.transition = '';
    node.style.transform = '';
    node.classList.remove('reserve-piece');
    node.removeAttribute('data-player');
    setAttributes(node, {
      x: centreX(point) - PIECE_SIZE / 2,
      y: centreY(point) - PIECE_SIZE / 2,
      'data-point': toAlgebraic(point)
    });
  };

  const transition = (node, property, value, duration, done) => {
    node.style.transition = `${property} ${duration}ms linear`;
    node.getBoundingClientRect();
    node.style[property] = value;
    schedule(done, duration);
  };

  const softJump = (node, dx, dy, done) =>
    transition(
      node,
      'transform',
      `translate(${dx / 2}px, ${dy / 2}px) scale(${1 + GROW})`,
      GROW_DURATION,
      () =>
        transition(node, 'transform', `translate(${dx}px, ${dy}px) scale(1)`, SHRINK_DURATION, done)
    );

  const slide = (node, dx, dy, done) =>
    transition(node, 'transform', `translate(${dx}px, ${dy}px) scale(1)`, SLIDE_DURATION, done);

  /** Detaches the node standing on `from` (or taken from a reserve) and moves it to `to`. */
  const relocate = (node, to, start, animate, done) => {
    remove(to);
    field[to] = node;
    svg.append(node);
    animate(node, centreX(to) - start.x, centreY(to) - start.y, () => {
      settle(node, to);
      done();
    });
  };

  const takeFromReserve = (player) => {
    const slot = Math.max(reserves[player].length - 1, 0);
    const node = reserves[player].pop() ?? reservePiece(player, slot);
    return { node, start: reserveSlot(player, slot) };
  };

  const animateAction = (action, done) => {
    if (action.type === REMOVE) {
      const node = at(action.at);
      unbind(node);
      dropMarker(removalMarkers, action.at);
      transition(node, 'opacity', '0', FADE_DURATION, () => {
        placeEmpty(action.at);
        done();
      });
      return;
    }
    if (action.type === PLACE) {
      const { node, start } = takeFromReserve(action.by);
      relocate(node, action.to, start, softJump, done);
      return;
    }
    const node = at(action.from);
    unbind(node);
    dropMarker(sourceMarkers, action.from);
    field[action.from] = null;
    placeEmpty(action.from);
    const start = { x: centreX(action.from), y: centreY(action.from) };
    relocate(node, action.to, start, action.type === MOVE ? slide : softJump, done);
  };

  const clearHandlers = () => {
    for (const node of [...listeners.keys()]) unbind(node);
  };

  const setSize = (unit) =>
    setAttributes(svg, { width: VIEW_WIDTH * unit, height: VIEW_HEIGHT * unit });

  const showNotation = (visible) => {
    notation.style.display = visible ? '' : 'none';
  };

  const setTargetVisible = (point, visible) => {
    at(point).setAttribute('opacity', visible ? '0.4' : '0');
  };

  const setSourceSelectable = (point, selectable) => {
    const node = at(point);
    node.classList.toggle('selectable-source', selectable);
    if (!selectable) {
      dropMarker(sourceMarkers, point);
      return;
    }
    if (sourceMarkers.has(point)) return;
    const marker = ring(point, 'selectable-source-ring');
    svg.insertBefore(marker, node);
    sourceMarkers.set(point, marker);
  };

  const setSourceSelected = (point, selected) => {
    const marker = sourceMarkers.get(point);
    if (marker === undefined) return;
    marker.classList.toggle('selected-source-ring', selected);
    if (selected) svg.append(marker);
    else svg.insertBefore(marker, at(point));
  };

  const setRemovable = (point, removable) => {
    const node = at(point);
    node.classList.toggle('removable', removable);
    if (!removable) {
      dropMarker(removalMarkers, point);
      return;
    }
    if (removalMarkers.has(point)) return;
    const marker = ring(point, 'removable-ring');
    svg.insertBefore(marker, node);
    removalMarkers.set(point, marker);
  };

  /** A removal keeps the rings of the move that closed the mill. */
  const setLastMove = (action) => {
    if (action !== null && action.type === REMOVE) return;
    for (const marker of lastMoveMarkers) marker.remove();
    lastMoveMarkers = [];
    if (action === null) return;
    const marks = [[action.to, 'last-move-target']];
    if (action.type === MOVE || action.type === FLY)
      marks.unshift([action.from, 'last-move-source']);
    for (const [point, className] of marks) {
      const marker = ring(point, `last-move-ring ${className}`);
      svg.append(marker);
      lastMoveMarkers.push(marker);
    }
  };

  const colourName = (player) => (player === WHITE ? 'White' : 'Black');

  const setCelebration = (outcome) => {
    celebration.hidden = outcome === null;
    if (outcome === null) {
      celebration.replaceChildren();
      return;
    }
    const heading = doc.createElement('strong');
    const reason = doc.createElement('span');
    if (outcome.winner === null) {
      heading.textContent = 'Draw!';
      reason.textContent = 'The same position occurred for the third time.';
    } else {
      const loser = colourName(outcome.winner ^ 1);
      heading.textContent = `Congratulations, ${colourName(outcome.winner)}!`;
      reason.textContent =
        outcome.reason === 'fewer-than-three-pieces'
          ? `${loser} has fewer than three pieces.`
          : `${loser} has no legal move.`;
    }
    celebration.replaceChildren(heading, reason);
  };

  restoreInitial();

  return {
    svg,
    at,
    bind,
    unbind,
    clearHandlers,
    animateAction,
    restoreInitial,
    synchronise,
    reserveCount,
    setSize,
    showNotation,
    setTargetVisible,
    setSourceSelectable,
    setSourceSelected,
    setRemovable,
    setLastMove,
    setCelebration,
    placeEmpty,
    placePiece
  };
};
