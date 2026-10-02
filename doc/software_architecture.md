# Mulino (Nine Men's Morris) — Software Architecture

Architecture documentation of the HTML5 implementation found in
[html5/src](../html5/src). The functional requirements are the Nine Men's
Morris rules described in [doc/rules.md](rules.md) (German:
[doc/regeln.md](regeln.md), French: [doc/regles.md](regles.md), Italian:
[doc/regole.md](regole.md), Spanish: [doc/reglas.md](reglas.md)). The AI engine is
documented separately in
[doc/engine_mcts_ucb.md](engine_mcts_ucb.md); this document covers it only at
the level of its integration into the system.

All diagrams are UML-style Mermaid diagrams and can be rendered directly on
GitHub or in VS Code.

## Document map

| Document | Scope |
| --- | --- |
| [rules.md](rules.md) / [regeln.md](regeln.md) / [regles.md](regles.md) / [regole.md](regole.md) / [reglas.md](reglas.md) | game rules for human players, board-only |
| [requirements.md](requirements.md) | functional and non-functional requirements with test traceability |
| this document | structure, threading, message protocol, HMI and navigation |
| [engine_mcts_ucb.md](engine_mcts_ucb.md) | UCT/MCTS search: phases, UCB1 formula, budgets, known defects, backlog |

---

## 1. Overview

| Property | Value |
| --- | --- |
| Type | Single-page (multi-"page") client-side web application |
| Languages | HTML5, CSS3, ECMAScript modules (no build step, no transpiler) |
| UI framework | none — plain DOM, own page/panel navigation |
| Board rendering | inline SVG built with `createElementNS`; no graphics library |
| Concurrency | W3C Web Worker (one dedicated module worker) |
| Game AI | Monte-Carlo Tree Search with UCB applied to trees (UCT) |
| Persistence | none — the game state lives only in the worker |
| Server needs | static file hosting only |
| Tests | Vitest (unit, jsdom) and Playwright (end to end) |

The application follows a **Model–View–Controller** split that is physically
enforced by the Web Worker boundary:

* **View / HMI** — the modules under
  [html5/src/js/ui](../html5/src/js/ui) plus the DOM in
  [html5/src/index.html](../html5/src/index.html). Runs on the UI thread.
* **Controller** — [html5/src/js/worker/controller.js](../html5/src/js/worker/controller.js),
  started by [html5/src/js/worker/entry.js](../html5/src/js/worker/entry.js).
  Runs *inside* the worker.
* **Model** — [html5/src/js/core/board.js](../html5/src/js/core/board.js) and
  `html5/src/js/core/topology.js` (24 points, adjacency and the 16 mills) —
  rules and state as pure functions — plus the two action providers
  [html5/src/js/engine/uct.js](../html5/src/js/engine/uct.js) and
  [html5/src/js/engine/random.js](../html5/src/js/engine/random.js), both
  described in detail in [engine_mcts_ucb.md](engine_mcts_ucb.md).

The model is written in a functional style: the game state is a value, every
rule is a pure function of that value, and `applyAction` returns a new state
instead of mutating one. Side effects are confined to the view modules and to
the single mutable reference the worker controller keeps.

The key architectural driver is: **the UCT search may block for up to 5 seconds
per move**, therefore the model and the search must not run on the UI thread.

---

## 2. Context and Deployment

### 2.1 System context

```mermaid
flowchart LR
  human1(["Player ○<br/>(white pieces)"])
  human2(["Player ●<br/>(black pieces)"])

  subgraph browser["Web browser (desktop / mobile / Cordova WebView)"]
    app["Mulino HTML5 application"]
  end

  host[("Static web host<br/>github.io / APK assets")]

  human1 -- "touch / mouse / resize" --> app
  human2 -- "touch / mouse / resize" --> app
  app -- "renders board, menu,<br/>full screen subpages" --> human1
  app -- "renders board, menu,<br/>full screen subpages" --> human2
  host -- "HTTP GET: html, css, js, jpg, png, svg" --> browser
```

There is **no backend**. Both human players share one device ("hot seat"), or a
human plays against the built-in AI, or the AI plays against itself.

### 2.2 Deployment / artifact view

```mermaid
flowchart TB
  subgraph device["Device"]
    subgraph ui["UI thread (main JavaScript realm)"]
      idx["index.html<br/>«document»"]
      theme["css/theme.css"]
      css["css/index.css"]
      main["js/ui/main.js<br/>«bootstrap»"]
      hmi["js/ui/hmi.js"]
      svgv["js/ui/svgBoard.js"]
      nav["js/ui/navigation.js"]
      ctrls["js/ui/controls.js"]
      opts["js/ui/options.js"]
    end
    subgraph wk["Web Worker thread (type: module)"]
      ent["js/worker/entry.js"]
      ctl["js/worker/controller.js"]
      brd["js/core/board.js"]
      dirs["js/core/topology.js"]
      uct["js/engine/uct.js"]
      rnd["js/engine/random.js"]
    end
    img[("img/*.jpg, img/*.png,<br/>img/icons/*.svg")]
  end

  idx --> theme
  idx --> css
  idx -- "type=module" --> main
  main --> hmi --> opts
  main --> svgv
  main --> nav
  main --> ctrls
  main -- "new Worker(..., {type:'module'})" --> ent
  ent --> ctl
  ctl --> brd --> dirs
  ctl --> uct --> brd
  ctl -.-> rnd
  svgv -- "SVG image elements" --> img
  css -- "background urls" --> img
```

---

## 3. Component / package structure

```mermaid
flowchart TB
  subgraph view["«subsystem» View"]
    Hmi["hmi.js<br/>input, turn dispatch,<br/>layout arithmetic"]
    SvgBoard["svgBoard.js<br/>SVG scene, animation"]
    Navigation["navigation.js<br/>pages, panel, history"]
    Controls["controls.js<br/>radios, collapsibles"]
    Options["options.js<br/>option read-out"]
    DOM["index.html pages<br/>#game-page, #rules-page,<br/>#options-menu, #about-page"]
  end

  subgraph ctrl["«subsystem» Controller (worker)"]
    Controller["controller.js"]
  end

  subgraph model["«subsystem» Model (pure functions)"]
    Board["board.js"]
    Directions["topology.js"]
    Uct["uct.js"]
    Random["random.js"]
  end

  Hmi --> Options --> DOM
  Hmi -->|"draws / animates"| SvgBoard
  Navigation --> DOM
  Controls --> DOM
  Hmi <-->|"postMessage / onmessage"| Controller
  Controller --> Board --> Directions
  Controller --> Uct --> Board
  Controller -.-> Random --> Board
```

