# Molino – Reglas del juego

**Molino** (también llamado Nine Men's Morris, Mill, Merels, Mulino, Moulin o Mühle) es un
clásico juego de estrategia para dos jugadores.

## 🎯 Objetivo

Reducir al adversario a **menos de 3 fichas** o dejarlo **sin movimientos legales**.

## 🧩 Componentes

- Un tablero con **24 puntos de intersección** dispuestos en tres cuadrados concéntricos unidos
  por líneas.
- **9 fichas por jugador** (normalmente blancas y negras).

### Notación algebraica para el Molino

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

Como en el ajedrez, cada punto del tablero se identifica con una **letra de columna** + un
**número de fila**.

- **Columnas**: de la a a la g (de izquierda a derecha)
- **Filas**: del 1 al 7 (de abajo arriba)

No todas las combinaciones de columna y fila existen: solo los **24 puntos** donde se cruzan
las líneas.

### Cómo se anotan las jugadas

| Acción | Notación | Ejemplo | Significado |
| ------ | -------- | ------- | ----------- |
| **Colocar** | `X` | `d7` | Colocar una ficha en d7 |
| **Mover** | `X-Y` | `d7-g7` | Deslizar una ficha de d7 a g7 |
| **Volar** | `X-Y` | `d7-f2` | Hacer «volar» (saltar) una ficha de d7 a f2 |
| **Capturar** | `xZ` | `d7-g7xb2` | Mover d7→g7 y después retirar la ficha contraria en b2 |

### Ejemplo de molino

Los tres puntos **a7, d7, g7** forman un **molino** (fila superior del cuadrado exterior). Si
colocas o mueves tu tercera ficha para completar esa línea, se añade `x` + la posición de la
ficha capturada.

> `a7-d7xf6` → Deslizar una ficha de a7 a d7, formar un molino y capturar la ficha contraria
> en f6.

La notación es compacta, inequívoca y se corresponde directamente con el diagrama del tablero
de arriba.

## 📋 Fases del juego

### **Fase 1 – Colocación de fichas**

- Empiezan las **blancas**; después los jugadores colocan por turnos una ficha en cualquier
  punto libre.
- Cada vez que formas un **molino** (3 fichas propias en fila a lo largo de una línea),
  **debes retirar una ficha del adversario** del tablero.
  - Cerrar dos molinos a la vez con una sola ficha solo permite retirar **una** ficha.
  - **No** puedes retirar una ficha que forme parte de un molino, *salvo que no haya ninguna
    otra disponible*.
  - *Regla opcional* (acordarla antes de jugar): si todas las fichas del adversario forman
    parte de molinos, no se retira ninguna ficha y el turno pasa sin más al adversario.

### **Fase 2 – Movimiento de fichas**

- Una vez colocadas las 18 fichas, los jugadores **deslizan** por turnos una ficha a un
  **punto libre adyacente** a lo largo de una línea.
- Formar un molino sigue obligando a retirar una ficha del adversario (mismas reglas de
  retirada que arriba).
- Un molino puede **abrirse y volver a cerrarse** para capturar fichas repetidamente.

### **Fase 3 – Vuelo (cuando un jugador solo tiene 3 fichas)**

- Un jugador reducido a **exactamente 3 fichas** puede **hacer saltar** sus fichas a
  *cualquier* punto libre del tablero (no solo a los adyacentes).
- Esta regla es opcional en algunos reglamentos: acordadla antes de jugar.

### ❌ Condiciones de derrota

Un jugador **pierde** si

1. queda reducido a **menos de 3 fichas**, O
2. no le quedan **movimientos legales**.

### 🤝 Tablas

La partida termina inmediatamente en **tablas** cuando la misma posición se produce por
**tercera vez**: las mismas fichas en los mismos puntos y el mismo jugador con el turno. Las
repeticiones solo se cuentan una vez colocadas todas las fichas. No es necesario que sean
consecutivas.
