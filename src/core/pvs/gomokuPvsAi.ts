import { isEqual } from "lodash"
import {
  Board,
  GomokuBasicEngine,
  GomokuConsturctor,
  GomokuEngine,
  Move,
  Position,
  Turn,
} from "../../type"
import { positionToString, readableScore } from "../../utils"
import { getBoardManager } from "./boardManager"
import { pvs } from "./principalVariationSearch"

const FIRST_LEVEL_LIMIT = 9
const SUBSEQUENT_LIMIT = 6
const MINIMUM_SUBSEQUENT_LIMIT = 1
const DEPTH_DAMPENING_FACTOR = 0.5
function dynamicLimit(subsequentLimit: number) {
  return (depth: number) => {
    return Math.max(MINIMUM_SUBSEQUENT_LIMIT, subsequentLimit - depth)
  }
}

/**
 * @param turn whose player it is the turn of
 * @param board the state of the game to evaluate
 * @returns the best move(s) that the player can play. It contains more than one
 *          result only when some moves are equally good for the player
 *          according to the heuristic.
 */
export function gomokuPvsClass(
  gomokuBasicEngineClass: GomokuConsturctor<GomokuBasicEngine>,
): GomokuConsturctor<GomokuEngine> {
  return class GomokuPvsEngine implements GomokuEngine {
    constructor(private board: Board, private turn: Turn) {}

    getMove(
      moveHistory: Position[],
      shouldStop: (param: { moveCount: number }) => boolean,
    ): Position[] | "gameover" {
      // Hard-coded solutions, for the first move
      // ...when playing first
      if (moveHistory.length === 0) {
        return new gomokuBasicEngineClass(this.board, this.turn).getMove(
          moveHistory,
          shouldStop,
        )
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
      let gameoverRef = { current: false }
      let potentialGrid = new gomokuBasicEngineClass(
        this.board,
        this.turn,
      ).newPotentialGrid()

      new gomokuBasicEngineClass(
        this.board,
        this.turn,
        gameoverRef,
        preBestMoveArray,
        potentialGrid,
      ).aiProcessing()

      if (gameoverRef.current) {
        return "gameover"
      }

      if (preBestMoveArray.length > 0) {
        let move = preBestMoveArray[0]
        let potential = potentialGrid[move.y][move.x]
        if (potential[0] > 0 || potential[1] > 0) {
          return preBestMoveArray
        }
      }

      let firstOption: Position = { x: -1, y: -1 }

      let bestMoveArray: Position[] = []
      let bestScore = -Infinity
      let bestPotential = 0

      let basicMoveArray = [] as Move[]
      let variation = ""

      let manager = getBoardManager(
        this.board,
        this.turn,
        FIRST_LEVEL_LIMIT,
        gomokuBasicEngineClass,
      )

      for (
        let k = 0;
        manager.next() === "continue" && k < FIRST_LEVEL_LIMIT;
        k++
      ) {
        let score = -pvs(
          this.board,
          0,
          bestScore,
          Infinity,
          (3 - this.turn) as Turn,
          DEPTH_DAMPENING_FACTOR,
          dynamicLimit(SUBSEQUENT_LIMIT - 4 + Math.min(moveHistory.length, 4)),
          gomokuBasicEngineClass,
        )

        let move = manager.getCurrentMove()
        basicMoveArray.push(move)
        if (new URLSearchParams(location.search).has("verbose")) {
          console.log(
            `[${"_●○"[this.turn]}]`,
            "move, potential, score",
            move && positionToString(move),
            move.potential,
            readableScore(score),
          )
        }
        if (score === bestScore && move.potential === bestPotential) {
          bestMoveArray.push(move)
        } else if (
          score > bestScore ||
          (score === bestScore && move.potential > bestPotential)
        ) {
          if (k > 0) {
            variation = " --- variation"
          }
          bestScore = score
          bestPotential = move.potential
          bestMoveArray.splice(0, bestMoveArray.length, move)
        } else if (bestScore === Infinity && move.potential < bestPotential) {
          break
        } else if (shouldStop({ moveCount: k + 1 })) {
          break
        }
      }
      manager.reset()

      console.log(
        ...basicMoveArray.map(positionToString),
        `\n[${"_●○"[this.turn]}]${variation}`,
        ...bestMoveArray.map(positionToString),
        readableScore(bestScore),
      )

      return bestMoveArray
    }
  }
}
