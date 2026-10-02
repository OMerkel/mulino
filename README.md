# Mulino

* <em>Runs in various browsers on</em>
  * <em>desktop systems like BSDs, Linux, Win, MacOS and</em>
  * <em>mobile platforms like Android, FirefoxOS, iOS.</em>

**Mulino** - *Nine Men's Morris, a 2 player abstract strategic perfect
information traditional board game with computer AI option.*

## Play Online

- [Start game now...](https://omerkel.github.io/mulino/html5/src/)

## Abstract

*Mulino is a board game demonstrator with computer AI using Monte-Carlo
Tree Search (MCTS) with UCB (Upper Confidence Bounds) applied to trees (UCT
in short). Nine Men's Morris — also called Mill, Merels, Mulino, Moulin or
Mühle — is one of the oldest board games still played. Boards have been found
carved into Roman buildings, and the medieval Libro de los juegos
commissioned by Alfonso X el Sabio of León and Castile describes it as
"alquerque de nueve". This implementation started from the author's Alquerque
code base and keeps its architecture: plain HTML5, a Web Worker for the
search and pure functions for the rules.*

**Keywords, Categories** *Monte-Carlo Tree Search (MCTS),
Upper Confidence Bounds (UCB), UCB applied to trees (UCT), AI,
2-player board game, deterministic game with perfect information,
JavaScript, ECMAScript, W3C WebWorker*

## Description

Mulino is a board game using Monte-Carlo Tree Search (MCTS) with UCB (Upper
Confidence Bounds) applied to trees (UCT in short) for the computer player
AI. Each side, White and Black, can be played by a human or by the AI. The
search runs in a Web Worker, so the page stays responsive while the AI
thinks.

### Interface feedback

The game view exposes turn and move state directly on the board:

* A compact badge opposite the menu identifies the active player. `🧑` and
  `🤖` distinguish human and AI players; `○` identifies White and `●`
  Black. During placing the badge shows the pieces still in hand, and `✂`
  while a removal is pending. A small spinner rotates to the left of the
  symbol.
* Pieces still in hand wait in two reserve columns, White to the left and
  Black to the right of the board.
* While placing, any empty point accepts a click. While moving or flying,
  every piece that can start a legal move has a light-green circular ring;
  the selected piece uses a darker green ring painted above the other
  highlights.
* After a mill, every opponent piece that may be removed has a red ring.
* The previous move remains visible in light blue: a dashed ring marks its
  empty source and a solid ring marks the piece at its target.
* A placement and a flight are soft jumps: the piece grows toward the
  midpoint, then shrinks back to its normal size on the target. A move slides
  to the adjacent point, and a removed piece fades out.
* When the game ends, a translucent panel immediately below the title bar
  congratulates the winner and states whether the opponent was reduced to
  fewer than three pieces or had no legal move, or announces a draw by
  threefold repetition.

## Rules

The rules for players are maintained in 🇬🇧 English ([doc/rules.md](doc/rules.md)),
with translations in 🇩🇪 German ([doc/regeln.md](doc/regeln.md)),
🇫🇷 French ([doc/regles.md](doc/regles.md)),
🇮🇹 Italian ([doc/regole.md](doc/regole.md)) and
🇪🇸 Spanish ([doc/reglas.md](doc/reglas.md)).
The same text is available offline on the Rules page of the application.

In short:

* Each player has 9 pieces; the board has 24 points on three concentric
  squares. White places first.
* **Placing:** players alternately place one piece on any empty point.
* **Mill:** three own pieces in a row along a line. Closing a mill requires
  removing one opponent piece — only one, even for two mills at once. Pieces
  in a mill are protected unless no other piece is available.
* **Moving:** once all 18 pieces are placed, a piece slides along a line to an
  adjacent empty point. A mill can be opened and closed again.
* **Flying:** a player with exactly 3 pieces may move a piece to any empty
  point.
* **End:** a player loses with fewer than 3 pieces or without a legal move.
  The game is drawn when the same position occurs for the third time;
  repetitions are only counted once all pieces have been placed.

The Options page selects:

* whether White and Black are played by a human or by the AI,
* whether flying with three pieces is allowed (default) or not,
* whether a mill closed while every opponent piece stands in a mill removes a
  piece from a mill (default) or nothing,
* whether available target points are shown, and
* whether the algebraic board notation is shown.

## References

* Guillaume Maurice Jean-Bernard Chaslot,
  "[Monte-Carlo Tree Search](https://project.dke.maastrichtuniversity.nl/games/files/phd/Chaslot_thesis.pdf)",
  PHD Proefschrift, Universiteit Maastricht, NL, 2010.
* Guillaume Chaslot, Sander Bakkes, Istvan Szita and Pieter Spronck,
  "[Monte-Carlo Tree Search: A New Framework for Game AI](http://sander.landofsand.com/publications/AIIDE08_Chaslot.pdf)",
  in Proceedings of the Fourth Artificial Intelligence and Interactive Digital
  Entertainment Conference, Stanford, California, 2008. Published by The AAAI
  Press, Menlo Park, California.
* Alfonso X el Sabio, "Libro de los Juegos" or "Libros del Axedrez, Dados et
  Tablas", 98 double-sided pages, available at the monastery library Real Sitio
  de San Lorenzo del Escorial, Madrid, Spain, written from 1251 to 1282.
  * [Transcript/Translation into English](http://www.mediafire.com/?nenjj1dimtd)
    by Sonja Musser Golladay
* Robert Charles Bell, "Board and Table Games from Many Civilizations",
  Volume 1, Dover Publications, US, 1979.
* Sonja Musser Golladay,
  "[Los libros de acedrex dados e tablas: Historical, Artistic and Metaphysical
  Dimensions of Alfonso X's Book of Games][golladay]",
  PhD Dissertation, 591pp., The University of Arizona, US, 2007.
  * <http://hdl.handle.net/10150/194159>
  * <http://jnsilva.ludicum.org/HJT2k9/AlfonsoX.pdf>
* Arie van der Stoep,
  "[The origin of morris and draughts by etymology](http://bgsj.ludus-opuscula.org/PDF_Files/9_15_Stoep_print.pdf)",
  in Board Game Studies Journal, Issue 9, 2015, ISSN 2183-3311,
  <http://bgsj.ludus-opuscula.org>, published by Associação Ludus, Lisboa,
  Portugal, 2015.

[golladay]: http://arizona.openrepository.com/arizona/handle/10150/194159

## 3rd Party Libraries

The application itself ships **no third party runtime code**. It is plain
HTML5, CSS and ECMAScript modules and runs from any static web server.

Development dependencies (not shipped, see `package.json`):

* Vitest and @vitest/coverage-v8: unit tests and coverage
* jsdom: DOM for the unit tests of the view modules
* Playwright: end to end tests in a real browser
* Biome: linter and formatter for JavaScript, CSS, HTML and JSON
* markdownlint-cli2: linter for the documentation

## Usage

### Play

Serve the sources locally and open <http://localhost:4173/index.html>:

*Mind*: The port number of your local server is a matter of your environment settings.

```sh
npm run serve
```

The application needs no build step. `html5/src` is what gets deployed;
any static web server will do.

### Prerequisites for checks and tests

Node.js 20 or newer. Install the development tooling once, and the browser
used by the end to end tests:

```sh
npm install
npx playwright install chromium
```

### Run checks and tests

| Command | What it does |
| --- | --- |
| `npm run lint` | Biome (JavaScript, CSS, HTML, JSON) and markdownlint over the whole workspace |
| `npm run lint:code` | Biome only, warnings treated as errors |
| `npm run lint:md` | markdownlint only |
| `npm run lint:code:fix` | applies Biome's formatting and safe fixes |
| `npm run lint:md:fix` | applies markdownlint's automatic fixes |
| `npm test` | unit tests (Vitest, jsdom for the view modules) |
| `npm run test:watch` | unit tests in watch mode |
| `npm run coverage` | unit tests plus the 96 % statement, branch, function and line gate |
| `npm run test:e2e` | end to end tests in Chromium (Playwright, starts the server itself) |
| `npm run ci` | lint, coverage and end to end tests in the order used by the build server |

The current automated baseline contains 144 unit tests and 11 Chromium end to
end tests. Coverage thresholds are 96 % for statements, branches, functions and
lines.

A single unit test file, or a single test by name:

```sh
npx vitest run tests/unit/board.test.js
npx vitest run -t 'draws on the third occurrence of a position'
npx playwright test --headed -g 'closes a mill'
```

Reports are written to `coverage/` (open `coverage/index.html`) and to
`playwright-report/`; both are ignored by Git.

Lint findings are fixed in the source, never suppressed: there is no
`biome-ignore` and no `markdownlint-disable` anywhere in the workspace.

Requirements and their traceability to these tests are listed in
[doc/requirements.md](doc/requirements.md).

## Development

Source layout under `html5/src`:

| Path | Content |
| --- | --- |
| `index.html`, `css/` | markup and the hand written jQuery Mobile look-alike theme |
| `js/core/` | board topology, game rules and state as pure functions |
| `js/engine/` | UCT/MCTS and the random baseline engine |
| `js/worker/` | the Web Worker owning the game session |
| `js/ui/` | bootstrap, SVG board drawing, input, navigation, options |

Design and rationale:
[doc/requirements.md](doc/requirements.md),
[doc/software_architecture.md](doc/software_architecture.md),
[doc/engine_mcts_ucb.md](doc/engine_mcts_ucb.md).

## Links

* Association for the Advancement of Artificial Intelligence, <http://www.aaai.org>
* HTML Living Standard, Web Workers, <https://html.spec.whatwg.org>
* Standard ECMA-262 ECMAScript Language Specification,
  <http://www.ecma-international.org/publications/standards/Ecma-262.htm>
* Alphonso X - Book of Games - A Game Researcher's Resource,
  <http://historicgames.com/alphonso>
* Board Game Studies Journal, <http://bgsj.ludus-opuscula.org>

## Contributors / Authors

<table>
  <tr>
    <td>
      <p>Oliver Merkel,<br />
      <a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/4.0/"><img
        alt="Creative Commons License" style="border-width:0"
        src="http://i.creativecommons.org/l/by-nc-nd/4.0/88x31.png" /></a><br />
      This image is licensed under a
      <a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/4.0/">Creative
      Commons Attribution-NonCommercial-NoDerivatives 4.0 International License</a>.
      </p>
    </td>
    <td width="30%"><img width="100%" ondragstart="return false;"
      alt="Oliver Merkel, Creative Commons License, This image is licensed under
        a Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
        International License."
      src="html5/src/img/oliver_saar_kastel_staadt_260924.jpg" /></td>
  </tr>
</table>

*All logos, brands and trademarks mentioned belong to their respective owners.*
