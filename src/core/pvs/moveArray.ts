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
