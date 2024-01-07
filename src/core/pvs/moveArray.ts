import { Board, GomokuBasicEngine, Move, Turn } from "../../type"
import { compareNumberProperty } from "../../utils"

const comparePotential = compareNumberProperty("potential")

export function getMoveArray(
  board: Board,
  turn: Turn,
  limit: number,
  gomokuBasicEngine: GomokuBasicEngine,
) {
  let { potentialGrid, gameoverRef } = gomokuBasicEngine
    .init({
      board,
      turn,
    })
    .processBoard()
    .get()

  if (gameoverRef.current) {
    return null
  }

  let positionArray: Move[] = []

  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 19; x++) {
      if (board[y][x] > 0) {
        continue
      }

      let potential = potentialGrid[y][x].reduce((res, v) => res * 100 + v, 0)
      positionArray.push({ x, y, potential })
    }
  }

  positionArray.sort(comparePotential)

  return positionArray.slice(-limit)
}
