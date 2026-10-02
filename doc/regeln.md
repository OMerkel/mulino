# Mühle – Spielregeln

**Mühle** (auch bekannt als Mill, Merels, Mulino oder Moulin) ist ein klassisches
Strategiespiel für zwei Spieler.

## 🎯 Ziel des Spiels

Den Gegner auf **weniger als 3 Steine** reduzieren oder ihn in eine Lage bringen, in der er
**keinen gültigen Zug** mehr ausführen kann.

## 🧩 Spielmaterial

- Ein Spielbrett mit **24 Schnittpunkten**, angeordnet in drei konzentrischen Quadraten, die
  durch Linien verbunden sind.
- **9 Spielsteine pro Spieler** (üblicherweise schwarz und weiß).

### Algebraische Notation für Mühle

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

Wie beim Schach wird jeder Punkt auf dem Spielbrett durch einen **Spaltenbuchstaben** + eine
**Zeilennummer** bezeichnet.

- **Spalten**: a bis g (von links nach rechts)
- **Zeilen**: 1 bis 7 (von unten nach oben)

Nicht jede Kombination aus Spalte und Zeile existiert – es gibt nur die **24 Punkte**, an denen
sich die Linien kreuzen.

### Zugnotation

| Aktion | Notation | Beispiel | Bedeutung |
| ------ | -------- | -------- | --------- |
| **Setzen** | `X` | `d7` | Einen Stein auf d7 setzen |
| **Ziehen** | `X-Y` | `d7-g7` | Stein von d7 nach g7 schieben |
| **Springen** | `X-Y` | `d7-f2` | Stein von d7 nach f2 springen |
| **Schlagen** | `xZ` | `d7-g7xb2` | Zug d7→g7, dann gegnerischen Stein auf b2 entfernen |

### Beispiel einer Mühle

Die drei Punkte **a7, d7, g7** bilden eine **Mühle** (obere Reihe des äußeren Quadrats). Wird
der dritte Stein gesetzt oder gezogen, um diese Linie zu vervollständigen, wird `x` + die
Position des geschlagenen Steins angehängt.

> `a7-d7xf6` → Stein von a7 nach d7 schieben, eine Mühle bilden und den gegnerischen Stein auf f6
> schlagen.

Die Notation ist kompakt, eindeutig und lässt sich direkt auf das oben dargestellte
Spielbrettdiagramm übertragen.

## 📋 Spielphasen

### **Phase 1 – Steine setzen**

- **Weiß** beginnt; danach setzen die Spieler abwechselnd je einen Stein auf einen beliebigen
  freien Punkt.
- Jedes Mal, wenn eine **Mühle** gebildet wird (3 eigene Steine in einer Reihe entlang einer
  Linie), **muss** ein **gegnerischer Stein vom Brett entfernt** werden.
  - Werden mit einem einzigen Stein zwei Mühlen gleichzeitig geschlossen, wird trotzdem nur
    **ein** Stein entfernt.
  - Ein Stein, der Teil einer Mühle ist, darf **nicht** entfernt werden, *es sei denn, es sind
    keine anderen Steine verfügbar*.
  - *Optionale Regel* (vor Spielbeginn vereinbaren): Stehen alle gegnerischen Steine in Mühlen,
    wird kein Stein entfernt und der Gegner ist am Zug.

### **Phase 2 – Steine ziehen**

- Sobald alle 18 Steine gesetzt sind, ziehen die Spieler abwechselnd je einen Stein auf einen
  **benachbarten freien Punkt** entlang einer Linie.
- Das Bilden einer Mühle verpflichtet weiterhin zum Entfernen eines gegnerischen Steins (gleiche
  Regeln wie oben).
- Eine Mühle kann **geöffnet und erneut geschlossen** werden, um wiederholt gegnerische Steine
  zu schlagen.

### **Phase 3 – Springen (wenn ein Spieler nur noch 3 Steine hat)**

- Ein Spieler, der auf **genau 3 Steine** reduziert wurde, darf seine Steine auf *jeden* freien
  Punkt des Spielbretts **springen** lassen (nicht nur auf benachbarte).
- Diese Regel ist in manchen Regelwerken optional – vor Spielbeginn klären.

### ❌ Verlustbedingungen

Ein Spieler **verliert**, wenn er

1. auf **weniger als 3 Steine** reduziert wurde, ODER
2. **keinen gültigen Zug** mehr ausführen kann.

### 🤝 Unentschieden

Die Partie endet sofort **unentschieden**, wenn dieselbe Stellung zum **dritten Mal** entsteht:
dieselben Steine auf denselben Punkten und derselbe Spieler am Zug. Wiederholungen werden erst
gezählt, wenn alle Steine gesetzt sind. Die Wiederholungen müssen nicht unmittelbar aufeinander
folgen.
