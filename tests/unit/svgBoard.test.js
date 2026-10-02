import { describe, expect, it } from 'vitest';
import { BLACK, FLY, MOVE, NONE, PLACE, REMOVE, WHITE } from '../../html5/src/js/core/board.js';
import {
  centreX,
  centreY,
  createBoardView,
  FILEDARK,
  FILELIGHT,
  GROW,
  PIECE_SIZE,
  pieceFile,
  reserveSlot,
  VIEW_HEIGHT,
  VIEW_WIDTH
} from '../../html5/src/js/ui/svgBoard.js';
import { immediate, loadApp } from './helpers/dom.js';
import { at } from './helpers/state.js';

const view = (schedule = immediate) => {
  const { doc, win } = loadApp();
  return {
    doc,
    win,
    board: createBoardView(doc.getElementById('board'), { doc, schedule })
  };
};

const pending = () => {
  const queue = [];
  return { queue, schedule: (callback) => queue.push(callback) };
};

const reserve = (board, colour) =>
  board.svg.querySelectorAll(`image.reserve-piece[data-player="${colour}"]`);

describe('board geometry', () => {
  it('maps model points onto the nine by seven view box', () => {
    expect(VIEW_WIDTH).toBe(9);
    expect(VIEW_HEIGHT).toBe(7);
    expect(centreX(at('a1'))).toBe(1.5);
    expect(centreY(at('a1'))).toBe(6.5);
    expect(centreX(at('g7'))).toBe(7.5);
    expect(centreY(at('g7'))).toBe(0.5);
  });

  it('stacks the reserve slots from the bottom of each side column', () => {
    expect(reserveSlot(WHITE, 0)).toEqual({ x: 0.5, y: 6.5 });
    expect(reserveSlot(BLACK, 8)).toEqual({ x: 8.5, y: 0.5 });
  });

  it('maps piece codes onto image files', () => {
    expect(pieceFile(WHITE)).toBe(FILELIGHT);
    expect(pieceFile(BLACK)).toBe(FILEDARK);
    expect(pieceFile(NONE)).toBeNull();
  });
});