Dependency rule: the model has **no** knowledge of the view; the controller has
**no** DOM access (it cannot have — it runs in a worker). Rendering options
(`shown` / `hidden` toggles) are pure view concerns. They are included in the
request object produced by `readOptions()` but ignored by the worker; only
`flying`, `skipRemovalInMills`, `playerwhite` and `playerblack` affect worker behaviour.

---

## 4. Class diagram

There are no classes. The diagram shows the ES modules, the factory
functions they export (`«factory»`, closures holding the little state that has to
be mutable) and the pure functions (`«pure»`).

```mermaid
classDiagram
  class main {
    <<module>>
    +WORKER_URL
    +bootstrap(doc, win, createWorker) App
  }

  class hmi {
    <<factory>>
    +boardUnit(innerWidth, innerHeight) number
    +iconSize(unit) number
    +activePlayerBadge(board, options) Badge
    +createHmi(options) Hmi
  }

  class Hmi {
    <<closure>>
    -State board
    -Selection selection
    +resize()
    +update(board, actionInfo)
    +restart()
    +start()
    +handleEngineMessage(event) bool
    +getSelection() Selection
    +describeSelection() string
  }

  class svgBoard {
    <<factory>>
    +centreX(point) number
    +centreY(point) number
    +pieceFile(piece) string
    +reserveSlot(player, index) Coordinates
    +createBoardView(container, options) BoardView
  }

  class BoardView {
    <<closure>>
    -Element svg
    -ElementList field
    -ElementList reserves
    -Map listeners
    -Map sourceMarkers
    -Map removalMarkers
    -ElementList lastMoveMarkers
    +at(point) Element
    +bind(node, handler)
    +unbind(node)
    +clearHandlers()
    +animateAction(action, done)
    +restoreInitial()
    +synchronise(square, inHand)
    +setSize(size)
    +showNotation(visible)
    +setTargetVisible(point, visible)
    +setSourceSelectable(point, selectable)
    +setSourceSelected(point, selected)
    +setRemovable(point, removable)
    +setLastMove(action)
    +setCelebration(outcome)
  }

  class navigation {
    <<factory>>
    +HOME_PAGE
    +TRANSITIONS
    +durationOf(transition) number
    +createNavigation(doc, win, schedule) Navigation
  }

  class Navigation {
    <<closure>>
    +init()
    +activate(id, transition, reverse) bool
    +goTo(id, transition) bool
    +back()
    +openPanel()
    +closePanel()
    +activePage() Element
    +handleClick(event) bool
    +handlePopState(event)
  }

  class controls {
    <<module>>
    +enhanceRadios(doc) InputList
    +enhanceCollapsibles(doc) ElementList
    +refreshRadio(input)
  }

  class options {
    <<pure>>
    +readOptions(doc) Options
    +request(doc, name) Message
  }

  class controller {
    <<factory>>
    +MAX_ITERATIONS
    +MAX_TIME
    +describe(state, rules, data) Board
    +createController(scope, search) Controller
  }

  class Controller {
    <<closure>>
    -State state
    +handleMessage(event) bool
    +getState() State
    +setState(state)
  }

  class board {
    <<pure>>
    +createInitialState() State
    +pieceAt(state, point) int
    +piecesOnBoard(state, player) number
    +piecesLeft(state, player) number
    +phaseOf(state, rules) Phase
    +formsMill(field, point, player) bool
    +isInMill(field, point) bool
    +getPlacements(state) ActionList
    +getMoves(state) ActionList
    +getFlights(state) ActionList
    +getRemovals(state) ActionList
    +positionKey(state) PositionKey
    +isDraw(state) bool
    +getActions(state, rules) ActionList
    +applyAction(state, action, rules) State
    +getResult(state) ResultPair
    +isGameOver(state, rules) bool
    +render(state) string
  }

  class topology {
    <<pure>>
    +POINTS
    +ADJACENCY
    +MILLS
    +MILLS_AT
    +opponent(player) int
    +isAdjacent(a, b) bool
    +toAlgebraic(point) string
    +fromAlgebraic(name) int
  }

  class uct {
    <<pure>>
    +BLOCK_SIZE
    +createNode(parent, state, action, rules) UctNode
    +ucb1(child, parentVisits) number
    +selectChild(node) UctNode
    +addChild(node, state, index, rules) UctNode
    +update(node, result)
    +backpropagate(leaf, result)
    +mostVisitedChild(node) UctNode
    +playout(root, state, rules, random) number
    +getActionInfo(state, options) ActionInfo
  }

  class random {
    <<pure>>
    +getActionInfo(state, options) ActionInfo
  }

  main ..> hmi : creates
  main ..> svgBoard : creates
  main ..> navigation : creates
  main ..> controls
  hmi ..> options
  hmi ..> BoardView : uses
  hmi ..> Controller : postMessage\n(Web Worker channel)
  hmi --> Hmi
  svgBoard --> BoardView
  navigation --> Navigation
  controller --> Controller
  controller ..> board
  controller ..> uct
  controller ..> random
  uct ..> board
  random ..> board
  board ..> topology
```

### 4.1 Model value objects

Every one of these is a plain, freely copyable value; nothing carries behaviour.

| Object | Shape | Meaning |
| --- | --- | --- |
| `Point` | integer `0..23` | index into `POINTS`; `POINTS[i]` is `{ x: 0..6, y: 0..6 }`, `x` = column `a`..`g`, `y` = row `1`..`7` |
| `Piece` | `WHITE` \| `BLACK` \| `null` | content of one point |
| `Phase` | `'placing'` \| `'moving'` \| `'flying'` \| `'removing'` | derived from the state for the side to move, never stored |
| `Action` | `{ type: 'place'\|'move'\|'fly'\|'remove', by, from?, to?, at? }` | `from` for move/fly, `to` for place/move/fly, `at` for remove |
| `State` | `{ field, active, inHand, pendingRemoval, history, previousAction }` | `field` has 24 entries, `inHand` is `[white, black]`, `history` is a linked list of position keys with their occurrence counts; the whole position, replaced on every action |
| `PositionKey` | string of `field` and `active` | identity of a position for the threefold-repetition rule |
| `Rules` | `{ flying: boolean, skipRemovalInMills: boolean }` | the rule variants offered by the Options page: flying ("optional in some rule sets") and skipping the removal when every opponent piece stands in a mill (default `false`) |
| `Board` | `{ square, turn, phase, inHand, actions, pendingRemoval, previous, nextishuman, outcome }` | the snapshot sent to the HMI; while `pendingRemoval` is set, `actions` contains only `remove` actions |
| `Outcome` | `{ winner: WHITE\|BLACK\|null, reason: 'fewer-than-three-pieces'\|'no-legal-move'\|'threefold-repetition' }` | terminal result used for the celebration; `winner` is `null` for a draw; `null` while play continues |
| `ActionInfo` | `{ action, info }` | chosen action plus a diagnostic string |

