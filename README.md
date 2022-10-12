# [Gomoku AI](https://gomokuai.vercel.app/)

Play gomoku against an AI [by clicking this link](https://gomokuai.vercel.app/).

## Alternative configurations

- [You play first](https://gomokuai.vercel.app/)
- [The AI plays first](https://gomokuai.vercel.app/?versus=aiHuman)
- [Two AIs play against one another](https://gomokuai.vercel.app/?versus=aiAi)
- [Two AIs play against one another but fast](https://gomokuai.vercel.app/?versus=aiAi&timeout=0)
- [You play first and the AI is too defensive](https://gomokuai.vercel.app/?defensive)

## Principle

The underlying principles of this AI are simple:

- Identify all the groups of five aligned positions in the board, be it a vertical, horizontal or diagonal alignment.
- For each color, figure out all the lines of five, four, three, two and one piece-s of that color which do not contain the other color
- Play at the place of greatest priority.

The priority of a position is a ten-uplet i.e. a series of ten numbers. The first is the number of lines of five that would be **completed** by playing there. The second is the number of lines of five that would be **prevented** by playing there. The third is the number of lines of four that would be completed. The fourth is the number of lines of four that would be prevented, and so on till the ninth. The last one is the number of lines that are already unusable and would not be affected by playing there.
