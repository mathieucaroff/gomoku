import { Board, GomokuBasicEngine, GomokuConsturctor, Turn } from "../../type"
import { getBoardManager } from "./boardManager"

export function pvs(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  turn: Turn,
  depthDampeningFactor: number,
  dynamicLimit: (depth: number) => number,
  gomokuBasicEngineClass: GomokuConsturctor<GomokuBasicEngine>,
) {
  let limit = dynamicLimit(depth)
  let manager = getBoardManager(board, turn, limit, gomokuBasicEngineClass)

  if (manager.isTerminal) {
    return -(2 ** 412)
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
          depth + 1,
          -beta,
          -alpha, // search with a **full** window
          (3 - turn) as Turn,
          depthDampeningFactor,
          dynamicLimit,
          gomokuBasicEngineClass,
        ) * depthDampeningFactor
    } else {
      score =
        -pvs(
          board,
          depth + 1,
          -alpha,
          -alpha, // search with a **null** window
          (3 - turn) as Turn,
          depthDampeningFactor,
          dynamicLimit,
          gomokuBasicEngineClass,
        ) * depthDampeningFactor
      if (alpha < score && score < beta) {
        // if it failed high, do a full re-search
        score =
          -pvs(
            board,
            depth + 1,
            -beta,
            -alpha,
            (3 - turn) as Turn,
            depthDampeningFactor,
            dynamicLimit,
            gomokuBasicEngineClass,
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