---

## 5. Model: rules realisation

The rule text of [doc/rules.md](rules.md) maps onto code as follows.

| Rule | Realisation |
| --- | --- |
| 24 points on three concentric squares connected by lines | `POINTS` and the symmetric `ADJACENCY` lists (32 edges) in `topology.js` |
| Algebraic notation `a1`..`g7`, only 24 valid names | `toAlgebraic()` / `fromAlgebraic()` over `POINTS` |
| 9 pieces per player | `inHand: [9, 9]` in `createInitialState()` |
| White starts | `active: WHITE` in `createInitialState()` |
| Phase 1: place one piece per turn on any empty point | `getPlacements()` while `inHand[active] > 0` |
| Mill = 3 own pieces in a row along a line | `MILLS` (16 triples); `formsMill(field, point, player)` checks only the two mills in `MILLS_AT[point]` |
| Forming a mill: the opponent **must** lose one piece | `applyAction()` keeps the turn and sets `pendingRemoval` whenever `getRemovals()` is non-empty; `getActions()` then returns only `getRemovals()` — there is no "pass" action |
| Two mills closed at once remove only one piece | a single `pendingRemoval` flag, cleared by the first `remove` |
| Pieces in a mill are protected unless no other piece is available | `getRemovals()` filters `isInMill()` and falls back to all opponent pieces when the filtered list is empty |
| Optional rule: skip the removal when every opponent piece stands in a mill | with `rules.skipRemovalInMills` the fallback list is empty, so `applyAction()` hands the turn over without `pendingRemoval` |
| Phase 2: slide to an adjacent empty point once all 18 pieces are placed | `getMoves()` when `inHand[active] === 0`; White starts, so both hands are empty at that point |
| A mill can be broken and reformed | emergent: the mill check runs on the destination point of every action and keeps no memory of earlier mills |
| Phase 3: flying with exactly 3 pieces, optional | `getFlights()` when `inHand[active] === 0`, `piecesOnBoard === 3` and `rules.flying` |
| Lose: fewer than 3 pieces | `piecesLeft()` (on board + in hand) `< 3` for the side to move; `getActions()` returns `[]` |
| Lose: no legal moves | `getActions().length === 0` at turn start; `getResult()` scores the side to move as the loser |
| Draw: same position for the third time, not necessarily consecutive, counted only once all pieces are placed | whenever the turn passes and both `inHand` entries are `0`, `applyAction()` prepends `positionKey(next)` to `history` with its occurrence count; `isDraw()` is true at `3`, `getActions()` returns `[]` and `getResult()` returns `[0.5, 0.5]` |

A position is the same when the same pieces stand on the same points and the
same player is to move — exactly the wording of rules.md. Positions are only
counted once all pieces have been placed, so `history` stays empty during the
placing phase. A removal makes every earlier position unreachable, so it starts
a fresh history. Intermediate states with a pending
removal are not counted, because a player at the physical board sees them only
as half of a turn. Since the number of positions is finite and each may occur at
most three times, every game — and every random playout of the engine — ends.

The topology tables are checked in `tests/unit/topology.test.js`: 24 points,
symmetric adjacency with 32 edges, 16 mills, every point in exactly two mills,
and every algebraic name round-trips.

### 5.1 Action generation — activity diagram

```mermaid
flowchart TD
  A([getActions]) --> B{"pendingRemoval?"}
  B -- yes --> C["getRemovals():<br/>opponent pieces outside any mill"]
  C --> C1{"any found?"}
  C1 -- yes --> R1([return remove actions])
  C1 -- no --> C2["all opponent pieces"]
  C2 --> R1
  B -- no --> X{"isDraw()?<br/>position occurred 3 times"}
  X -- yes --> RX([return empty list<br/>draw])
  X -- no --> D{"piecesLeft(active) < 3?"}
  D -- yes --> R0([return empty list<br/>game over])
  D -- no --> E{"inHand[active] > 0?"}
  E -- yes --> F["getPlacements():<br/>one place action per empty point"]
  E -- no --> G{"piecesOnBoard(active) == 3<br/>AND rules.flying?"}
  G -- yes --> H["getFlights():<br/>own piece x every empty point"]
  G -- no --> I["getMoves():<br/>own piece x adjacent empty point"]
  F --> R2([return actions<br/>empty list = game over])
  H --> R2
  I --> R2
```

During placing there are always at least 6 empty points, so a placing player is
never blocked; *no legal move* can only occur in the moving phase. `pendingRemoval`
is only ever set when `getRemovals()` is non-empty (see 5.2), so the remove
branch never returns an empty list.

### 5.2 `applyAction` — state transition

`applyAction(state, action, rules)` needs the rules for the optional
removal-skip variant.

```mermaid
flowchart TD
  S([applyAction state, action, rules]) --> T{"action.type"}
  T -- "place" --> P1["field[to] := active<br/>inHand[active] -= 1"]
  T -- "move / fly" --> M1["field[from] := empty<br/>field[to] := active"]
  P1 --> K{"formsMill(field, to, active)<br/>AND getRemovals() non-empty?"}
  M1 --> K
  K -- "yes" --> K1["pendingRemoval := true<br/>keep the turn"]
  K -- "no" --> K2["active := opponent(active)<br/>record positionKey in history<br/>(only when both hands are empty)"]
  T -- "remove" --> R1["field[at] := empty<br/>pendingRemoval := false"]
  R1 --> K2
  K1 --> Z["previousAction := action"]
  K2 --> Z
  Z --> E([return the new state])
```

A turn that closes a mill therefore consists of **two** actions by the same
player — the place/move/fly followed by a remove — which is exactly the
notation `d7-g7xb2` of rules.md split at the `x`. With
`rules.skipRemovalInMills` and every opponent piece in a mill, `getRemovals()`
is empty and the mill-closing action alone ends the turn.

