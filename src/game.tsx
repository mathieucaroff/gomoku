import * as React from "react"
import { KeyboardEvent, useEffect, useState } from "react"
import { getBestPlayArray } from "./core/gomokuAi"
import { exportGame, importGame } from "./exportImport"
import { setLocationHash } from "./lib/setLocationHash"
import { Board, Position } from "./type"
import { pairs, positionToString } from "./utils"

const gomokuAiPlay = getBestPlayArray

type Versus = "humanAi" | "aiHuman" | "humanHuman" | "aiAi"

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

export function Game() {
  let [state, setState] = useState(() => {
    let urlSearch = new URLSearchParams(location.search)
    return {
      defensive: urlSearch.get("defensive") !== null || false,
      versus: (urlSearch.get("versus") || "humanAi") as Versus,
      timeout: +(urlSearch.get("timeout") ?? 500),
      playHistory: [] as Position[],
      importExportGame: "",
      importError: "",
    }
  })

  let turn = ((state.playHistory.length % 2) + 1) as 1 | 2
  let board = getBoard(state.playHistory)
  let recommendation = gomokuAiPlay(turn, board)
  let gameStatus =
    recommendation === "gameover" ? (
      <>
        Game Over, player {<Button value={(3 - turn) as 1 | 2} />} won in{" "}
        {Math.ceil(state.playHistory.length / 2)} plays.
      </>
    ) : (
      <>It's player {<Button value={turn} />}'s turn</>
    )

  useEffect(() => {
    if (
      state.versus === "aiAi" ||
      (state.versus === "humanAi" && turn === 2) ||
      (state.versus === "aiHuman" && turn === 1)
    ) {
      let timer = setTimeout(() => {
        let playArray = state.defensive
          ? gomokuAiPlay((3 - turn) as 1 | 2, board)
          : gomokuAiPlay(turn, board)
        if (playArray !== "gameover") {
          let { x, y } = playArray[Math.floor(Math.random() * playArray.length)]
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

  let handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value === "dark") {
      setLocationHash(location, { dark: true }, [], {})
    } else {
      setLocationHash(location, {}, ["dark"], {})
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

  let init = () => {
    if (location.hash.match(/#dark($|#)/)) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }
  init()

  window.addEventListener("hashchange", () => init())

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
      importError: "",
    })
  }
  let handlePlayAgain = () => {
    let playHistory = []
    setState({
      ...state,
      playHistory,
      importExportGame: exportGame(playHistory),
      importError: "",
    })
  }
  let handlePlay = (x: number, y: number) => () => {
    let validVersus =
      state.versus === "humanHuman" ||
      (state.versus === "humanAi" && turn === 1) ||
      (state.versus === "aiHuman" && turn === 2)
    if (validVersus && board[y][x] === 0) {
      let { playHistory } = state
      playHistory.push({ x, y })
      setState({
        ...state,
        playHistory,
        importExportGame: exportGame(playHistory),
        importError: "",
      })
    }
  }

  let horizontalHeader = (
    <tr>
      <th></th>
      {board.map((_, k) => (
        <th key={k}>{(k + 10).toString(36).toUpperCase()}</th>
      ))}
      <th></th>
    </tr>
  )

  return (
    <>
      <div className="field">
        <div className="general-info">
          <div className="info">
            <h1>Gomoku</h1>
            <p style={{ maxWidth: "300px" }}>
              Fill a row, a column or a diagonal of five consecutive squares of
              your color to win.
            </p>
            <div>
              Game mode:{" "}
              <select onChange={handleVersusChange} value={state.versus}>
                {Object.entries(versusOptionArray).map(([value, text]) => (
                  <option {...{ value, key: value }}>{text}</option>
                ))}
              </select>
            </div>
            <div>
              Theme:{" "}
              <select onChange={handleThemeChange}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <p>
              {gameStatus}{" "}
              {recommendation === "gameover" ? (
                <button onClick={handlePlayAgain}>Play again</button>
              ) : null}
            </p>
            <p style={{ color: "red" }}>{state.importError}</p>
          </div>
          <div className="field">
            <div className="import-export">
              <div>
                <textarea
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
                    try {
                      let playHistory = importGame(state.importExportGame)
                      setState({
                        ...state,
                        playHistory,
                        importError: "",
                      })
                    } catch (e) {
                      setState({
                        ...state,
                        importError: e.message,
                      })
                    }
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
              <colgroup>
                <col span={1} style={{ width: "5%" }} />
                <col span={1} style={{ width: "40%" }} />
                <col span={1} style={{ width: "6%" }} />
                <col span={1} style={{ width: "40%" }} />
                <col span={1} style={{ width: "6%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>n°</th>
                  <th colSpan={4}>play</th>
                </tr>
              </thead>
              <tbody>
                {pairs(state.playHistory).map(([a, b], k) => (
                  <tr key={k}>
                    <td>{k + 1}</td>
                    <td>
                      <Button value={1} /> {positionToString(a)}
                    </td>
                    <td>
                      <button title="go back" onClick={handleGoBack(2 * k)}>
                        ⮌
                      </button>
                    </td>
                    {b ? (
                      <>
                        <td>
                          <Button value={2} /> {positionToString(b)}
                        </td>
                        <td>
                          <button
                            title="go back"
                            onClick={handleGoBack(2 * k + 1)}
                          >
                            ⮌
                          </button>
                        </td>
                      </>
                    ) : (
                      ""
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
