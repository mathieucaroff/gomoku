import { Board, Position, PotentialGrid, Turn } from "../type"

function processLineOfFive(
  gameOverRef: { current: boolean },
  turn: Turn,
  board: Board,
  potentialGrid: PotentialGrid,
  x: number,
  y: number,
  dx: number,
  dy: number,
) {
  // determine the priority, between 0 and 9
  let color = 0 // The color of the current line, if any
  let counter = 0 // The number of stones in the current li
  for (let k = 0; k < 5; k++) {
    let c = board[y + dy * k][x + dx * k]
    if (c > 0) {
      if (color > 0) {
        if (c !== color) {
          return
        }
        counter += 1
      } else {
        color = c
        counter += 1
      }
    }
  }
  if (counter === 5) {
    gameOverRef.current = true
    return
  }

  let priority = counter > 0 ? 2 * counter + +(color === turn) : 1

  // increase the potential of each of the five positions
  for (let k = 0; k < 5; k++) {
    // (9 - priority) is used to store the best priority first
    // and worst priority last
    potentialGrid[y + dy * k][x + dx * k][9 - priority] += 1
  }
}

/**
 *
 * @param board the state of the board to evaluate
 * @param gameOverRef a reference to indicate that a line of five has been
 *          found in the game
 * @param turn whose player it is the turn of
 * @returns the potential grid. It associates a potential to each position
 *          of the grid. A potential is an array of ten priorities. For each
 *          index of that array, the associated priority is the number of
 *          lines containing a certain number of token from a single player.
 *          Said number of token is in relation with the index that the priority
 *          occupies in the array.
 */
export function processBoard(
  gameOverRef: { current: boolean },
  potentialGrid: PotentialGrid,
  board: Board,
  turn: Turn,
) {
  // go through horizontals
  for (let y = 0, c = board.length; y < c; y++) {
    for (let x = 0, d = board[y].length - 4; x < d; x++) {
      processLineOfFive(gameOverRef, turn, board, potentialGrid, x, y, 1, 0)
    }
  }
  // go through verticals
  for (let y = 0, c = board.length - 4; y < c; y++) {
    for (let x = 0, d = board[y].length; x < d; x++) {
      processLineOfFive(gameOverRef, turn, board, potentialGrid, x, y, 0, 1)
    }
  }
  // go through diagonals down-right
  for (let y = 0, c = board.length - 4; y < c; y++) {
    for (let x = 0, d = board[y].length - 4; x < d; x++) {
      processLineOfFive(gameOverRef, turn, board, potentialGrid, x, y, 1, 1)
    }
  }
  // go through diagonals down-left
  for (let y = 0, c = board.length - 4; y < c; y++) {
    for (let x = 4, d = board[y].length; x < d; x++) {
      processLineOfFive(gameOverRef, turn, board, potentialGrid, x, y, -1, 1)
    }
  }
  return potentialGrid
}

export function aiOneProcessing(
  gameOverRef: { current: boolean },
  bestMoveArray: Position[],
  potentialGrid: PotentialGrid,
  board: Board,
  turn: Turn,
) {
  // compute the potential grid
  processBoard(gameOverRef, potentialGrid, board, turn)

  // extract the best position(s) and return one
  let bestPotential = "0".repeat(10)
  for (let y = 0, c = potentialGrid.length; y < c; y++) {
    for (let x = 0, d = potentialGrid[y].length; x < d; x++) {
      if (board[y][x] !== 0) {
        continue
      }
      let potential = potentialGrid[y][x].map((x) => x.toString(36)).join("")
      if (bestPotential <= potential) {
        if (bestPotential < potential) {
          bestPotential = potential
          bestMoveArray.splice(0, bestMoveArray.length)
        }
        bestMoveArray.push({ x, y })
      }
    }
  }
}

/**
 * @param turn whose player it is the turn of
 * @param board the state of the game to evaluate
 * @returns the best move(s) that the player can play. It contains more than one
 *          result only when some moves are equally good for the player
 *          according to the heuristic.
 */
export function gomokuAiOneRecommendation(
  board: Board,
  turn: Turn,
  playHistory: Position[],
): Position[] | "gameover" {
  if (playHistory.length === 0) {
    return Array.from({ length: 25 }, (_, k) => ({
      x: 7 + (k % 5),
      y: 7 + Math.floor(k / 5),
    }))
  }

  let gameOverRef = { current: false }

  let bestMoveArray: Position[] = []

  // start from a grid of zeros
  let potentialGrid: PotentialGrid = board.map((row) =>
    row.map(() => Array.from({ length: 10 }, () => 0)),
  )

  aiOneProcessing(gameOverRef, bestMoveArray, potentialGrid, board, turn)

  if (gameOverRef.current) {
    return "gameover"
  }

  return bestMoveArray
}
