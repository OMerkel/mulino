import { expect, test } from '@playwright/test';

const point = (page, name) => page.locator(`#board svg [data-point="${name}"]`);
const pieceAt = (page, name) => page.locator(`#board svg image[data-point="${name}"]`);
const emptyAt = (page, name) => page.locator(`#board svg rect[data-point="${name}"]`);
const reserve = (page, colour) =>
  page.locator(`#board svg image.reserve-piece[data-player="${colour}"]`);
const symbol = (page) => page.locator('#active-player .active-player-symbol');

/** Places a piece and waits until it has settled on its point. */
const place = async (page, name) => {
  await emptyAt(page, name).click();
  await expect(pieceAt(page, name)).toBeAttached();
};

/** Removes the marked opponent piece and waits until it has faded out. */
const remove = async (page, name) => {
  await pieceAt(page, name).click();
  await expect(emptyAt(page, name)).toBeAttached();
};

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#board svg')).toBeVisible();
});

test('renders the initial position on the game page', async ({ page }) => {
  await expect(page).toHaveTitle('Mulino');
  await expect(page.locator('#myheader')).toHaveText('Mulino');
  const gameBounds = await page.locator('#game-page').boundingBox();
  const viewport = page.viewportSize();
  expect(gameBounds).toMatchObject({ x: 0, y: 0, width: viewport.width });
  expect(gameBounds.height).toBe(viewport.height);
  expect(
    await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight
    }))
  ).toEqual({ horizontal: 0, vertical: 0 });
  await expect(symbol(page)).toHaveText('🧑○9');
  await expect(page.locator('#active-player .active-player-spinner')).toHaveCSS(
    'animation-name',
    'active-player-spin'
  );
  await expect(page.locator('#active-player')).toHaveAttribute(
    'aria-label',
    'Human Player ○, 9 in hand'
  );
  await expect(page.locator('#board svg .board-line')).toHaveCount(16);
  await expect(page.locator('#board svg rect[data-point]')).toHaveCount(24);
  await expect(reserve(page, 'white')).toHaveCount(9);
  await expect(reserve(page, 'black')).toHaveCount(9);
  await expect(page.locator('#board svg image[data-point]')).toHaveCount(0);
});

test('updates the active-player badge after a move', async ({ page }) => {
  await place(page, 'd2');
  await expect(symbol(page)).toHaveText('🧑●9');
  await expect(page.locator('#active-player')).toHaveAttribute(
    'aria-label',
    'Human Player ●, 9 in hand'
  );
  await expect(pieceAt(page, 'd2')).toHaveAttribute('href', /light/);
  await expect(reserve(page, 'white')).toHaveCount(8);
  const lastTarget = page.locator('#board svg circle.last-move-target');
  await expect(lastTarget).toHaveCSS('stroke', 'rgb(131, 217, 255)');
  await expect(lastTarget).toHaveCSS('stroke-width', '0.05px');
  await expect(page.locator('#board svg circle.last-move-source')).toHaveCount(0);
});

