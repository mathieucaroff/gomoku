import {
  Board,
  Position,
  PotentialGrid,
  ProcessBoardFunction,
  Turn,
} from "../../type"
import { positionToString, readableScore } from "../../utils"
import { aiOneProcessing, gomokuAiOne } from "../gomokuAiOne"
import { getBoardManager } from "./boardManager"
import { pvs } from "./principalVariationSearch"

const FIRST_LIMIT = 9
const SUBSEQUENT_LIMIT = 6
const MINIMUM_SUBSEQUENT_LIMIT = 1
const DEPTH_DAMPENING_FACTOR = 0.5
const DEPTH = 361
function dynamicLimit(subsequentLimit: number) {
  return (remainingDepth: number) => {
    const actualDepth = DEPTH - remainingDepth
    return Math.max(MINIMUM_SUBSEQUENT_LIMIT, subsequentLimit - actualDepth)
  }
}

/**
 * @param turn whose player it is the turn of
 * @param board the state of the game to evaluate
 * @returns the best move(s) that the player can play. It contains more than one
 *          result only when some moves are equally good for the player
 *          according to the heuristic.
 */
export function gomokuPvs(processBoardFunction: ProcessBoardFunction) {
  return (
    board: Board,
    turn: Turn,
    moveHistory: Position[],
  ): Position[] | "gameover" => {
    // Hard-coded solutions, for the first move
    // ...when playing first
    if (moveHistory.length === 0) {
      return gomokuAiOne(board, turn, moveHistory)
    }
    // ...when playing second
    if (moveHistory.length === 1) {
      let move = moveHistory[0]
      if (move.x > 0 && move.x < 18 && move.y > 0 && move.y < 18) {
        return [
          { x: move.x - 1, y: move.y },
          { x: move.x + 1, y: move.y },
          { x: move.x, y: move.y - 1 },
          { x: move.x, y: move.y + 1 },
        ]
      }
    }
    // End of hard-coded solutions
    // Detect friendly and enemy potential lines of five and react immediately to them
    let preBestMoveArray: Position[] = []
    let potentialGrid: PotentialGrid = board.map((row) =>
      row.map(() => Array.from({ length: 9 }, () => 0)),
    )
    let ref = { current: false }
    aiOneProcessing({
      gameOverRef: ref,
      bestMoveArray: preBestMoveArray,
      potentialGrid,
      board,
      turn,
    })
    if (!ref.current && preBestMoveArray.length > 0) {
      let move = preBestMoveArray[0]
      let potential = potentialGrid[move.y][move.x]
      if (potential[0] > 0 || potential[1] > 0) {
        return preBestMoveArray
      }
    }

    let moveArray: string[] = []

    let bestMoveArray: Position[] = []
    let bestScore = -Infinity
    let bestPotential = 0

    let manager = getBoardManager(
      board,
      turn,
      FIRST_LIMIT,
      processBoardFunction,
    )

    for (let k = 0; manager.next() === "continue" && k < FIRST_LIMIT; k++) {
      let score = -pvs(
        board,
        DEPTH,
        bestScore,
        Infinity,
        (3 - turn) as Turn,
        DEPTH_DAMPENING_FACTOR,
        dynamicLimit(SUBSEQUENT_LIMIT - 4 + Math.min(moveHistory.length, 4)),
        processBoardFunction,
      )

      let move = manager.getMove()
      if (new URLSearchParams(location.search).has("verbose")) {
        console.log(
          `[${"_●○"[turn]}]`,
          "move, potential, score",
          move && positionToString(move),
          move.potential,
          readableScore(score),
        )
      }
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

    let readableBestScore = readableScore(bestScore)
    if (bestMoveArray.length !== 1) {
      console.log(
        `[${"_●○"[turn]}] ---`,
        bestMoveArray.map(positionToString),
        readableBestScore,
      )
    } else if (positionToString(bestMoveArray[0]) !== moveArray[0]) {
      console.log(
        `[${"_●○"[turn]}] --- variation`,
        positionToString(bestMoveArray[0]),
        readableBestScore,
      )
    } else {
      console.log(`[${"_●○"[turn]}] ---`, moveArray[0], readableBestScore)
    }

    return bestMoveArray
  }
}
