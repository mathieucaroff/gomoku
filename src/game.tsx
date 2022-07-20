import * as React from "react"
import { KeyboardEvent, useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { play as gomokuAiPlay, Board, Position } from "./gomokuAi"
import { githubCornerHTML } from "./lib/githubCorner"
import * as packageInfo from "../package.json"
import { exportGame, importGame } from "./exportImport"

type Versus = "humanAi" | "aiHuman" | "humanHuman" | "aiAi"

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
    defensive: urlSearch.get("defensive") !== null || false,
    versus: (urlSearch.get("versus") || "humanAi") as Versus,
    timeout: +(urlSearch.get("timeout") ?? 500),
    playHistory: [] as Position[],
    importExportGame: "",
  })

  let turn = ((state.playHistory.length % 2) + 1) as 1 | 2
  let board = getBoard(state.playHistory)
  let recommendation = gomokuAiPlay(turn, board)
  let gameStatus =
    recommendation === "gameover" ? (
      <>
        Game Over, player {<Button value={(3 - turn) as 1 | 2} />} won in{" "}
        {state.playHistory.length} plays.
      </>
    ) : (
      <>Player {<Button value={turn} />}'s turn</>
    )

  useEffect(() => {
    if (
      state.versus === "aiAi" ||
      (state.versus === "humanAi" && turn === 2) ||
      (state.versus === "aiHuman" && turn === 1)
    ) {
      let timer = setTimeout(() => {
        let play = state.defensive
          ? gomokuAiPlay((3 - turn) as 1 | 2, board)
          : gomokuAiPlay(turn, board)
        if (play !== "gameover") {
          let { x, y } =
            play.positionArray[
              Math.floor(Math.random() * play.positionArray.length)
            ]
          let { playHistory } = state
          playHistory.push({ x, y })
          setState({ ...state, importExportGame: exportGame(playHistory) })
        }
      }, state.timeout)
      return () => {
        clearTimeout(timer)
      }
    }
  })

  let handleVersusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setState({ ...state, versus: event.target.value as Versus })
  }
  let versusOptionArray: Record<Versus, string> = {
    humanAi: "human vs ai",
    aiHuman: "ai vs human",
    humanHuman: "human vs human",
    aiAi: "ai vs ai",
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

  type ButtonProp = { position?: { x: number; y: number }; value: 0 | 1 | 2 }
  function Button({ position, value }: ButtonProp) {
    return (
      <button
        disabled={recommendation === "gameover"}
        className={`button button--${value}`}
        onClick={position && handlePlay(position.x, position.y)}
        onKeyDown={position && handleKeyDown(position.x, position.y)}
      >
        {["", "X", "O"][value]}
      </button>
    )
  }

  let handleGoBack = (time: number) => () => {
    let playHistory = state.playHistory.slice(0, time)
    setState({
      ...state,
      playHistory,
      importExportGame: exportGame(playHistory),
    })
  }
  let handleReset = () => {
    let playHistory = []
    setState({
      ...state,
      playHistory,
      importExportGame: exportGame(playHistory),
    })
  }
  let handlePlay = (x: number, y: number) => () => {
    if (board[y][x] === 0) {
      let { playHistory } = state
      playHistory.push({ x, y })
      setState({
        ...state,
        playHistory,
        importExportGame: exportGame(playHistory),
      })
    }
  }

  let horizontalHeader = (
    <tr>
      <th></th>
      {board.map((_, k) => (
        <th>{(k + 10).toString(36).toUpperCase()}</th>
      ))}
      <th></th>
    </tr>
  )

  return (
    <>
      Select a game mode:{" "}
      <select onChange={handleVersusChange} value={state.versus}>
        {Object.entries(versusOptionArray).map(([value, text]) => (
          <option {...{ value }}>{text}</option>
        ))}
      </select>
      <p>
        {gameStatus}{" "}
        {recommendation === "gameover" ? (
          <button onClick={handleReset}>Reset</button>
        ) : null}
      </p>
      <div className="field">
        <div>
          <div>
            <textarea
              className="import-export"
              rows={36}
              cols={7}
              value={state.importExportGame}
              onChange={(event) => {
                setState({ ...state, importExportGame: event.target.value })
              }}
            />
          </div>
          <div>
            <button
              onClick={() => {
                setState({
                  ...state,
                  playHistory: importGame(state.importExportGame),
                })
              }}
              disabled={
                state.importExportGame === exportGame(state.playHistory)
              }
            >
              Import game
            </button>
          </div>
        </div>
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
                <td>
                  <Button value={((k % 2) + 1) as 1 | 2} />
                </td>
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
          <thead>{horizontalHeader}</thead>
          <tbody>
            {board.map((row, y) => (
              <tr key={y}>
                <th>{y + 1}</th>
                {row.map((value, x) => {
                  return (
                    <td key={x}>
                      <Button value={value} position={{ x, y }} />
                    </td>
                  )
                })}
                <th>{y + 1}</th>
              </tr>
            ))}
            {horizontalHeader}
          </tbody>
        </table>
      </div>
    </>
  )
}