### 5.3 Game state machine

The states describe the side to move; every transition except the one into
*Removal pending* hands the turn to the opponent.

```mermaid
stateDiagram-v2
  [*] --> Placing : createInitialState(), active = WHITE, inHand = [9, 9]

  state "Placing\n(side to move has pieces in hand)" as Placing
  state "Removal pending\n(same side keeps the turn)" as Removing
  state "Moving\n(slide to an adjacent empty point)" as Moving
  state "Flying\n(exactly 3 pieces, rules.flying)" as Flying
  state "Game over" as GameOver
  state "Draw" as Draw

  Placing --> Removing : place [forms a mill]
  Placing --> Placing : place [no mill, next side has pieces in hand]
  Placing --> Moving : place [no mill, all 18 placed]
  Placing --> Flying : place [no mill, all placed, next side has 3 pieces]
  Moving --> Removing : move [forms a mill]
  Moving --> Moving : move [no mill]
  Moving --> Flying : move [no mill, next side has 3 pieces]
  Flying --> Removing : fly [forms a mill]
  Flying --> Flying : fly [no mill, next side has 3 pieces]
  Flying --> Moving : fly [no mill, next side has more than 3 pieces]
  Removing --> Placing : remove [next side has pieces in hand]
  Removing --> Moving : remove [next side has more than 3 pieces]
  Removing --> Flying : remove [next side has exactly 3 pieces]
  Removing --> GameOver : remove [next side has fewer than 3 pieces]
  Moving --> GameOver : getActions() empty
  Moving --> Draw : position occurs for the third time
  Flying --> Draw : position occurs for the third time
  GameOver --> [*]
  Draw --> [*]
```

With `rules.flying === false` the *Flying* state is never entered; a player
with 3 pieces keeps sliding. A mill closed while every opponent piece stands
in a mill skips *Removal pending* when `rules.skipRemovalInMills` is set. A draw
is only reachable in the moving and flying phases, because repetitions are only
counted once all pieces have been placed.

### 5.4 UCT search — activity diagram

Overview only; the authoritative engine description, including the UCB1 formula,
the budget semantics and the known defects, is
[engine_mcts_ucb.md](engine_mcts_ucb.md).

```mermaid
flowchart TD
  A([getActionInfo state,<br/>maxIterations = 8000,<br/>maxTime = 5000 ms]) --> B["root := createNode(null, state, null, rules)"]
  B --> C{"iterations < 8000<br/>AND now < timeLimit?"}
  C -- no --> Z([return mostVisitedChild().action<br/>+ nodes/sec info])
  C -- yes --> D["block of 50 playouts"]
  D --> E["node := root<br/>variant := state"]
  E --> F{"node fully expanded<br/>AND has children?"}
  F -- yes --> G["node := selectChild(node)<br/>UCB1: w/n + sqrt(2 ln N / n)"]
  G --> H["variant := applyAction(variant, node.action, rules)"]
  H --> F
  F -- no --> I{"unexamined actions left?"}
  I -- yes --> J["pick random unexamined action<br/>applyAction, node := addChild(...)"]
  I -- no --> K
  J --> K["Simulation:<br/>random place / move / fly / remove actions<br/>until getActions() is empty (win or draw)"]
  K --> L["result := getResult(variant)"]
  L --> M["Backpropagation:<br/>walk to root, update(node, result)"]
  M --> C
```

`getResult()` returns `[1, 0]` when White is to move and `[0, 1]` when Black is
to move; since the side to move at a terminal position has fewer than 3 pieces
or *no* legal action, the entry set to `1` marks the **loser**. A threefold
repetition yields `[0.5, 0.5]`. Every node stores the `mover`, the player who
made the incoming action, and `update()` adds `1 - result[node.mover]`, i.e. how
often that action led to a win for the player who chose it — exactly the value
the parent maximises in `selectChild()`.

> After an action that closes a mill the mover does not change, because the
> same player still has to remove a piece. Storing the mover of the incoming
> edge, rather than the side to move at the node, keeps these mill-closing
> edges scored from the right perspective. See
> [engine_mcts_ucb.md](engine_mcts_ucb.md) section 2.4.

---

## 6. Runtime: message protocol between HMI and worker

### 6.1 Interface definition

**HMI → Controller** (`engine.postMessage`), discriminated by `class` /
`request`:

| `request` | Extra payload | Effect |
| --- | --- | --- |
| `start` | options | first render of the current state |
| `restart` | options | `createInitialState()`, then `restore` + `redraw` |
| `perform` | `action` | apply a human action (place, move, fly or remove), then `redraw` |
| `actionbyai` | options | let the AI pick and apply one action, then `redraw` |

Options carried on **every** request: `playerwhite`, `playerblack`
(`'Human'` \| `'AI'`), `flying` and `skipRemovalInMills` (`boolean`). They are read from the
Options page at send time, which implements the UI hint *"All selections will be
applied on next move or new game."* The two purely visual options
(`showavailablemove`, `showalgebraicnotation`) travel with the message as well
but are ignored by the worker.

Each request applies exactly **one** action. A turn that closes a mill thus
takes two round trips: the first `redraw` arrives with `pendingRemoval` set and
the same `turn`, the second request carries the `remove` action.

**Controller → HMI** (`self.postMessage`), discriminated by `eventClass` /
`request`:

| `request` | Payload | Effect |
| --- | --- | --- |
| `restore` | `board` | `view.restoreInitial()` |
| `redraw` | `board`, `actioninfo` | `hmi.update(board, actionInfo)` |

> Observation: the two directions use different discriminator property names
> (`class` outbound vs. `eventClass` inbound). This asymmetry of the original
> protocol was kept on purpose so that the message contract did not change.

### 6.2 Communication diagram (object message exchange)

```mermaid
flowchart LR
  H["hmi : Hmi<br/>«UI thread»"]
  W["controller : Controller<br/>«Worker thread»"]
  B["board.js<br/>«pure»"]
  U["uct.js<br/>«pure»"]
  P["view : BoardView<br/>(inline SVG)"]
  D["dom : pages and radio buttons"]

  H -- "1: postMessage(start / restart /<br/>perform / actionbyai)" --> W
  W -- "2: getActions() / applyAction() / describe()" --> B
  W -- "3: getActionInfo(state, 8000, 5000)" --> U
  U -- "3.1: getActions(), applyAction(), getResult()" --> B
  W -- "4: postMessage(redraw / restore)" --> H
  H -- "5: animateAction(), setSize(), showNotation()" --> P
  H -- "6: readOptions() from the checked radios" --> D
```

