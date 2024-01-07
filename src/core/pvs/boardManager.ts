import { Board, GomokuBasicEngine, GomokuConsturctor, Turn } from "../../type"
import { getMoveArray } from "./moveArray"

export function getBoardManager(
  board: Board,
  turn: Turn,
  limit: number,
  gomokuBasicEngineClass: GomokuConsturctor<GomokuBasicEngine>,
) {
  let moveArray = getMoveArray(board, turn, limit, gomokuBasicEngineClass)!
  if (moveArray === null || moveArray.length === 0) {
    return {
      isTerminal: true,
      next: () => "stop" as const,
      getCurrentMove: () => ({ x: -1, y: -1, potential: -1 }),
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
    reset,
  }
}
