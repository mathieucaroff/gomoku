interface Position {
  x: number
  y: number
}

type Board = (0 | 1 | 2)[][]
type PotentialGrid = number[][][]

function evaluate(
  gameoverRef: { current: boolean },
  turn: 1 | 2,
  board: Board,
  potentialGrid: PotentialGrid,
  x: number,
  y: number,
  dx: number,
  dy: number,
) {
  // determine the priority, between 0 and 9
  let priority
  let color = 0
  let counter = 0
  for (let k = 0; k < 5; k++) {
    let c = board[y + dy * k][x + dx * k]
    if (c > 0) {
      if (color > 0) {
        if (c !== color) {
          priority = 0
          break
        } else {
          counter += 1
        }
      } else {
        color = c
        counter += 1
      }
    }
  }
  if (priority === undefined) {
    if (counter === 5) {
      gameoverRef.current = true
    } else if (counter > 0) {
      priority = 2 * counter + +(color === turn)
    } else {
      priority = 1
    }
  }

  // increase the priority of each of the five positions
  for (let k = 0; k < 5; k++) {
    // (9 - priority) is used to store the best priority first
    // and worst priority last
    potentialGrid[y + dy * k][x + dx * k][9 - priority] += 1
  }
}

export function play(
  turn: 1 | 2,
  board: Board,
): { potential: string; positionArray: Position[] } | "gameover" {
  let gameoverRef = { current: false }

  // compute the potential grid
  // start from a grid of zeros
  let potentialGrid: PotentialGrid = board.map((row) =>
    row.map(() => Array.from({ length: 10 }, () => 0)),
  )
  // go through horizontals
  for (let y = 0, c = board.length; y < c; y++) {
    for (let x = 0, d = board[y].length - 4; x < d; x++) {
      evaluate(gameoverRef, turn, board, potentialGrid, x, y, 1, 0)
    }
  }
  // go through verticals
  for (let y = 0, c = board.length - 4; y < c; y++) {
    for (let x = 0, d = board[y].length; x < d; x++) {
      evaluate(gameoverRef, turn, board, potentialGrid, x, y, 0, 1)
    }
  }
  // go through diagonals down-right
  for (let y = 0, c = board.length - 4; y < c; y++) {
    for (let x = 0, d = board[y].length - 4; x < d; x++) {
      evaluate(gameoverRef, turn, board, potentialGrid, x, y, 1, 1)
    }
  }
  // go through diagonals down-left
  for (let y = 0, c = board.length - 4; y < c; y++) {
    for (let x = 4, d = board[y].length; x < d; x++) {
      evaluate(gameoverRef, turn, board, potentialGrid, x, y, -1, 1)
    }
  }

  if (gameoverRef.current) {
    return "gameover"
  }

  // the last component of the potential should be considered negatively,
  // so complement it to 36, as 36 is its maximum value
  for (let y = 0, c = board.length; y < c; y++) {
    for (let x = 0, d = board[y].length; x < d; x++) {
      potentialGrid[y][x][9] = 36 - potentialGrid[y][x][9]
    }
  }

  // extract the best position(s) and return one
  let bestArray: { x: number; y: number }[] = []
  let bestPotential = "0".repeat(10)
  for (let y = 0, c = potentialGrid.length; y < c; y++) {
    for (let x = 0, d = potentialGrid[y].length; x < d; x++) {
      if (board[y][x] !== 0) {
        continue
      }
      let potential = potentialGrid[y][x].map((x) => x.toString(36)).join("")
      if (bestPotential <= potential) {
        if (bestPotential < potential) {
          bestArray = []
        }
        bestArray.push({ x, y })
        bestPotential = potential
      }
    }
  }
  if (bestArray.length > 0) {
    return { potential: bestPotential, positionArray: bestArray }
  }

  return "gameover"
}