### 6.3 Sequence — application start

```mermaid
sequenceDiagram
  autonumber
  participant Browser
  participant DOM as index.html / plain DOM
  participant Hmi
  participant Paper as BoardView (inline SVG)
  participant W as Worker (Controller)
  participant Board as board.js

  Browser->>DOM: parse index.html, css/theme.css, css/index.css
  Browser->>Hmi: js/ui/main.js evaluated (type=module, deferred)
  Hmi->>Hmi: bootstrap()
  Hmi->>Paper: createBoardView(#board): svg viewBox 0 0 9 7
  Hmi->>Paper: board background, 16 lines, 24 dots, hidden notation labels
  Hmi->>Paper: 24 point elements + 18 reserve pieces (9 per side, off-board)
  Hmi->>Hmi: navigation.init(), enhanceRadios(), enhanceCollapsibles()
  Hmi->>Browser: addEventListener('resize', hmi.resize) ; resize()
  Hmi->>W: new Worker('js/worker/entry.js', {type:'module'})
  W->>Board: createInitialState()
  Hmi->>W: {class:'request', request:'start', options}
  W->>Board: getActions(state, rules)
  Board-->>W: action list
  W-->>Hmi: {eventClass:'request', request:'redraw', board, actioninfo:null}
  Hmi->>Hmi: update(board, null)
  alt board.nextishuman
    Hmi->>Paper: show a target on every empty point (placing phase)
  else AI to move
    Hmi->>W: {request:'actionbyai', options}
  end
```

### 6.4 Sequence — human turn (including mill and removal)

```mermaid
sequenceDiagram
  autonumber
  actor P as Player
  participant Hmi
  participant Paper as BoardView (SVG)
  participant W as Worker (Controller)
  participant Board as board.js

  Note over Hmi: board.actions already known from last redraw
  alt placing phase
    Hmi->>Paper: show target rects on every empty point, bind clickTarget
    P->>Paper: click on an empty point
    Paper-->>Hmi: clickTarget(event)
  else moving or flying phase
    P->>Paper: click on own piece
    Paper-->>Hmi: clickSelect(event)
    Hmi->>Hmi: deactivateSelection(), selection.from := point index
    Hmi->>Paper: darken and raise the selected source ring
    Hmi->>Paper: activateSelection(): adjacent empty targets (moving)<br/>or every empty point (flying), bind clickTarget
    P->>Paper: click on a target point
    Paper-->>Hmi: clickTarget(event)
  end
  Hmi->>Hmi: look the action up in board.actions
  Hmi->>Paper: clearHandlers()
  Hmi->>W: {request:'perform', action, playerwhite, playerblack, flying, skipRemovalInMills}
  W->>Board: applyAction(state, action, rules)
  Board-->>W: new state, turn kept if a mill was closed
  W-->>Hmi: {request:'redraw', board, actioninfo}
  Hmi->>Hmi: update #active-player from board.turn + options
  Hmi->>Paper: animateAction(): reserve to point (place),<br/>slide (move) or soft jump (fly)
  Hmi->>Paper: replace last-move rings:<br/>dashed blue source + solid blue target
  opt mill closed (board.pendingRemoval)
    Hmi->>Paper: red rings on removable opponent pieces,<br/>bind clickRemove
    P->>Paper: click on a marked opponent piece
    Paper-->>Hmi: clickRemove(event)
    Hmi->>Paper: clearHandlers()
    Hmi->>W: {request:'perform', action: remove, options}
    W->>Board: applyAction(state, remove, rules)
    W-->>Hmi: {request:'redraw', board, actioninfo}
    Hmi->>Paper: fade out the removed piece
  end
  alt next player is human
    Hmi->>Hmi: prepareHumanMove(): targets (placing)<br/>or legal source pieces (moving / flying)
  else next player is AI
    Hmi->>W: {request:'actionbyai', options}
  else no actions left
    Hmi->>Paper: show celebration with winner and reason, or the draw
    Note over Hmi: game over — no handlers bound, board frozen
  end
```

### 6.5 Sequence — AI move

```mermaid
sequenceDiagram
  autonumber
  participant Hmi
  participant W as Worker (Controller)
  participant Uct as uct.js
  participant Node as UctNode tree
  participant Board as board.js

  Hmi->>W: {request:'actionbyai', playerwhite, playerblack, flying, skipRemovalInMills}
  W->>Uct: getActionInfo(state, {maxIterations:8000, maxTime:5000, rules})
  Uct->>Node: root := createNode(null, state, null, rules)
  loop until 8000 iterations or 5000 ms (blocks of 50)
    Uct->>Node: selectChild() (UCB1) — Selection
    Uct->>Node: addChild(...) — Expansion
    Uct->>Board: random applyAction() until getActions() empty — Simulation
    Uct->>Board: getResult()
    Uct->>Node: update(result) up to the root — Backpropagation
  end
  Uct-->>W: {action: mostVisitedChild(root).action, info: 'n nodes/sec examined.'}
  W->>Board: applyAction(state, action, rules)
  W-->>Hmi: {request:'redraw', board, actioninfo}
  Hmi->>Hmi: update() → animation → next turn dispatch
  Note over Hmi: UI thread stays responsive during the whole search;<br/>menu and subpages remain usable
```

When the AI closes a mill, the `redraw` carries `pendingRemoval` with
`nextishuman === false`, so the HMI immediately sends a second `actionbyai`;
the AI's removal is searched and animated as an action of its own.

Search internals (selection, expansion, simulation, backpropagation, budget
handling) are documented in [engine_mcts_ucb.md](engine_mcts_ucb.md).

### 6.6 Sequence — new game

```mermaid
sequenceDiagram
  autonumber
  actor P as Player
  participant DOM as sidebar panel
  participant Hmi
  participant W as Worker (Controller)
  participant Board as board.js

  P->>DOM: tap hamburger icon (#customMenu)
  DOM->>DOM: navigation.openPanel(): #left-panel gets ui-panel-open
  P->>DOM: tap "New" (#new)
  DOM-->>Hmi: click → hmi.restart()
  Hmi->>Hmi: view.clearHandlers(), selection := null
  Hmi->>W: {request:'restart', options}
  Hmi->>DOM: navigation.closePanel()
  W->>Board: createInitialState()
  W-->>Hmi: {request:'restore', board}
  Hmi->>Hmi: view.restoreInitial() (all 18 pieces back to the reserves)
  W-->>Hmi: {request:'redraw', board, actioninfo:null}
  Hmi->>Hmi: update(board, null) → bind human input or ask AI
```

