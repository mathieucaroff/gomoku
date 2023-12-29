import { Board, Position, PotentialGrid, Turn } from "../../type"
import { compareNumberProperty } from "../../utils"
import { aiOneProcessing, processBoard } from "../gomokuAiOne"

export function getMoveArray(board: Board, turn: Turn, limit: number) {
  let gameOverRef = { current: false }
  let potentialGrid: PotentialGrid = board.map((row) =>
    row.map(() => Array.from({ length: 10 }, () => 0)),
  )

  processBoard(gameOverRef, potentialGrid, board, turn)

  if (gameOverRef.current) {
    return null
  }

  let positionArray: (Position & { potential: number })[] = Array.from(
    { length: 19 ** 2 },
    (_, k) => {
      let x = k % 19
      let y = Math.floor(k / 19)
      let potential = potentialGrid[y][x].reduce((res, v) => res * 100 + v, 0)
      return { x, y, potential }
    },
  ).filter((position) => board[position.y][position.x] === 0)

  positionArray.sort(compareNumberProperty("potential"))

  return positionArray.slice(-limit)
}

/**
 * Evaluate how good the given game position is for the player whose
 * turn it is.
 *
 * This evaluation does NOT perform any exploration of the DAG of moves.
 * It interrogates gomokuAiOne and return a floating point value.
 */
export function getGameEvaluation(board: Board, turn: Turn) {
  let gameOverRef = { current: false }
  let bestMoveArray: Position[] = []
  let potentialGrid: PotentialGrid = board.map((row) =>
    row.map(() => Array.from({ length: 10 }, () => 0)),
  )

  aiOneProcessing(gameOverRef, bestMoveArray, potentialGrid, board, turn)

  const hasOpenLineOfFour = () => {
    let move = bestMoveArray[0]
    if (potentialGrid[move.y][move.x][0] > 0) {
      // ^ TODO: check that the index [0] is the correct one to check
      return true
    }
    return false
  }

  if (gameOverRef.current) {
    return Number.NEGATIVE_INFINITY
  } else if (hasOpenLineOfFour()) {
    return Number.POSITIVE_INFINITY
  }

  let bestFivePosition: (Position & { potential: number })[] = Array.from(
    { length: 8 },
    () => ({ x: -1, y: -1, potential: 0 }),
  )
  for (let y = 0, c = potentialGrid.length; y < c; y++) {
    for (let x = 0, d = potentialGrid[y].length; x < d; x++) {
      if (board[y][x] !== 0) {
        continue
      }
      let potential = potentialGrid[y][x].reduce(
        (result, value) => result * 36 + value,
        0,
      )
      if (bestFivePosition[0].potential < potential) {
        bestFivePosition[0] = { x, y, potential }
        bestFivePosition.sort(compareNumberProperty("potential"))
      }
    }
  }

  let evaluation = bestFivePosition.reduce(
    (result, entry) => result + entry.potential,
    0,
  )

  return evaluation
}
