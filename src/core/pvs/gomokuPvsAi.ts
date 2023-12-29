import { Board, Position, Turn } from "../../type"
import { positionToString } from "../../utils"
import { getBoardManager } from "./boardManager"
import { pvs } from "./principalVariationSearch"

const firstLimit = 4
const subsequentLimit = 4
const depth = 5

/**
 * @param turn whose player it is the turn of
 * @param board the state of the game to evaluate
 * @returns the best move(s) that the player can play. It contains more than one
 *          result only when some moves are equally good for the player
 *          according to the heuristic.
 */
export function gomokuPvsAiRecommendation(
  board: Board,
  turn: Turn,
): Position[] | "gameover" {
  let bestMoveArray: Position[] = []
  let alpha = -Infinity

  let manager = getBoardManager(board, turn, firstLimit)
  let k = 0
  while (manager.next() === "continue" && k < firstLimit) {
    let score = pvs(
      board,
      depth,
      alpha,
      Infinity,
      (3 - turn) as Turn,
      subsequentLimit,
    )

    let move = manager.getMove()
    console.log(
      "move, potential, score",
      positionToString(move),
      move.potential,
      score,
    )
    if (score === alpha) {
      bestMoveArray.push(manager.getMove())
    } else if (score > alpha) {
      alpha = score
      bestMoveArray.splice(0, bestMoveArray.length, manager.getMove())
    }
    k += 1
  }
  manager.reset()

  console.log("bestMoveArray", bestMoveArray)

  return bestMoveArray
}