---

## 7. Use cases

```mermaid
flowchart LR
  P(["Player"])
  O(["Opponent<br/>(second human)"])
  AI(["AI engine<br/>«system actor»"])

  subgraph sys["Mulino application"]
    UC1(["Play a turn<br/>place / move / fly"])
    UC2(["Remove an opponent piece"])
    UC3(["Start a new game"])
    UC4(["Read the rules"])
    UC5(["Read about / licenses"])
    UC6(["Change options"])
    UC7(["Choose player type<br/>Human / AI"])
    UC8(["Allow / forbid flying"])
    UC13(["Choose removal when all<br/>opponent pieces are in mills"])
    UC9(["Show / hide available targets"])
    UC10(["Show / hide algebraic notation"])
    UC11(["Resize / rotate device"])
    UC12(["Let AI compute an action"])
  end

  P --- UC1
  P --- UC3
  P --- UC4
  P --- UC5
  P --- UC6
  P --- UC11
  O --- UC1
  UC1 -. "«extend» when a mill is closed" .-> UC2
  UC1 -. "«include» when side to move is AI" .-> UC12
  UC12 --- AI
  UC6 -. "«include»" .-> UC7
  UC6 -. "«include»" .-> UC8
  UC6 -. "«include»" .-> UC9
  UC6 -. "«include»" .-> UC10
  UC6 -. "«include»" .-> UC13
```

### 7.1 Use case "Play a turn" (human)

| Item | Description |
| --- | --- |
| Actor | Player whose colour is configured as `Human` |
| Precondition | `board.nextishuman == true`, i.e. it is that colour's turn and at least one legal action exists |
| Trigger | Placing: tap/click on a highlighted empty point. Moving / flying: tap/click on one of the highlighted-source pieces |
| Main flow | 1. Placing: the target is selected directly. Moving / flying: select source → adjacent (moving) or all empty (flying) targets become clickable, then select target. 2. HMI matches the choice against `board.actions` and posts it as `perform`. 3. Worker applies it and answers `redraw`. 4. HMI animates. 5. Turn passes, or — if a mill was closed — the same player continues with *Remove an opponent piece*. |
| Alternative | Selecting a different source before a target: `deactivateSelection()` removes the old target bindings first. |
| Postcondition | Board rendered in the new state; input handlers bound for whoever acts next. |
| Exception | No action list entry matches → nothing is posted; the board keeps waiting. |

### 7.2 Use case "Remove an opponent piece" (human)

| Item | Description |
| --- | --- |
| Precondition | `board.pendingRemoval == true` and `board.nextishuman == true` |
| Main flow | 1. Removable opponent pieces get red rings. 2. Player taps one. 3. HMI posts the `remove` action. 4. Worker applies it, hands the turn over and answers `redraw`. 5. HMI fades the piece out. |
| Business rule | Removal is compulsory, one piece even when two mills were closed. Pieces in a mill are only offered when the opponent has no piece outside a mill; with the optional rule `skipRemovalInMills` that case removes nothing and this use case is not entered. |
| Postcondition | Opponent to move, celebration if the opponent is down to fewer than 3 pieces, or a draw announcement if the resulting position occurred for the third time. |

---

## 8. HMI internal structure and navigation

This is the part the user interacts with most, so it is documented in detail.

### 8.1 Composite structure of the game page

`#game-page` uses border-box sizing and a height of `100vh`, upgraded to
`100dvh` in browsers that support dynamic viewport units. The fixed-header
padding is therefore included in the viewport height. Overflow is hidden on the
game page only, removing browser scrollbars while Rules and About remain
scrollable. The textured background covers the complete visible viewport.

```mermaid
flowchart TB
  subgraph gp["#game-page — .ui-page.ui-page-theme-b.mybackground.ui-page-header-fixed"]
    hdr["div.ui-header.ui-bar-inherit.ui-header-fixed<br/>a#customMenu (hamburger, left)<br/>#myheader 'Mulino' (centre)<br/>span#active-player (spinner + type + side, right)"]
    cnt["div[role=main].mycontent.ui-content<br/>noscript fallback<br/>center > div#board  ← SVG canvas"]
    pnl["div#left-panel.ui-panel<br/>.ui-panel-position-left.ui-panel-display-overlay"]
    dis["div.ui-panel-dismiss"]
  end

  subgraph lst["ul.ui-listview inside .ui-panel-inner"]
    i0["Back — data-rel='close'"]
    i1["New — a#new (JS handler)"]
    i2["Rules… → #rules-page, data-transition='pop'"]
    i3["Options… → #options-menu, data-transition='slideup'"]
    i4["About… → #about-page, data-transition='pop'"]
  end

  pnl --> lst
  cnt --> svg["svg.mulino-paper, viewBox 0 0 9 7<br/>drawn board lines + 24 point elements<br/>two reserve columns with pieces in hand<br/>dynamic source, removal and last-move ring overlays"]
```

### 8.2 Sidebar menu and full-screen subpages

`index.html` contains **four** elements with class `ui-page`:
`#game-page`, `#rules-page`, `#options-menu`, `#about-page`.

[navigation.js](../html5/src/js/ui/navigation.js) shows **exactly one page at a
time**: the active page carries `ui-page-active`, every other one is
`display: none` through `.ui-page`. Therefore navigating from the sidebar to
*Rules…*, *Options…* or *About…*:

1. hides `#game-page` **including the whole `#board` SVG canvas** — the game
   board is not merely covered, it is removed from the visual flow, so the
   subpage is genuinely full screen;
2. shows the requested subpage with the configured transition
   (`pop` for Rules and About, `slideup` for Options), by adding the animation
   classes `<transition> in` to the incoming and `<transition> out` to the
   outgoing page and stripping them again after the animation;
3. pushes a history entry (`history.pushState`, hash `#<page id>`), so the
   hardware/browser Back button works.

Returning is always a **back navigation** (`data-rel='back'` →
`history.back()`), never a forward link. Each subpage offers two equivalent ways
back:

* the round icon button in the header (`#customBackRules`, `#customBackOptions`
  — labelled *Close*, `#customBackAbout`), and
