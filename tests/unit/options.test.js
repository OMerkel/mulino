import { describe, expect, it } from 'vitest';
import { readOptions, request } from '../../html5/src/js/ui/options.js';
import { loadApp } from './helpers/dom.js';

describe('option read out', () => {
  it('reports the shipped defaults', () => {
    const { doc } = loadApp();
    expect(readOptions(doc)).toEqual({
      playerwhite: 'Human',
      playerblack: 'Human',
      flying: true,
      skipRemovalInMills: false,
      showavailablemove: false,
      showalgebraicnotation: false
    });
  });

  it('follows the radio buttons', () => {
    const { doc } = loadApp();
    doc.getElementById('playerwhiteai').checked = true;
    doc.getElementById('playerblackai').checked = true;
    doc.getElementById('flyingForbidden').checked = true;
    doc.getElementById('skipRemovalInMills').checked = true;
    doc.getElementById('showavailablemove').checked = true;
    doc.getElementById('showalgebraicnotation').checked = true;
    expect(readOptions(doc)).toEqual({
      playerwhite: 'AI',
      playerblack: 'AI',
      flying: false,
      skipRemovalInMills: true,
      showavailablemove: true,
      showalgebraicnotation: true
    });
  });

  it('builds an engine request carrying the options', () => {
    const { doc } = loadApp();
    expect(request(doc, 'start')).toMatchObject({
      class: 'request',
      request: 'start',
      playerwhite: 'Human',
      flying: true,
      skipRemovalInMills: false
    });
  });
});
