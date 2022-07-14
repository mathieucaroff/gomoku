import * as React from "react"
import { useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { play } from "./gomoku"
import { githubCornerHTML } from "./lib/githubCorner"
import * as packageInfo from "./package.json"

const root = createRoot(document.getElementById("root"))
root.render(<App />)

let cornerDiv = document.createElement("div")
cornerDiv.innerHTML = githubCornerHTML(
  packageInfo.repository.url,
  packageInfo.version,
)
document.body.appendChild(cornerDiv)

function App() {
  let [turn, setTurn] = useState(1)
  let [gameStatus, setGameStatus] = useState("Playing")
  let [board, setBoard] = useState(
    Array.from({ length: 19 }, () => Array.from({ length: 19 }, () => 0)),
  )

  useEffect(() => {
    if (new URLSearchParams(location.search).has("aiplaysfirst")) {
      aiplay(turn)
    }
  }, [])

  let handleClick = (x: number, y: number) => (event: MouseEvent) => {
    if (board[y][x] === 0) {
      board[y][x] = turn
      aiplay((3 - turn) as any)
    }
  }

  function aiplay(turn: 1 | 2) {
    let thePlay = play(turn, board)
    if (thePlay === "gameover") {
      setGameStatus("Game Over")
      return
    }
    let { potential, positionArray } = thePlay
    if (potential < "0000000010") {
      setGameStatus("Game Over")
      return
    }

    console.log(
      "potential",
      potential,
      "positionArray.length",
      positionArray.length,
    )
    let position =
      positionArray[Math.floor(Math.random() * positionArray.length)]
    board[position.y][position.x] = turn
    setGameStatus(`Playing (${positionArray.length})`)
    setBoard(board.slice())
    if (play(turn, board) === "gameover") {
      setGameStatus("Game Over")
      return
    } else {
      setTurn((3 - turn) as any)
      // setTimeout(() => {
      //   aiplay((3 - turn) as any)
      // }, 0)
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
        }) button`,
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
