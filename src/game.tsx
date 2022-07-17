import * as React from "react"
import { KeyboardEvent, useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { play, Board, Position } from "./gomokuAi"
import { githubCornerHTML } from "./lib/githubCorner"
import * as packageInfo from "../package.json"

let cornerDiv = document.createElement("div")
cornerDiv.innerHTML = githubCornerHTML(
  packageInfo.repository.url,
  packageInfo.version,
)
document.body.appendChild(cornerDiv)

let search = new URLSearchParams(location.search)

let root = createRoot(document.getElementById("root"))
root.render(<App />)

function getBoard(playHistory: Position[]) {
  let board: Board = Array.from({ length: 19 }, () =>
    Array.from({ length: 19 }, () => 0),
  )
  let turn = 1 as 1 | 2
  playHistory.forEach(({ x, y }) => {
    board[y][x] = turn
    turn = (3 - turn) as 1 | 2
  })
  return board
}

function App() {
  let [gameStatus, setGameStatus] = useState("Playing")
  let [state, setState] = useState({ playHistory: [] as Position[] })

  useEffect(() => {
    if (search.has("aiplaysfirst") || search.has("aionly")) {
      aiplay(1)
    }
  }, [])

  function aiplay(turn: 1 | 2) {
    let board = getBoard(state.playHistory)
    let thePlay = search.has("defensive")
      ? play((3 - turn) as any, board)
      : play(turn, board)
    if (thePlay === "gameover") {
      setGameStatus(`Game Over (player ${3 - turn} wins)`)
      return
    }
    let { potential, positionArray } = thePlay
    if (potential < "0000000010") {
      setGameStatus("Game Over (draw)")
      return
    }

    let position =
      positionArray[Math.floor(Math.random() * positionArray.length)]

    let { playHistory } = state
    playHistory.push(position)
    board[position.y][position.x] = turn
    setState({ playHistory })
    if (play(turn, board) === "gameover") {
      setGameStatus(`Game Over (player ${turn} wins)`)
      return
    } else {
      setGameStatus(`Playing (${positionArray.length})`)
      if (search.has("aionly")) {
        let period = +(search.get("period") ?? 500)
        setTimeout(() => {
          aiplay((3 - turn) as any)
        }, period)
      }
    }
  }

  let handlePlay = (x: number, y: number) => () => {
    let { playHistory } = state
    if (playHistory.every((position) => position.x !== x || position.y !== y)) {
      playHistory.push({ x, y })
      setState({ playHistory })
      aiplay(((state.playHistory.length % 2) + 1) as 1 | 2)
    }
  }

  let handleKeyDown =
    (x: number, y: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
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

  let handleGoBack = (k: number) => () => {
    let playHistory = state.playHistory.slice(0, k)
    setState({ playHistory })
    if (play(((k % 2) + 1) as 1 | 2, getBoard(playHistory)) === "gameover") {
      setGameStatus(`Game Over (player ${(k % 2) + 1} wins)`)
      return
    } else {
      setGameStatus(`Playing`)
    }
  }

  let handleReset = () => {
    setState({ playHistory: [] })
    setGameStatus(`Playing`)
  }

  return (
    <>
      <p>
        {gameStatus}{" "}
        {gameStatus.startsWith("Game Over") ? (
          <button onClick={handleReset}>Reset</button>
        ) : null}
      </p>

      <div className="field">
        <table className="history">
          <thead>
            <tr>
              <td>n°</td>
              <td></td>
              <td>x, y</td>
              <td>
                <button
                  onClick={handleGoBack(state.playHistory.length - 1)}
                  disabled={state.playHistory.length < 1}
                >
                  undo one
                </button>
              </td>
            </tr>
          </thead>
          <tbody>
            {state.playHistory.map(({ x, y }, k) => (
              <tr key={k}>
                <td>{k + 1}</td>
                <td className={`player player--${(k % 2) + 1}`}></td>
                <td>
                  {x}, {y}
                </td>
                <td>
                  <button onClick={handleGoBack(k)}>go back</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="board">
          <tbody>
            {getBoard(state.playHistory).map((row, y) => (
              <tr key={y}>
                {row.map((value, x) => {
                  return (
                    <td key={x}>
                      <button
                        disabled={gameStatus.startsWith("Game Over")}
                        className={`button button--${value}`}
                        onClick={handlePlay(x, y)}
                        onKeyDown={handleKeyDown(x, y)}
                      >
                        {value === 0 ? "" : value}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
