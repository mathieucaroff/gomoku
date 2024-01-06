import {
  AiProcessingParameter,
  Board,
  Position,
  PotentialGrid,
  ProcessBoardParameter,
  Turn,
} from "../type"

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
  // A. compute the priority of the line
  let color = 0 // The color of the current line, if any
  let counter = 0 // The number of stones in the current line
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

  // The priority is a number between 0 and 6 inclusive. The higher the
  // priority, the more important it is to play in the corresponding
  // location.
  let priority: number = 0
  if (counter < 3) {
    priority = counter
  } else {
    // if counter is 3, we want the priority to be 3 or 4
    // if counter is 4, we want the priority to be 5 or 6
    priority = 2 * counter - 3 + +(color === turn)
  }

  // B. increase the potential of each position of the line
  // (each line contains 5 positions)
  for (let k = 0; k < 5; k++) {
    // (6 - priority) is used to store the best priority first
    // and worst priority last
    potentialGrid[y + dy * k][x + dx * k][7 - priority] += 1
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
export function processBoardTwo(param: ProcessBoardParameter) {
  let { board, gameOverRef, potentialGrid, turn } = param

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

export function aiTwoProcessing(param: AiProcessingParameter) {
  let { bestMoveArray, potentialGrid, board } = param
  // compute the potential grid
  processBoardTwo(param)

  // extract the best position(s) and return one
  let bestPotential = "0".repeat(6)
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

export function gomokuAiTwo(
  board: Board,
  turn: Turn,
  moveHistory: Position[],
): Position[] | "gameover" {
  if (moveHistory.length === 0) {
    return Array.from({ length: 25 }, (_, k) => ({
      x: 7 + (k % 5),
      y: 7 + Math.floor(k / 5),
    }))
  }

  let gameOverRef = { current: false }

  let bestMoveArray: Position[] = []

  // start from a grid of zeros
  let potentialGrid: PotentialGrid = board.map((row) =>
    row.map(() => Array.from({ length: 8 }, () => 0)),
  )

  aiTwoProcessing({ gameOverRef, bestMoveArray, potentialGrid, board, turn })

  if (gameOverRef.current) {
    return "gameover"
  }

  return bestMoveArray
}
