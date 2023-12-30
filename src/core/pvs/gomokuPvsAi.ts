import { Board, Position, Turn } from "../../type"
import { positionToString } from "../../utils"
import { getBoardManager } from "./boardManager"
import { pvs } from "./principalVariationSearch"

const FIRST_LIMIT = 9
const SUBSEQUENT_LIMIT = 6
const MINIMUM_SUBSEQUENT_LIMIT = 1
const DEPTH_DAMPENING_FACTOR = 0.5
const DEPTH = 361
function dynamicLimit(remainingDepth: number) {
  const depth = DEPTH - remainingDepth
  return Math.max(MINIMUM_SUBSEQUENT_LIMIT, SUBSEQUENT_LIMIT - depth)
}

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
  playHistory: Position[],
): Position[] | "gameover" {
  // Hard-coded solutions, for the first move
  // ...when playing first
  if (playHistory.length === 0) {
    return Array.from({ length: 25 }, (_, k) => ({
      x: 7 + (k % 5),
      y: 7 + Math.floor(k / 5),
    }))
  }
  // ...when playing second
  // if (playHistory.length === 1) {
  //   let move = playHistory[0]
  //   let result = Array.from({ length: 9 }, (_, k) => ({
  //     x: move.x + (k % 3) - 1,
  //     y: move.y + Math.floor(k / 3) - 1,
  //   }))
  //   result.splice(4, 1)
  //   return result.filter(({ x, y }) => x >= 0 && x < 19 && y >= 0 && y < 19)
  // }
  // End of hard-coded solutions
  let moveArray: string[] = []

  let bestMoveArray: Position[] = []
  let bestScore = -Infinity
  let bestPotential = 0

  let manager = getBoardManager(board, turn, FIRST_LIMIT)

  for (let k = 0; manager.next() === "continue" && k < FIRST_LIMIT; k++) {
    let score = -pvs(
      board,
      DEPTH,
      bestScore,
      Infinity,
      (3 - turn) as Turn,
      DEPTH_DAMPENING_FACTOR,
      dynamicLimit,
    )

    let move = manager.getMove()
    console.log(
      "move, potential, score",
      move && positionToString(move),
      move.potential,
      score,
    )
    moveArray.push(positionToString(move))
    if (score === bestScore && move.potential === bestPotential) {
      bestMoveArray.push(move)
    } else if (
      score > bestScore ||
      (score === bestScore && move.potential > bestPotential)
    ) {
      bestScore = score
      bestPotential = move.potential
      bestMoveArray.splice(0, bestMoveArray.length, move)
    } else if (bestScore === Infinity && move.potential < bestPotential) {
      break
    }
  }
  manager.reset()

  if (bestMoveArray.length !== 1) {
    console.log(
      "--- bestMoveArray",
      bestMoveArray.map(positionToString),
      bestScore,
    )
  } else if (positionToString(bestMoveArray[0]) !== moveArray[0]) {
    console.log("--- bestMove", positionToString(bestMoveArray[0]), bestScore)
  } else {
    console.log(`---`, moveArray[0], bestScore)
  }

  return bestMoveArray
}