test('animates a placement from the reserve', async ({ page }) => {
  const piece = reserve(page, 'white').last();
  const handle = await piece.elementHandle();
  await emptyAt(page, 'd2').click();
  await page.waitForTimeout(150);

  const scale = await handle.evaluate(
    (node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a
  );
  expect(scale).toBeGreaterThan(1);
  expect(scale).toBeLessThan(1.3);
  await expect(pieceAt(page, 'd2')).toBeAttached();
});

test('closes a mill and removes an opponent piece', async ({ page }) => {
  await place(page, 'a1');
  await place(page, 'b2');
  await place(page, 'd1');
  await place(page, 'd2');
  await place(page, 'g1');

  await expect(symbol(page)).toHaveText('🧑○✂');
  const rings = page.locator('#board svg circle.removable-ring');
  await expect(rings).toHaveCount(2);
  await expect(rings.first()).toHaveCSS('stroke', 'rgb(255, 59, 48)');

  await remove(page, 'b2');
  await expect(page.locator('#board svg image[data-point][href*="dark"]')).toHaveCount(1);
  await expect(rings).toHaveCount(0);
  await expect(symbol(page)).toHaveText('🧑●7');
  await expect(page.locator('#board svg circle.last-move-target')).toHaveCount(1);
});

test('shows a celebration below the title bar', async ({ page }) => {
  const panel = page.locator('.winning-celebration');
  await expect(panel).toBeHidden();
  await page.evaluate(async () => {
    const { createBoardView } = await import('/js/ui/svgBoard.js');
    const view = createBoardView(document.getElementById('board'));
    view.setSize(40);
    view.setCelebration({ winner: 0, reason: 'no-legal-move' });
  });

  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Congratulations, White!');
  await expect(panel).toContainText('Black has no legal move.');
  await expect(panel).toHaveCSS('opacity', '0.7');
  await expect(panel).toHaveCSS('border-width', '1px');
  await expect(panel).toHaveCSS('border-color', 'rgb(239, 179, 102)');
  await expect(panel).toHaveCSS('border-radius', '8px');
  const panelBounds = await panel.boundingBox();
  const boardBounds = await page.locator('#board svg').boundingBox();
  const menuBounds = await page.locator('#customMenu').boundingBox();
  expect(panelBounds.x + panelBounds.width / 2).toBeCloseTo(boardBounds.x + boardBounds.width / 2);
  expect(panelBounds.y - menuBounds.y - menuBounds.height).toBeGreaterThanOrEqual(4);
  expect(panelBounds.y - menuBounds.y - menuBounds.height).toBeLessThanOrEqual(10);
});

test('opens and closes the sidebar menu', async ({ page }) => {
  const panel = page.locator('#left-panel');
  await expect(panel).toBeHidden();
  await page.locator('#customMenu').click();
  await expect(panel).toBeVisible();
  await expect(panel.getByText('Rules…')).toBeVisible();
  await panel.getByText('Back', { exact: true }).click();
  await expect(panel).toBeHidden();
});

test('shows the rules subpage full screen and hides the board', async ({ page }) => {
  await page.locator('#customMenu').click();
  await page.getByRole('link', { name: 'Rules…' }).click();

  await expect(page.locator('#rules-page')).toBeVisible();
  await expect(page.locator('#game-page')).toBeHidden();
  await expect(page.locator('#board')).toBeHidden();
  await expect(page.locator('#left-panel')).toBeHidden();
  await expect(page.locator('#rules-page h2').first()).toHaveText('Objective');
  await expect(page.locator('#rules-page')).toContainText(
    "you must remove one of your opponent's pieces"
  );
  await expect(page.locator('#rules-page')).toContainText(
    'Repetitions are only counted once all pieces have been placed.'
  );

  await page.locator('#customBackRules').click();
  await expect(page.locator('#game-page')).toBeVisible();
  await expect(page.locator('#board svg')).toBeVisible();
  await expect(page.locator('#rules-page')).toBeHidden();
});

test('returns from the about subpage through the browser back button', async ({ page }) => {
  await page.locator('#customMenu').click();
  await page.getByRole('link', { name: 'About…' }).click();
  await expect(page.locator('#about-page')).toBeVisible();
  await expect(page.locator('#board')).toBeHidden();

  await page.locator('#about-page').getByText('Third Party Code Licenses').click();
  await expect(
    page.locator('#about-page .ui-collapsible').last().locator('.ui-collapsible-content')
  ).toBeVisible();

  await page.goBack();
  await expect(page.locator('#game-page')).toBeVisible();
  await expect(page.locator('#board svg')).toBeVisible();
});

test('applies an option chosen on the options subpage', async ({ page }) => {
  await page.locator('#customMenu').click();
  await page.getByRole('link', { name: 'Options…' }).click();
  await expect(page.locator('#options-menu')).toBeVisible();
  await expect(page.locator('#board')).toBeHidden();
  await expect(page.locator('#options-menu')).toContainText(
    'Removable pieces are marked with a red ring.'
  );
  await expect(page.locator('#flyingAllowed')).toBeChecked();
  await expect(page.locator('#takeFromMill')).toBeChecked();

  await page.locator('label[for="showalgebraicnotation"]').click();
  await expect(page.locator('#showalgebraicnotation')).toBeChecked();
  await expect(page.locator('label[for="showalgebraicnotation"]')).toHaveClass(/ui-radio-on/);

  await page.getByRole('link', { name: 'Ok' }).click();
  await expect(page.locator('#game-page')).toBeVisible();
  await expect(page.locator('#board svg .board-notation')).toBeHidden();
  await place(page, 'd2');
  await expect(page.locator('#board svg .board-notation')).toBeVisible();
});

test('lets the AI answer a placement in the worker', async ({ page }) => {
  test.slow();
  await page.locator('#customMenu').click();
  await page.getByRole('link', { name: 'Options…' }).click();
  await page.locator('label[for="playerblackai"]').click();
  await page.getByRole('link', { name: 'Ok' }).click();

  await place(page, 'd2');
  await expect(page.locator('#board svg image[data-point][href*="dark"]')).toHaveCount(1, {
    timeout: 20_000
  });
  await expect(symbol(page)).toHaveText('🧑○8');
});

test('starts a new game from the sidebar', async ({ page }) => {
  await place(page, 'd2');
  await expect(point(page, 'd2')).toHaveJSProperty('tagName', 'image');

  await page.locator('#customMenu').click();
  await page.locator('#new').click();

  await expect(page.locator('#left-panel')).toBeHidden();
  await expect(emptyAt(page, 'd2')).toBeAttached();
  await expect(reserve(page, 'white')).toHaveCount(9);
  await expect(reserve(page, 'black')).toHaveCount(9);
  await expect(symbol(page)).toHaveText('🧑○9');
});
