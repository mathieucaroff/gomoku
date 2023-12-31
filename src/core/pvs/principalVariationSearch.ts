import { Board, Turn } from "../../type"
import { getBoardManager } from "./boardManager"

export function pvs(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  turn: Turn,
  depthDampeningFactor: number,
  dynamicLimit: (depth: number) => number,
) {
  let limit = dynamicLimit(depth)
  let manager = getBoardManager(board, turn, limit)

  if (depth === 0) {
    return 0
  }
  if (manager.isTerminal) {
    return -Number.MAX_VALUE
  }

  for (let k = 0; k < limit; k++) {
    if (manager.next() === "stop") {
      break
    }
    let score: number
    if (k === 0) {
      score =
        -pvs(
          board,
          depth - 1,
          -beta,
          -alpha, // search with a **full** window
          (3 - turn) as Turn,
          depthDampeningFactor,
          dynamicLimit,
        ) * depthDampeningFactor
    } else {
      score =
        -pvs(
          board,
          depth - 1,
          -alpha,
          -alpha, // search with a **null** window
          (3 - turn) as Turn,
          depthDampeningFactor,
          dynamicLimit,
        ) * depthDampeningFactor
      if (alpha < score && score < beta) {
        // if it failed high, do a full re-search
        score =
          -pvs(
            board,
            depth - 1,
            -beta,
            -alpha,
            (3 - turn) as Turn,
            depthDampeningFactor,
            dynamicLimit,
          ) * depthDampeningFactor
      }
    }
    alpha = Math.max(alpha, score)
    if (alpha > beta) {
      manager.reset()
      break // beta cut-off
    }
  }
  manager.reset()

  return alpha
}
