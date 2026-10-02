# Moulin – Règles du jeu

**Moulin** (également appelé Mill, Merels, Mulino ou Mühle) est un jeu de stratégie classique
pour deux joueurs.

## 🎯 Objectif

Réduire votre adversaire à **moins de 3 pions**, ou le laisser **sans coup légal**.

## 🧩 Composants

- Un plateau avec **24 points d’intersection** disposés en trois carrés concentriques reliés par
  des lignes.
- **9 pions par joueur** (généralement noirs et blancs).

### Notation algébrique pour le moulin

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

Comme aux échecs, chaque point du plateau est identifié par une **lettre de colonne** + un
**numéro de ligne**.

- **Colonnes** : de a à g (de gauche à droite)
- **Lignes** : de 1 à 7 (du bas vers le haut)

Toutes les combinaisons colonne–ligne n’existent pas — seulement les **24 points** où les lignes
se rejoignent.

### Comment les coups sont notés

| Action | Notation | Exemple | Signification |
| ------ | -------- | ------- | ------------- |
| **Placer** | `X` | `d7` | Placer un pion sur d7 |
| **Déplacer** | `X-Y` | `d7-g7` | Déplacer un pion de d7 à g7 |
| **Voler (sauter)** | `X-Y` | `d7-f2` | Faire « voler » (sauter) un pion de d7 à f2 |
| **Capturer** | `xZ` | `d7-g7xb2` | Déplacer d7→g7, puis retirer le pion adverse en b2 |

### Exemple de moulin

Les trois points **a7, d7, g7** forment un **moulin** (rangée supérieure du carré extérieur). Si
vous placez ou déplacez votre troisième pion pour compléter cette ligne, ajoutez `x` + la
position du pion capturé.

> `a7-d7xf6` → Déplacer un pion de a7 à d7, former un moulin et capturer le pion adverse en f6.

La notation est compacte, non ambiguë et correspond directement au diagramme du plateau ci-dessus.

## 📋 Phases de jeu

### **Phase 1 – Placement des pions**

- Les **Blancs** commencent ; ensuite les joueurs placent à tour de rôle un pion par tour sur
  n’importe quel point libre.
- Chaque fois que vous formez un **moulin** (3 de vos pions alignés le long d’une ligne), vous
  **devez retirer un pion adverse** du plateau.
  - Former deux moulins à la fois avec un seul pion ne permet de retirer qu’**un seul** pion.
  - Vous ne pouvez **pas** retirer un pion faisant partie d’un moulin, *sauf s’il n’y a aucun
    autre pion disponible*.
  - *Règle optionnelle* (à convenir avant la partie) : si tous les pions adverses font partie de
    moulins, aucun pion n’est retiré et le tour passe simplement à l’adversaire.

### **Phase 2 – Déplacement des pions**

- Une fois les 18 pions placés, les joueurs déplacent à tour de rôle **un pion à la fois** vers
  un **point libre adjacent** le long d’une ligne.
- Former un moulin oblige toujours à retirer un pion adverse (mêmes règles que ci-dessus).
- Un moulin peut être **ouvert puis refermé** pour capturer des pions de manière répétée.

### **Phase 3 – Vol (lorsqu’un joueur n’a plus que 3 pions)**

- Un joueur réduit à **exactement 3 pions** peut **faire « voler » (sauter)** ses pions vers
  *n’importe quel* point libre du plateau (pas seulement vers un point adjacent).
- Cette règle est optionnelle dans certains règlements — à confirmer avant de jouer.

### ❌ Conditions de défaite

Un joueur **perd** s’il

1. est réduit à **moins de 3 pions**, OU
2. n’a **plus de coups légaux**.

### 🤝 Partie nulle

La partie est immédiatement **nulle** lorsque la même position apparaît pour la **troisième
fois** : mêmes pions sur les mêmes points et même joueur au trait. Les répétitions ne sont
comptées qu’une fois tous les pions placés. Elles n’ont pas besoin d’être consécutives.
