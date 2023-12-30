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
  // if (depth === 0 || manager.isTerminal) {
  //   return (3 - 2 * turn) * manager.getEvaluation()
  // }
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
          -alpha,
          (3 - turn) as Turn,
          depthDampeningFactor,
          dynamicLimit,
        ) * depthDampeningFactor // search with a full window
    } else {
      score =
        -pvs(
          board,
          depth - 1,
          -alpha,
          -alpha,
          (3 - turn) as Turn,
          depthDampeningFactor,
          dynamicLimit,
        ) * depthDampeningFactor // search with a null window
      if (alpha < score && score < beta) {
        score =
          -pvs(
            board,
            depth - 1,
            -beta,
            -alpha,
            (3 - turn) as Turn,
            depthDampeningFactor,
            dynamicLimit,
          ) * depthDampeningFactor // if it failed high, do a full re-search
      }
    }
    alpha = Math.max(alpha, score)
    if (alpha > beta) {
      manager.reset()
      break // beta cut-off
    }
  }
  manager.reset()

  // console.log(
  //   "pvs(board, depth:",
  //   depth,
  //   "alpha:",
  //   alpha,
  //   "beta:",
  //   beta,
  //   "turn:",
  //   turn,
  //   "):",
  //   alpha,
  // )

  return alpha
}