describe('board view', () => {
  it('draws the board, twenty four points and two reserve columns', () => {
    const { doc, board } = view();
    const svg = doc.querySelector('#board svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 9 7');
    expect(svg.querySelectorAll('.board-line')).toHaveLength(16);
    expect(svg.querySelectorAll('.board-dot')).toHaveLength(24);
    expect(svg.querySelectorAll('rect[data-point]')).toHaveLength(24);
    expect(reserve(board, 'white')).toHaveLength(9);
    expect(reserve(board, 'black')).toHaveLength(9);
    expect(board.at(at('d2')).getAttribute('data-point')).toBe('d2');
  });

  it('shows the pieces in hand in the reserve columns', () => {
    const { board } = view();
    board.synchronise(new Array(24).fill(NONE), [3, 1]);
    expect(reserve(board, 'white')).toHaveLength(3);
    expect(reserve(board, 'black')).toHaveLength(1);
    expect(board.reserveCount(WHITE)).toBe(3);
    const first = reserve(board, 'black')[0];
    expect(first.getAttribute('x')).toBe(String(8.5 - PIECE_SIZE / 2));
    expect(first.getAttribute('href')).toBe(FILEDARK);
  });

  it('positions the pieces', () => {
    const { board } = view();
    const piece = board.placePiece(FILELIGHT, at('a1'));
    expect(piece.getAttribute('x')).toBe(String(1.5 - PIECE_SIZE / 2));
    expect(piece.getAttribute('y')).toBe(String(6.5 - PIECE_SIZE / 2));
    expect(piece.getAttribute('data-point')).toBe('a1');
  });

  it('resizes the paper', () => {
    const { board, doc } = view();
    board.setSize(50);
    const svg = doc.querySelector('#board svg');
    expect(svg.getAttribute('width')).toBe('450');
    expect(svg.getAttribute('height')).toBe('350');
  });

  it('shows and hides the algebraic notation board', () => {
    const { board, doc } = view();
    const notation = doc.querySelector('#board svg .board-notation');
    expect(notation.style.display).toBe('none');
    expect([...notation.querySelectorAll('text')].map((label) => label.textContent)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7'
    ]);
    board.showNotation(true);
    expect(notation.style.display).toBe('');
    board.showNotation(false);
    expect(notation.style.display).toBe('none');
  });

  it('toggles the visibility of a target point', () => {
    const { board } = view();
    board.setTargetVisible(at('d2'), true);
    expect(board.at(at('d2')).getAttribute('opacity')).toBe('0.4');
    board.setTargetVisible(at('d2'), false);
    expect(board.at(at('d2')).getAttribute('opacity')).toBe('0');
  });

  it('marks a selectable source piece', () => {
    const { board } = view();
    const source = board.placePiece(FILELIGHT, at('d2'));
    board.setSourceSelectable(at('d2'), true);
    expect(source.classList.contains('selectable-source')).toBe(true);
    const marker = board.svg.querySelector('.selectable-source-ring');
    expect(marker.getAttribute('cx')).toBe('4.5');
    expect(marker.getAttribute('cy')).toBe('5.5');
    expect(marker.getAttribute('r')).toBe('0.45');
    board.setSourceSelected(at('d2'), true);
    expect(marker.classList.contains('selected-source-ring')).toBe(true);
    expect(board.svg.lastElementChild).toBe(marker);
    board.setSourceSelected(at('d2'), false);
    expect(marker.classList.contains('selected-source-ring')).toBe(false);
    expect(marker.nextElementSibling).toBe(source);
    board.setSourceSelectable(at('d2'), true);
    expect(board.svg.querySelectorAll('.selectable-source-ring')).toHaveLength(1);
    board.setSourceSelected(at('a1'), true);
    board.setSourceSelectable(at('d2'), false);
    expect(source.classList.contains('selectable-source')).toBe(false);
    expect(board.svg.querySelector('.selectable-source-ring')).toBeNull();
  });

  it('marks a removable piece with a red ring', () => {
    const { board } = view();
    const piece = board.placePiece(FILEDARK, at('b6'));
    board.setRemovable(at('b6'), true);
    board.setRemovable(at('b6'), true);
    const rings = board.svg.querySelectorAll('.removable-ring');
    expect(rings).toHaveLength(1);
    expect(piece.classList.contains('removable')).toBe(true);
    expect(rings[0].nextElementSibling).toBe(piece);
    board.setRemovable(at('b6'), false);
    expect(board.svg.querySelector('.removable-ring')).toBeNull();
    expect(piece.classList.contains('removable')).toBe(false);
  });

  it('marks the last move with dashed source and solid target rings', () => {
    const { board } = view();
    board.setLastMove({ type: MOVE, from: at('d2'), to: at('d3') });
    const source = board.svg.querySelector('.last-move-source');
    const target = board.svg.querySelector('.last-move-target');
    expect(source.getAttribute('cx')).toBe('4.5');
    expect(source.getAttribute('cy')).toBe('5.5');
    expect(target.getAttribute('cy')).toBe('4.5');
    board.setLastMove({ type: FLY, from: at('a1'), to: at('g7') });
    expect(board.svg.querySelectorAll('.last-move-ring')).toHaveLength(2);
    board.setLastMove({ type: REMOVE, at: at('b6') });
    expect(board.svg.querySelectorAll('.last-move-ring')).toHaveLength(2);
    board.setLastMove(null);
    expect(board.svg.querySelector('.last-move-ring')).toBeNull();
  });

  it('marks a placement with a target ring only', () => {
    const { board } = view();
    board.setLastMove({ type: PLACE, to: at('d2') });
    expect(board.svg.querySelectorAll('.last-move-ring')).toHaveLength(1);
    expect(board.svg.querySelector('.last-move-target')).not.toBeNull();
  });

  it('shows and clears celebrations with their reason', () => {
    const { board, doc } = view();
    const panel = doc.querySelector('.winning-celebration');
    expect(panel.hidden).toBe(true);
    board.setCelebration({ winner: WHITE, reason: 'fewer-than-three-pieces' });
    expect(panel.hidden).toBe(false);
    expect(panel.textContent).toContain('Congratulations, White!');
    expect(panel.textContent).toContain('Black has fewer than three pieces.');
    board.setCelebration({ winner: BLACK, reason: 'no-legal-move' });
    expect(panel.textContent).toContain('Congratulations, Black!');
    expect(panel.textContent).toContain('White has no legal move.');
    board.setCelebration({ winner: null, reason: 'threefold-repetition' });
    expect(panel.textContent).toContain('Draw!');
    expect(panel.textContent).toContain('The same position occurred for the third time.');
    board.setCelebration(null);
    expect(panel.hidden).toBe(true);
  });

  it('binds and unbinds click handlers', () => {
    const { board, win } = view();
    let clicks = 0;
    const node = board.at(at('a1'));
    board.bind(node, () => {
      clicks += 1;
    });
    node.dispatchEvent(new win.Event('click'));
    expect(clicks).toBe(1);
    board.unbind(node);
    node.dispatchEvent(new win.Event('click'));
    expect(clicks).toBe(1);
    board.unbind(node);
    board.bind(node, () => {
      clicks += 1;
    });
    board.clearHandlers();
    node.dispatchEvent(new win.Event('click'));
    expect(clicks).toBe(1);
  });

  it('animates a placement from the reserve', () => {
    const { queue, schedule } = pending();
    const { board } = view(schedule);
    const piece = reserve(board, 'white')[8];
    let done = false;
    board.animateAction({ type: PLACE, by: WHITE, to: at('d2') }, () => {
      done = true;
    });
    expect(board.reserveCount(WHITE)).toBe(8);
    expect(board.at(at('d2'))).toBe(piece);
    expect(piece.style.transform).toBe(`translate(2px, 2.5px) scale(${1 + GROW})`);
    expect(piece.style.transition).toBe('transform 600ms linear');
    queue.shift()();
    expect(piece.style.transform).toBe('translate(4px, 5px) scale(1)');
    expect(piece.style.transition).toBe('transform 300ms linear');
    queue.shift()();
    expect(done).toBe(true);
    expect(piece.style.transform).toBe('');
    expect(piece.getAttribute('data-point')).toBe('d2');
    expect(piece.classList.contains('reserve-piece')).toBe(false);
    expect(piece.getAttribute('x')).toBe(String(4.5 - PIECE_SIZE / 2));
  });

  it('takes a fresh piece when the reserve is out of sync', () => {
    const { board } = view();
    board.synchronise(new Array(24).fill(NONE), [0, 0]);
    board.animateAction({ type: PLACE, by: BLACK, to: at('g7') }, () => {});
    expect(board.at(at('g7')).getAttribute('href')).toBe(FILEDARK);
    expect(board.reserveCount(BLACK)).toBe(0);
  });

  it('slides a moved piece', () => {
    const { queue, schedule } = pending();
    const { board } = view(schedule);
    const piece = board.placePiece(FILELIGHT, at('d2'));
    board.setSourceSelectable(at('d2'), true);
    board.animateAction({ type: MOVE, by: WHITE, from: at('d2'), to: at('d3') }, () => {});
    expect(board.at(at('d2')).tagName).toBe('rect');
    expect(board.at(at('d3'))).toBe(piece);
    expect(board.svg.querySelector('.selectable-source-ring')).toBeNull();
    expect(piece.style.transition).toBe('transform 400ms linear');
    expect(piece.style.transform).toBe('translate(0px, -1px) scale(1)');
    queue.shift()();
    expect(piece.style.transform).toBe('');
    expect(piece.getAttribute('data-point')).toBe('d3');
  });

  it('flies through an enlarged midpoint before settling', () => {
    const { queue, schedule } = pending();
    const { board } = view(schedule);
    const piece = board.placePiece(FILEDARK, at('a1'));
    board.animateAction({ type: FLY, by: BLACK, from: at('a1'), to: at('g7') }, () => {});
    expect(piece.style.transform).toBe(`translate(3px, -3px) scale(${1 + GROW})`);
    expect(piece.style.transition).toBe('transform 600ms linear');
    queue.shift()();
    expect(piece.style.transform).toBe('translate(6px, -6px) scale(1)');
    expect(piece.style.transition).toBe('transform 300ms linear');
    queue.shift()();
    expect(piece.style.transform).toBe('');
    expect(board.at(at('g7'))).toBe(piece);
  });

  it('fades out a removed piece', () => {
    const { queue, schedule } = pending();
    const { board } = view(schedule);
    const piece = board.placePiece(FILEDARK, at('b6'));
    board.setRemovable(at('b6'), true);
    let done = false;
    board.animateAction({ type: REMOVE, by: WHITE, at: at('b6') }, () => {
      done = true;
    });
    expect(board.svg.querySelector('.removable-ring')).toBeNull();
    expect(piece.style.transition).toBe('opacity 300ms linear');
    expect(piece.style.opacity).toBe('0');
    queue.shift()();
    expect(done).toBe(true);
    expect(piece.isConnected).toBe(false);
    expect(board.at(at('b6')).tagName).toBe('rect');
  });

  it('restores the initial position', () => {
    const { board } = view();
    board.animateAction({ type: PLACE, by: WHITE, to: at('d2') }, () => {});
    board.restoreInitial();
    expect(board.at(at('d2')).tagName).toBe('rect');
    expect(board.reserveCount(WHITE)).toBe(9);
  });

  it('synchronises with an arbitrary position', () => {
    const { board } = view();
    const square = new Array(24).fill(NONE);
    square[at('a1')] = WHITE;
    square[at('g7')] = BLACK;
    board.synchronise(square, [2, 4]);
    expect(board.at(at('a1')).getAttribute('href')).toBe(FILELIGHT);
    expect(board.at(at('g7')).getAttribute('href')).toBe(FILEDARK);
    expect(board.at(at('d2')).tagName).toBe('rect');
    expect(board.reserveCount(BLACK)).toBe(4);
  });
});
