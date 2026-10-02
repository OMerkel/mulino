# Mulino – Regole del gioco

**Mulino** (noto anche come Mill, Merels, Moulin o Mühle) è un classico gioco di strategia per
due giocatori.

## 🎯 Obiettivo

Porta l’avversario a **meno di 3 pezzi** oppure lascialo con **nessuna mossa legale**.

## 🧩 Componenti

- Un tabellone con **24 punti di intersezione** disposti in tre quadrati concentrici collegati da
  linee.
- **9 pezzi per giocatore** (di solito nero e bianco).

### Notazione algebrica per il Mulino

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

Come negli scacchi, ogni punto del tabellone è identificato da una **lettera di colonna** + un
**numero di riga**.

- **Colonne**: dalla a alla g (da sinistra a destra)
- **Righe**: da 1 a 7 (dal basso verso l’alto)

Non tutti gli incroci tra colonne e righe esistono: solo i **24 punti** in cui le linee si
incontrano.

### Come si scrivono le mosse

| Azione | Notazione | Esempio | Significato |
| ------ | --------- | ------- | ----------- |
| **Piazzare** | `X` | `d7` | Piazza un pezzo su d7 |
| **Muovere** | `X-Y` | `d7-g7` | Sposta un pezzo da d7 a g7 |
| **Volo** | `X-Y` | `d7-f2` | Fai “volare” (saltare) un pezzo da d7 a f2 |
| **Cattura** | `xZ` | `d7-g7xb2` | Muovi d7→g7, poi rimuovi il pezzo avversario su b2 |

### Esempio di mulino

I tre punti **a7, d7, g7** formano un **mulino** (riga superiore del quadrato esterno). Se piazzi
o muovi il terzo pezzo per completare quella linea, si aggiunge `x` + la posizione del pezzo
catturato.

> `a7-d7xf6` → Sposta un pezzo da a7 a d7, forma un mulino e cattura il pezzo avversario su f6.

La notazione è compatta, non ambigua e corrisponde direttamente al diagramma del tabellone qui
sopra.

## 📋 Fasi di gioco

### **Fase 1 – Piazzamento dei pezzi**

- Inizia il **Bianco**; poi i giocatori piazzano a turno un pezzo su un qualsiasi punto libero.
- Ogni volta che si forma un **mulino** (3 pezzi propri in fila lungo una linea), si **deve
  rimuovere un pezzo avversario** dal tabellone.
  - Chiudendo due mulini contemporaneamente con un solo pezzo si rimuove comunque **un solo** pezzo.
  - Non è consentito rimuovere un pezzo che fa parte di un mulino, *a meno che non ci siano altri
    pezzi disponibili*.
  - *Regola opzionale* (da concordare prima di giocare): se tutti i pezzi avversari fanno parte di
    mulini, non si rimuove alcun pezzo e il turno passa all’avversario.

### **Fase 2 – Spostamento dei pezzi**

- Una volta piazzati tutti i 18 pezzi, i giocatori spostano a turno **un pezzo alla volta** su un
  **punto libero adiacente** lungo una linea.
- Formare un mulino obbliga ancora a rimuovere un pezzo avversario (stesse regole di cui sopra).
- Un mulino può essere **aperto e riformato** per catturare pezzi ripetutamente.

### **Fase 3 – Volo (quando un giocatore ha solo 3 pezzi)**

- Un giocatore ridotto a **esattamente 3 pezzi** può **far saltare** i propri pezzi su
  *qualsiasi* punto libero del tabellone (non solo su quelli adiacenti).
- Questa regola è opzionale in alcuni regolamenti — da concordare prima di giocare.

### ❌ Condizioni di sconfitta

Un giocatore **perde** se

1. è ridotto a **meno di 3 pezzi**, OPPURE
2. non ha **più mosse legali**.

### 🤝 Patta

La partita termina immediatamente in **patta** quando la stessa posizione si presenta per la
**terza volta**: stessi pezzi sugli stessi punti e stesso giocatore di turno. Le ripetizioni si
contano solo dopo che tutti i pezzi sono stati piazzati. Non devono essere consecutive.
