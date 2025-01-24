import {
  Board,
  GetMoveOutput,
  GomokuBasicEngine,
  GomokuEngine,
  GomokuPvsOptionObject,
  Move,
  Position,
  Turn,
} from "../../type"
import {
  compareNumberProperty,
  positionToString,
  readableScore,
} from "../../utils"

const comparePotential = compareNumberProperty("potential")

/**
 * @param turn whose player it is the turn of
 * @param board the state of the game to evaluate
 */
export class GomokuPvs implements GomokuEngine {
  basicEngine: GomokuBasicEngine
  depthDampeningFactor: number
  dynamicLimit: (depth: number, halfMoveCount: number) => number
  moveHistory: Position[]
  verbose: boolean

  constructor(
    private board: Board,
    private turn: Turn,
    optionObject: GomokuPvsOptionObject,
  ) {
    this.basicEngine = optionObject.basicEngine
    this.depthDampeningFactor = optionObject.depthDampeningFactor ?? 0.5
    this.moveHistory = optionObject.moveHistory
    this.verbose = optionObject.verbose
    this.dynamicLimit = optionObject.dynamicLimit
  }

  init(prop: { turn: Turn; board?: Board }) {
    this.board = prop.board ?? this.board
    this.turn = prop.turn
    return this
  }

  getMove(remaining: () => number, beginning: number): GetMoveOutput {
    // Hard-coded solution, for the first move when playing first
    if (this.moveHistory.length === 0) {
      return this.basicEngine.getMove(remaining, beginning)
    }

    // Detect friendly and enemy potential lines of five and react immediately to them
    let {
      bestMoveArray: preBestMoveArray,
      gameoverRef,
      potentialGrid,
    } = this.basicEngine
      .init({
        board: this.board,
        moveHistory: this.moveHistory,
        turn: this.turn,
      })
      .aiProcessing()
      .get()

    if (gameoverRef.current) {
      return {
        gameover: true,
        moveArray: [],
        score: 0.5,
      }
    }

    if (preBestMoveArray.length === 0) {
      return {
        gameover: false,
        moveArray: [],
        score: 0.5,
      }
    }

    let historyIndex = Math.floor(this.moveHistory.length / 2) + 1
    let move = preBestMoveArray[0]
    let potential = potentialGrid[move.y][move.x]
    let aiCanWinImmediately = potential[0] > 0
    let otherCouldWinImmediately = potential[1] > 0
    let bestMoveArray: Position[] = []
    if (aiCanWinImmediately || otherCouldWinImmediately) {
      bestMoveArray = preBestMoveArray
      let bestScore = this.pvs(this.board, 100, -Infinity, Infinity, this.turn)
      console.log(
        "(took",
        Date.now() - beginning,
        "ms)",
        `\n[${historyIndex} ${"_●○"[this.turn]}]`,
        ...bestMoveArray.map(positionToString),
        readableScore(bestScore),
      )
    } else {
      let bestScore = -Infinity
      let bestPotential = 0

      let variation = [] as string[]
      let stopped = false
      let moveCount = 0

      let examinedMoveCountAtDepthZero = this.dynamicLimit(
        0,
        this.moveHistory.length,
      )
      let manager = this.getBoardManager(
        this.board,
        this.turn,
        examinedMoveCountAtDepthZero,
      )

      for (
        ;
        manager.next() === "continue" &&
        moveCount < examinedMoveCountAtDepthZero;
        moveCount++
      ) {
        let score = -this.pvs(
          this.board,
          1,
          bestScore,
          Infinity,
          (3 - this.turn) as Turn,
        )

        let move = manager.getCurrentMove()
        if (this.verbose) {
          let historyIndex = Math.floor(this.moveHistory.length / 2) + 1
          console.log(
            `[${historyIndex} ${"_●○"[this.turn]}]`,
            move && positionToString(move),
            "potential",
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
            variation.push(positionToString(move))
          }
          bestScore = score
          bestPotential = move.potential
          bestMoveArray.splice(0, bestMoveArray.length, move)
        } else if (bestScore === Infinity && move.potential < bestPotential) {
          moveCount++
          break
        }
        if (remaining() < 0) {
          stopped = true
          moveCount++
          break
        }
      }
      manager.reset()

      let timeInfo: any[] = ["(took", Date.now() - beginning, "ms"]

      if (stopped) {
        timeInfo[timeInfo.length - 1] += ","
        timeInfo.push(moveCount, "moves examined)")
      } else {
        timeInfo[timeInfo.length - 1] += ")"
      }

      let basicMoveArray = manager.moveArray?.map(positionToString)
      basicMoveArray[0] = `\n${basicMoveArray[0]}`

      if (bestMoveArray.length > 1) {
        let bestMoveString = bestMoveArray.map(positionToString).join(" ")
        variation[variation.length - 1] += `\n((${bestMoveString}))`
      }

      console.log(
        ...timeInfo,
        ...basicMoveArray,
        `\n[${historyIndex} ${"_●○"[this.turn]}]`,
        ...variation,
        readableScore(bestScore),
      )
    }

    return {
      gameover: false,
      moveArray: bestMoveArray,
      score: 0.5,
    }
  }

