# Gomoku AI

```ts
// A function which plays one piece
(turn: 1 | 2, board: (0 | 1 | 2)[][]) => [number, number]
```

The underlying principles of this AI are simple:

- Identify all the groups of five aligned positions in the board, be it a vertical, horizontal or diagonal alignment.
- For each color, figure out all the lines of five, four, three, two and one piece-s of that color which do not contain the other color
- Play at the place of greatest priority.

The priority of a position is a ten-uplet i.e. a series of ten numbers. The first is the number of lines of five that would be **completed** by playing there. The second is the number of lines of five that would be **prevented** by playing there. The third is the number of lines of four that would be completed. The fourth is the number of lines of four that would be prevented, and so on till the ninth. The last one is the number of lines that are already unusable and would not be affected by playing there.