* a full-width button at the very bottom of the content (*Back* / *Ok*).

The `popstate` handler activates the page named in the history entry, or
`#game-page` when there is none, and replays the transition in reverse. The
board becomes visible in exactly the state it was left in — the SVG DOM is never
torn down, and no engine message is exchanged. The worker keeps the
authoritative game state, so the game cannot be disturbed by navigating away; an
AI search that is running continues undisturbed in the worker while a subpage is
open.

The sidebar panel itself is an **overlay panel**, not a page: it slides over
`#game-page` and is closed either by the *Back* item (`data-rel='close'`), by
tapping the dismiss layer outside it, or programmatically when *New* is chosen.

```mermaid
stateDiagram-v2
  [*] --> GamePageVisible

  state "Game page visible\n(#game-page active, board shown)" as GamePageVisible
  state "Sidebar overlay open\n(board still shown underneath)" as PanelOpen
  state "Rules page\n(#rules-page active, board hidden)" as RulesPage
  state "Options page\n(#options-menu active, board hidden)" as OptionsPage
  state "About page\n(#about-page active, board hidden)" as AboutPage

  GamePageVisible --> PanelOpen : tap #customMenu
  PanelOpen --> GamePageVisible : "Back" item / tap the dismiss layer
  PanelOpen --> GamePageVisible : tap "New" → restart() + closePanel()

  PanelOpen --> RulesPage : "Rules…" (transition pop)
  PanelOpen --> OptionsPage : "Options…" (transition slideup)
  PanelOpen --> AboutPage : "About…" (transition pop)

  RulesPage --> GamePageVisible : #customBackRules / bottom Back / browser back
  OptionsPage --> GamePageVisible : #customBackOptions ("Close") / "Ok" / browser back
  AboutPage --> GamePageVisible : #customBackAbout / bottom Back / browser back

  note right of OptionsPage
    Radio button state persists in the DOM.
    It is read on demand by the Hmi
    (post, activateSelection, update) —
    never pushed.
  end note

  note right of GamePageVisible
    Board and pieces stay alive in the DOM
    the whole time; only CSS visibility of
    the page container changes.
  end note
```

### 8.3 Navigation activity — leaving and re-entering a subpage

```mermaid
flowchart TD
  A([User taps hamburger #customMenu]) --> B["navigation opens #left-panel as overlay"]
  B --> C{"menu item"}
  C -- "Back / dismiss layer" --> D["panel closes<br/>game board interaction resumes"]
  C -- "New" --> E["hmi.restart()<br/>post 'restart' + closePanel()"]
  C -- "Rules… / Options… / About…" --> F["navigation.goTo(target, transition)"]
  F --> G["#game-page loses ui-page-active<br/>→ display:none<br/>→ #board (svg) hidden"]
  G --> H["subpage gets ui-page-active<br/>→ full screen content, own header"]
  H --> I["user reads / toggles radio buttons"]
  I --> J([tap round Back/Close icon,<br/>bottom Back/Ok button,<br/>or device back])
  J --> K["history.back() → popstate<br/>subpage → display:none"]
  K --> L["#game-page re-activated<br/>board and all pieces visible again,<br/>unchanged position and pending input"]
  L --> M{"option changed?"}
  M -- yes --> N["takes effect on the next message,<br/>because options are read at send time<br/>(and notation/highlight at next update())"]
  M -- no --> O([continue play])
  N --> O
  D --> O
  E --> O
```

### 8.4 Where each option is consumed

| Option (DOM id) | Read in | Consumed by |
| --- | --- | --- |
| `#playerwhiteai`, `#playerblackai` | `readOptions()` on every `post()` and `update()` | `describe()` → `board.nextishuman`; `activePlayerBadge()` → title-bar symbol and label |
| `#flyingAllowed` | `readOptions()` on every `post()` | `toRules()` → `rules.flying` |
| `#skipRemovalInMills` | `readOptions()` on every `post()` | `toRules()` → `rules.skipRemovalInMills`; default unchecked (take a piece from a mill) |
| `#showavailablemove` | `activateSelection()` | opacity of the target rectangles (`0.4` vs. `0`) |
| `#showalgebraicnotation` | `update()` | `view.showNotation()` shows or hides the column and row labels |

Consequence of this pull-based design: the two *rendering* options act on the
next repaint or selection, the three *engine* options act on the next message —
matching the hint text *"All selections will be applied on next move or new
game."* on the Options page.

On every `redraw`, `activePlayerBadge()` combines `board.turn` with the current
player-type options. The right-aligned badge displays `🧑○` or `🤖○` for
`Player ○` (White) and `🧑●` or `🤖●` for `Player ●` (Black), followed by
the number of pieces still in hand during the placing phase and a scissors
hint `✂` while a removal is pending. Its `aria-label` and tooltip
provide the equivalent textual description. A small
CSS-animated spinner sits to the left of the symbol and is marked
`aria-hidden` because it is purely decorative. The compact status span has a
dark background, rounded light-orange border and horizontal padding.

`BoardView` owns three independent visual marker sets. `sourceMarkers` contains
the light-green rings for legal human move origins (moving and flying phase
only; in the placing phase the empty points are offered directly as targets).
Selecting one darkens it and moves its circle to the end of the SVG child list,
which is the SVG equivalent of raising its z-index. `removalMarkers` contains
the red rings around opponent pieces that may be removed while
`board.pendingRemoval` is set; pieces protected by a mill stay unmarked unless
no other piece is available. `lastMoveMarkers` contains a light-blue dashed
source ring and solid target ring at half the green stroke width; a placement
has a target ring only, a removal leaves the previous pair in place. The blue
pair is replaced after each completed animation and removed by `restore`.

Pieces in hand are drawn in the two reserve columns left (White) and right
(Black) of the board. A placement animates the topmost reserve piece onto its
point, so the remaining count is always visible on the board itself.

The board container also owns `.winning-celebration`, an HTML status overlay
fixed immediately below the title bar and horizontally centred over the SVG.
`hmi.resize()` publishes the responsive control height through
`--game-title-bar-height`, leaving a small stable gap below the title controls.
A terminal board snapshot carries
the winning side and either `fewer-than-three-pieces` or `no-legal-move`, or
`winner: null` with `threefold-repetition`, in which case the panel announces a
draw instead of congratulating a winner. The HMI
reveals the panel after the final move animation, or immediately for a terminal
redraw without an action. `restore` hides it. The panel uses 70 % opacity,
rounded corners and a thin light-orange border.

