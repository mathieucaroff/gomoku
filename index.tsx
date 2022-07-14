import * as React from "react"
import { useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { play } from "./gomoku"

const root = createRoot(document.getElementById("root"))
root.render(<App />)

function App() {
  const turn = 2
  let [gameStatus, setGameStatus] = useState("Playing")
  let [board, setBoard] = useState(
    Array.from({ length: 19 }, () => Array.from({ length: 19 }, () => 0))
  )

  useEffect(() => {
    aiplay(1)
  }, [])

  let handleClick = (x: number, y: number) => (event: MouseEvent) => {
    if (board[y][x] === 0) {
      board[y][x] = turn
      aiplay(1)
    }
  }

  function aiplay(turn: 1 | 2) {
    let positionArray = play(turn, board)
    if (positionArray === "gameover") {
      setGameStatus("Game Over")
      return
    }
    let position =
      positionArray[Math.floor(Math.random() * positionArray.length)]
    board[position.y][position.x] = 3 - turn
    setGameStatus(`Playing (${positionArray.length})`)
    setBoard(board.slice())
    if (play(turn, board) === "gameover") {
      setGameStatus("Game Over")
      return
    } else {
      setTimeout(() => {
        aiplay((3 - turn) as any)
      }, 10)
    }
  }

  let handleKeyDown = (x: number, y: number) => (event: KeyboardEvent) => {
    let dx = 0
    let dy = 0
    if (event.code === "ArrowLeft") {
      dx = -1
    } else if (event.code === "ArrowRight") {
      dx = 1
    } else if (event.code === "ArrowUp") {
      dy = -1
    } else if (event.code === "ArrowDown") {
      dy = 1
    } else {
      return
    }
    document
      .querySelector<HTMLButtonElement>(
        `table tr:nth-of-type(${y + 1 + dy}) td:nth-of-type(${
          x + 1 + dx
        }) button`
      )
      ?.focus?.()
  }

  return (
    <>
      <p>{gameStatus}</p>
      <table>
        <tbody>
          {board.map((row, y) => (
            <tr key={y}>
              {row.map((value, x) => {
                return (
                  <td key={x}>
                    <button
                      disabled={gameStatus === "Game Over"}
                      className={`button button--${board[y][x]}`}
                      onClick={handleClick(x, y)}
                      onKeyDown={handleKeyDown(x, y)}
                    >
                      {value}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