  pvs(board: Board, depth: number, alpha: number, beta: number, turn: Turn) {
    let limit = this.dynamicLimit(depth, this.moveHistory.length)
    let manager = this.getBoardManager(board, turn, limit)

    if (manager.isTerminal) {
      return -(2 ** 412)
    }

    const getScore = (nextAlpha: number) =>
      -this.pvs(board, depth + 1, nextAlpha, -alpha, (3 - turn) as Turn) *
      this.depthDampeningFactor

    for (let k = 0; k < limit; k++) {
      if (manager.next() === "stop") {
        break
      }

      let score: number
      if (k === 0) {
        // search with a **full** window
        score = getScore(-beta)
      } else {
        // search with a **null** window
        score = getScore(-alpha)
        if (alpha < score && score < beta) {
          // if it failed high, do a full re-search
          score = getScore(-beta)
        }
      }

      alpha = Math.max(alpha, score)
      if (alpha > beta) {
        break // beta cut-off
      }
    }
    manager.reset()

    return alpha
  }

  getMoveArray(board: Board, turn: Turn, limit: number) {
    let { potentialGrid, gameoverRef } = this.basicEngine
      .init({
        board,
        moveHistory: this.moveHistory,
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

        // Note the value of a priority in the potential is at most 20
        // 20 = 5 + 5 + 5 + 5, since there are 4 lines of 5:
        // - horizontal
        // - vertical
        // - diagonal down-right
        // - diagonal down-left
        let potential = potentialGrid[y][x].reduce((res, v) => res * 100 + v, 0)
        positionArray.push({ x, y, potential })
      }
    }

    if (positionArray.length === 0) {
      return []
    }

    if (limit === 1) {
      let best = positionArray.reduce((best, candidate) =>
        best.potential > candidate.potential ? best : candidate,
      )
      return [best]
    }

    positionArray.sort(comparePotential)

    return positionArray.slice(-limit)
  }

  getBoardManager(board: Board, turn: Turn, limit: number) {
    let moveArray = this.getMoveArray(board, turn, limit)!
    if (moveArray === null || moveArray.length === 0) {
      return {
        isTerminal: true,
        next: () => "stop" as const,
        getCurrentMove: () => ({ x: -1, y: -1, potential: -1 }),
        moveArray: [],
        reset: () => {},
      }
    }

    let move = moveArray[moveArray.length - 1]
    let index = moveArray.length
    const reset = () => {
      board[move.y][move.x] = 0
    }

    return {
      isTerminal: false,
      next: () => {
        board[move.y][move.x] = 0
        if (index === 0) {
          return "stop" as const
        }
        index--
        move = moveArray[index]
        board[move.y][move.x] = turn
        return "continue" as const
      },
      getCurrentMove: () => move,
      moveArray: [...moveArray].reverse(),
      reset,
    }
  }
}
