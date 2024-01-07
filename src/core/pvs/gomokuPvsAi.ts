import {
  Board,
  GetMoveOutput,
  GomokuBasicEngine,
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
 */
export class GomokuPvs implements GomokuEngine {
  constructor(
    private board: Board,
    private turn: Turn,
    private basicEngine: GomokuBasicEngine,
  ) {}

  init(prop: { turn: Turn; board?: Board }) {
    this.board = prop.board ?? this.board
    this.turn = prop.turn
    return this
  }

  getMove(moveHistory: Position[], shouldStop: () => boolean): GetMoveOutput {
    // Hard-coded solutions, for the first move
    // ...when playing first
    if (moveHistory.length === 0) {
      return this.basicEngine.getMove(moveHistory, shouldStop)
    }
    // ...when playing second
    if (moveHistory.length === 1) {
      let move = moveHistory[0]
      if (move.x > 0 && move.x < 18 && move.y > 0 && move.y < 18) {
        return {
          gameover: false,
          moveArray: [
            { x: move.x - 1, y: move.y },
            { x: move.x + 1, y: move.y },
            { x: move.x, y: move.y - 1 },
            { x: move.x, y: move.y + 1 },
          ],
          proceedings: { stopped: false, examinedMoveCount: 0 },
        }
      }
    }
    // End of hard-coded solutions
    // Detect friendly and enemy potential lines of five and react immediately to them

    let {
      bestMoveArray: preBestMoveArray,
      gameoverRef,
      potentialGrid,
    } = this.basicEngine
      .init({
        board: this.board,
        turn: this.turn,
      })
      .aiProcessing()
      .get()

    if (gameoverRef.current) {
      return {
        gameover: true,
        moveArray: [],
        proceedings: { stopped: false, examinedMoveCount: 0 },
      }
    }

    if (preBestMoveArray.length > 0) {
      let move = preBestMoveArray[0]
      let potential = potentialGrid[move.y][move.x]
      if (potential[0] > 0 || potential[1] > 0) {
        return {
          gameover: false,
          moveArray: preBestMoveArray,
          proceedings: { stopped: false, examinedMoveCount: 1 },
        }
      }
    }

    let bestMoveArray: Position[] = []
    let bestScore = -Infinity
    let bestPotential = 0

    let basicMoveArray = [] as Move[]
    let variation = ""
    let stopped = false
    let moveCount = 0

    let manager = getBoardManager(
      this.board,
      this.turn,
      FIRST_LEVEL_LIMIT,
      this.basicEngine,
    )

    for (
      ;
      manager.next() === "continue" && moveCount < FIRST_LEVEL_LIMIT;
      moveCount++
    ) {
      let score = -pvs(
        this.board,
        0,
        bestScore,
        Infinity,
        (3 - this.turn) as Turn,
        DEPTH_DAMPENING_FACTOR,
        dynamicLimit(SUBSEQUENT_LIMIT - 4 + Math.min(moveHistory.length, 4)),
        this.basicEngine,
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
        if (moveCount > 0) {
          variation = " --- variation"
        }
        bestScore = score
        bestPotential = move.potential
        bestMoveArray.splice(0, bestMoveArray.length, move)
      } else if (bestScore === Infinity && move.potential < bestPotential) {
        moveCount++
        break
      }
      if (shouldStop()) {
        stopped = true
        moveCount++
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

    return {
      gameover: false,
      moveArray: bestMoveArray,
      proceedings: {
        stopped,
        examinedMoveCount: moveCount,
      },
    }
  }
}
