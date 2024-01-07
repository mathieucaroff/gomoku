import {
  Board,
  GomokuBasicEngine,
  GomokuConsturctor,
  Move,
  Turn,
} from "../../type"
import { compareNumberProperty } from "../../utils"

const comparePotential = compareNumberProperty("potential")

export function getMoveArray(
  board: Board,
  turn: Turn,
  limit: number,
  gomokuBasicEngineClass: GomokuConsturctor<GomokuBasicEngine>,
) {
  let gameOverRef = { current: false }
  let potentialGrid = new gomokuBasicEngineClass(board, turn).newPotentialGrid()

  new gomokuBasicEngineClass(
    board,
    turn,
    gameOverRef,
    [],
    potentialGrid,
  ).processBoard()

  if (gameOverRef.current) {
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
