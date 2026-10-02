# Nine Men's Morris – Game Rules

**Nine Men's Morris** (also called Mill, Merels, Mulino, Moulin or Mühle) is a classic
two-player strategy board game.

## 🎯 Objective

Reduce your opponent to **fewer than 3 pieces**, or leave them with **no legal moves**.

## 🧩 Components

- A board with **24 intersecting points** arranged in three concentric squares connected by lines.
- **9 pieces per player** (usually black and white).

### Algebraic Notation for Nine Men's Morris

```text
7 +--------+--------+
  |        |        |
6 |  +-----+-----+  |
  |  |     |     |  |
5 |  |  +--+--+  |  |
  |  |  |     |  |  |
4 +--+--+     +--+--+
  |  |  |     |  |  |
3 |  |  +--+--+  |  |
  |  |     |     |  |
2 |  +-----+-----+  |
  |        |        |
1 +--------+--------+
  a  b  c  d  e  f  g
```

Just like in chess, each point on the board is identified by a **column letter** + **row number**.

- **Columns**: a through g (left to right)
- **Rows**: 1 through 7 (bottom to top)

Not every intersection of column and row exists — only the **24 points** where lines meet.

### How Moves Are Written

| Action | Notation | Example | Meaning |
| ------ | -------- | ------- | ------- |
| **Place** | `X` | `d7` | Place a piece on d7 |
| **Move** | `X-Y` | `d7-g7` | Slide piece from d7 to g7 |
| **Fly** | `X-Y` | `d7-f2` | Fly (jump) piece from d7 to f2 |
| **Capture** | `xZ` | `d7-g7xb2` | Move d7→g7, then remove opponent's piece on b2 |

### Example Mill

The three points **a7, d7, g7** form a **mill** (top row of the outer square). If you place or
move your third piece to complete that line, you append `x` + the captured piece's position.

> `a7-d7xf6` → Slide piece from a7 to d7, forming a mill, and capture the opponent's piece on f6.

The notation is compact, unambiguous, and maps directly to the board diagram you see above.

## 📋 Phases of Play

### **Phase 1 – Placing Pieces**

- **White** places first; then players alternate placing one piece per turn onto any empty point.
- Each time you form a **mill** (3 of your pieces in a row along a line), you **must remove one
  of your opponent's pieces** from the board.
  - Closing two mills at once with a single piece still removes only **one** piece.
  - You **cannot** remove a piece that is part of a mill *unless no other pieces are available*.
  - *Optional rule* (agree before playing): if all of your opponent's pieces are part of mills,
    no piece is removed and the turn simply passes to your opponent.

### **Phase 2 – Moving Pieces**

- Once all 18 pieces are placed, players alternate **sliding** one piece at a time to an
  **adjacent empty point** along a line.
- Forming a mill still requires you to remove an opponent's piece (same removal rules as above).
- A mill can be **broken and reformed** to repeatedly capture pieces.

### **Phase 3 – Flying (when a player has only 3 pieces)**

- A player reduced to **exactly 3 pieces** may **jump** their pieces to *any* empty point on
  the board (not just adjacent ones).
- This is optional in some rule sets — confirm before playing.

### ❌ Losing Conditions

A player **loses** if

1. reduced to **fewer than 3 pieces**, OR
2. **no legal moves** left.

### 🤝 Draw

The game ends immediately in a **draw** when the same position occurs for the **third time**:
the same pieces on the same points and the same player to move. Repetitions are only counted
once all pieces have been placed. The repetitions do not need to be consecutive.