### 8.5 Responsive layout

`hmi.resize()` is bound to `window.resize` and additionally called at the start
of every `update()`:

```mermaid
flowchart TD
  A([window resize / update]) --> B["availableWidth = innerWidth - 32<br/>availableHeight = innerHeight - 64"]
  B --> C["unit = min(width / 9, height / 7)<br/>view.setSize(unit)"]
  C --> D["#board margin-top = (availableHeight - 7 unit) / 2<br/>→ vertical centring"]
  D --> E["#game-page background-size = auto (unit)px<br/>→ background tiles with the board grid"]
  E --> F["icon = clamp(0.7 unit, 38 px, 100 px)"]
  F --> G["apply icon size to #customMenu,<br/>#customBackRules, #customBackOptions, #customBackAbout"]
```

Because the SVG canvas uses `viewBox="0 0 9 7"` — a 7 × 7 board grid plus one
reserve column on each side — all board geometry is expressed in board units
and scaling is free of layout maths: a piece at model point `POINTS[i] = (x, y)`
is centred at `(x + 1.5, 6.5 - y)` with size `0.7 × 0.7`. The `6.5 - y` term
(`centreY()`) is the single place where the model's bottom-up row numbering
(rows `1`..`7` of rules.md) is flipped to the screen's top-down y axis. Only 24
of the 49 grid cells are points; the other 25 carry no element.

---

## 9. Cross-cutting concerns

### 9.1 Threading and responsiveness

```mermaid
sequenceDiagram
  participant UI as UI thread
  participant WK as Worker thread
  UI->>WK: actionbyai
  activate WK
  Note over WK: UCT search, up to 5 s,<br/>8000 iterations, blocks of 50
  Note over UI: stays responsive:<br/>resize, panel, subpages,<br/>scrolling in Rules/About
  WK-->>UI: redraw
  deactivate WK
  UI->>UI: placement, slide or soft-jump animation
```

The worker is created once in `bootstrap()` and lives for the whole session; it
is never terminated or restarted, so the model reference is stable and `restart`
is a message rather than a re-creation.

### 9.2 Input safety

* Only points that appear in the last received `board.actions` list get click
  handlers — empty points while placing, light-green source rings while
  moving or flying, red removal rings while a removal is pending — so illegal
  input is structurally impossible from the UI.
* `clickTarget()` and `clickRemove()` clear **all** handlers before posting, so
  a single action cannot be submitted twice.
* The view keeps its own `Map` of bound listeners, so `unbind()` and
  `clearHandlers()` can remove exactly the handlers that were added.
* The HMI sends an action object selected from the legal actions supplied by the
  worker in the previous `redraw`. The worker owns the state but currently
  trusts this payload rather than validating it against freshly generated legal
  actions.

### 9.3 Testing

| Layer | Tool | Location |
| --- | --- | --- |
| Rules, engine, controller, UI modules | Vitest (+ jsdom for the DOM modules) | [tests/unit](../tests/unit) |
| Whole application in a real browser | Playwright (Chromium) | [tests/e2e](../tests/e2e) |

`npm run coverage` enforces 96 % statement, branch, function and line coverage
over `html5/src/js/**`. `npm run test:e2e` serves `html5/src` with
[tools/serve.js](../tools/serve.js) and drives the real UI: menu, all three
subpages including the hidden/visible board, options, a placement that closes
a mill followed by a removal, protection of pieces in a mill, the transition to
the moving phase, flying with three pieces, both removal variants when every
opponent piece stands in a mill, a threefold-repetition draw, active-player
badge and spinner,
source-selection, removal and last-move highlights, and a new game.

Testability shaped the design: the model is pure, `uct.getActionInfo` takes
`random` and `now`, the board view takes `schedule`, and the navigation takes
`schedule` too, so unit tests do not have to wait for timers. The browser suite
uses real time where it verifies CSS transition interpolation.

### 9.4 Known gaps

| Item | Location | Effect |
| --- | --- | --- |
| `actionInfo.info` is not displayed | `hmi.update` | the nodes/sec figure is computed but never shown |
| `'response'` message class unused | both sides | reserved extension point |
| `Random` engine not wired to a request | `controller.js` | the alternative provider exists but is not selectable |
| Repetition bookkeeping cost | `applyAction` | finding the occurrence count walks `history` back to the last occurrence or removal; long moving phases in random playouts pay for it |
| No difficulty setting | `controller.js` | budget hard-coded to `(8000, 5000)` for both sides |
| Human action payload not revalidated | `controller.perform` | direct callers of the worker protocol are trusted to send an action from the previous `redraw` |

---

## 10. Traceability: rules ↔ architecture ↔ UI

```mermaid
flowchart LR
  R1["rules.md<br/>Phase 1: placing"] --> C1["getPlacements() + inHand"]
  R2["rules.md<br/>Mill: must remove one piece"] --> C2["formsMill() + pendingRemoval<br/>+ getRemovals()"]
  R3["rules.md<br/>Mill pieces protected,<br/>optional skip"] --> C2
  R4["rules.md<br/>Phase 2: slide to adjacent point"] --> C3["getMoves() + ADJACENCY"]
  R5["rules.md<br/>Phase 3: flying, optional"] --> C4["getFlights() + rules.flying"]
  R6["rules.md<br/>Lose: fewer than 3 pieces<br/>or no legal moves"] --> C5["getActions().length === 0 + getResult()"]
  R7["rules.md<br/>Draw: threefold repetition"] --> C6["history + isDraw()"]

  C1 --> V1["Only legal targets and sources clickable<br/>(prepareHumanMove)"]
  C2 --> V3["Red rings on removable pieces<br/>(clickRemove)"]
  C2 --> O2["Options page:<br/>removal when all pieces are in mills"]
  C3 --> V1
  C4 --> V1
  C4 --> O1["Options page:<br/>'Flying with three pieces is…'"]
  C5 --> V2["Celebration shows winner and reason<br/>board becomes inert"]
  C6 --> V2
  R1 --> D1["Rules page (#rules-page)<br/>same text, full screen"]
  R2 --> D1
  R4 --> D1
  R5 --> D1
  R6 --> D1
  R7 --> D1
```

The Rules subpage duplicates the rule text of [doc/rules.md](rules.md) as inline
HTML so that the application stays fully self-contained and usable offline.
