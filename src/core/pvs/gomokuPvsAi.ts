import { Board, Position, Turn } from "../../type"
import { positionToString } from "../../utils"
import { getBoardManager } from "./boardManager"
import { pvs } from "./principalVariationSearch"

const firstLimit = 9
const subsequentLimit = 2
const depth = 11

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
  let bestScore = Infinity
  let bestPotential = 0

  let manager = getBoardManager(board, turn, firstLimit)

  for (let k = 0; manager.next() === "continue" && k < firstLimit; k++) {
    let score = pvs(
      board,
      depth,
      -Infinity,
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
    if (score === bestScore && move.potential === bestPotential) {
      bestMoveArray.push(move)
    } else if (
      score < bestScore ||
      (score === bestScore && move.potential > bestPotential)
    ) {
      bestScore = score
      bestPotential = move.potential
      bestMoveArray.splice(0, bestMoveArray.length, move)
    }
  }
  manager.reset()

  console.log("bestMoveArray", bestMoveArray.map(positionToString))

  return bestMoveArray
}
