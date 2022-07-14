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
    aiplay()
    setBoard(board.slice())
  }, [])

  let handleClick = (x: number, y: number) => (event: MouseEvent) => {
    if (board[y][x] === 0) {
      board[y][x] = turn
      aiplay()
      setBoard(board.slice())
      // setTurn(3 - turn)
    }
  }

  function aiplay() {
    let aiPosition = play((3 - turn) as any, board)
    if (aiPosition === "gameover") {
      setGameStatus("Game Over")
      return
    }
    board[aiPosition.y][aiPosition.x] = 3 - turn
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
