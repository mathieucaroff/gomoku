import * as React from "react"
import { KeyboardEvent, useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { play as gomokuAiPlay, Board, Position } from "./gomokuAi"
import { githubCornerHTML } from "./lib/githubCorner"
import * as packageInfo from "../package.json"

type Versus = "human vs ai" | "ai vs human" | "human vs human" | "ai vs ai"

let cornerDiv = document.createElement("div")
cornerDiv.innerHTML = githubCornerHTML(
  packageInfo.repository.url,
  packageInfo.version,
)
document.body.appendChild(cornerDiv)

let urlSearch = new URLSearchParams(location.search)

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
  let [state, setState] = useState({
    versus: "human vs ai" as Versus,
    playHistory: [] as Position[],
  })

  let turn = ((state.playHistory.length % 2) + 1) as 1 | 2
  let board = getBoard(state.playHistory)
  let recommendation = gomokuAiPlay(turn, board)
  let gameStatus =
    recommendation === "gameover"
      ? `Game Over, player ${3 - turn} won`
      : `Player ${turn}'s turn`

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

  let handleGoBack = (time: number) => () => {
    state.playHistory = state.playHistory.slice(0, time)
    setState({ ...state })
  }
  let handleReset = () => {}
  let handlePlay = (x: number, y: number) => () => {
    state.playHistory.push({ x, y })
    setState({ ...state })
  }

  return (
    <>
      <p>
        {gameStatus}{" "}
        {recommendation === "gameover" ? (
          <button onClick={handleReset}>Reset</button>
        ) : null}
      </p>

      <div className="field">
        <table className="history">
          <thead>
            <tr>
              <td>n°</td>
              <td></td>
              <td>position</td>
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
                  {(x + 10).toString(36).toUpperCase()}
                  {y + 1}
                </td>
                <td>
                  <button onClick={handleGoBack(k)}>go back</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="board">
          <thead>
            <tr>
              <th></th>
              {board.map((_, k) => (
                <th>{(k + 10).toString(36).toUpperCase()}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {board.map((row, y) => (
              <tr key={y}>
                <th>{y + 1}</th>
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
                <th>{y + 1}</th>
              </tr>
            ))}
            <tr>
              <th></th>
              {board.map((_, k) => (
                <th>{(k + 10).toString(36).toUpperCase()}</th>
              ))}
              <th></th>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
