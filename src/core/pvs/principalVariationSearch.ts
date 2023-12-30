import { Board, Turn } from "../../type"
import { getBoardManager } from "./boardManager"

export function pvs(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  turn: Turn,
  limit: number,
) {
  let manager = getBoardManager(board, turn, limit)
  // if (depth === 0 || manager.isTerminal) {
  //   return (3 - 2 * turn) * manager.getEvaluation()
  // }
  if (depth === 0) {
    return 0
  }
  if (manager.isTerminal) {
    return -Infinity
  }

  for (let k = 0; k < limit; k++) {
    if (manager.next() === "stop") {
      break
    }
    let score: number
    if (k === 0) {
      score = -pvs(board, depth - 1, -beta, -alpha, (3 - turn) as Turn, limit)
    } else {
      score = -pvs(board, depth - 1, -alpha, -alpha, (3 - turn) as Turn, limit) // search with a null window
      if (alpha < score && score < beta) {
        score = -pvs(board, depth - 1, -beta, -alpha, (3 - turn) as Turn, limit) // if (it failed high, do a full re-search
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
