import { Board, Move, PotentialGrid, Turn } from "../../type"
import { compareNumberProperty, positionToString } from "../../utils"
import { processBoard } from "../gomokuAiOne"

export function getMoveArray(board: Board, turn: Turn, limit: number) {
  let gameOverRef = { current: false }
  let potentialGrid: PotentialGrid = board.map((row) =>
    row.map(() => Array.from({ length: 9 }, () => 0)),
  )

  processBoard(gameOverRef, potentialGrid, board, turn)

  if (gameOverRef.current) {
    return null
  }

  let positionArray: Move[] = Array.from({ length: 19 ** 2 }, (_, k) => {
    let x = k % 19
    let y = Math.floor(k / 19)
    let potential = potentialGrid[y][x].reduce((res, v) => res * 100 + v, 0)
    return { x, y, potential }
  }).filter((position) => board[position.y][position.x] === 0)

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
  let potentialGrid: PotentialGrid = board.map((row) =>
    row.map(() => Array.from({ length: 9 }, () => 0)),
  )

  processBoard(gameOverRef, potentialGrid, board, turn)

  if (gameOverRef.current) {
    return -Number.MAX_VALUE
  }

  let evaluation = 0

  for (let y = 0, c = potentialGrid.length; y < c; y++) {
    for (let x = 0, d = potentialGrid[y].length; x < d; x++) {
      if (board[y][x] !== 0) {
        continue
      }
      if (potentialGrid[y][x][0] > 0) {
        return Number.MAX_VALUE
      }
      evaluation += potentialGrid[y][x].reduce(
        (res, val) => -res * 361 + val,
        0,
      )
    }
  }

  return evaluation
}
