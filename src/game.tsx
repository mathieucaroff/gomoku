import React, { useRef } from "react"
import { KeyboardEvent, useEffect, useState } from "react"
import { Modal } from "./components/Modal/Modal"
import { Cross } from "./components/Cross/Cross"
import { gomokuAiOne, gomokuAiOneRecommendation } from "./core/gomokuAiOne"
import { exportGame, importGame } from "./exportImport"
import { Board, Engine, GomokuConfig, Position, Turn, Versus } from "./type"
import { pairs, pause, positionToString } from "./utils"
import { gomokuPvsAiRecommendation } from "./core/pvs/gomokuPvsAi"

function getBoard(playHistory: Position[]) {
  let board: Board = Array.from({ length: 19 }, () =>
    Array.from({ length: 19 }, () => 0),
  )
  let turn: Turn = 1
  playHistory.forEach(({ x, y }) => {
    board[y][x] = turn
    turn = 3 - turn
  })
  return board
}

export function Game(prop: {
  config: GomokuConfig
  styleSheet: CSSStyleSheet
}) {
  let { config, styleSheet } = prop
  let [state, setState] = useState(() => {
    return {
      dark: config.dark,
      engine: config.engine,
      versus: config.versus,
      playHistory: importGame(config.game),
      importExportGame: "",
      importError: "",
    }
  })

  let distributor = useRef(0)

  React.useLayoutEffect(() => {
    if (state.dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    let [playerOneColor, playerTwoColor] = config.playerColors.split(":")
    let [playerOneHighlightColor, playerTwoHighlightColor] =
      config.highlightColors.split(":")

    styleSheet.deleteRule(0)
    styleSheet.insertRule(`
    html, html.dark {
      --first-color: #${playerOneColor || "000"};
      --first-highlight-color: #${playerOneHighlightColor || "0F0"};
      --second-color: #${playerTwoColor || "FFF"};
      --second-highlight-color: #${playerTwoHighlightColor || "0F0"};
    }
  `)
  }, [state.dark])

  let turn = ((state.playHistory.length % 2) + 1) as Turn
  let board = getBoard(state.playHistory)
  let recommendation = gomokuAiOne(board, turn, state.playHistory)
  let maybeTheAiIsThinking =
    (state.versus === "humanAi" && turn === 1) ||
    (state.versus === "aiHuman" && turn === 2) ||
    state.versus === "humanHuman" ||
    recommendation === "gameover"
      ? ""
      : ", the AI is thinking..."
  let gameStatus =
    recommendation === "gameover" ? (
      <>
        Game Over, player {<Cross value={(3 - turn) as Turn} textual />} won in{" "}
        {Math.ceil(state.playHistory.length / 2)} moves.
      </>
    ) : (
      <>
        It is <Cross value={turn} textual />
        's turn{maybeTheAiIsThinking}
      </>
    )

  useEffect(() => {
    if (
      state.versus === "aiAi" ||
      (state.versus === "humanAi" && turn === 2) ||
      (state.versus === "aiHuman" && turn === 1) ||
      state.versus === "onePvs" ||
      state.versus === "pvsOne"
    ) {
      let { engine } = state
      if (state.versus === "onePvs" || state.versus === "pvsOne") {
        engine = (state.versus === "onePvs") === (turn === 1) ? "one" : "pvs"
      }

      let [getAiRecommendation, timeout] = {
        one: [gomokuAiOneRecommendation, config.aiOneTimeout] as const,
        pvs: [gomokuPvsAiRecommendation, config.aiPvsTimeout] as const,
      }[engine]

      let timer = setTimeout(async () => {
        let ticket = ++distributor.current
        let now = Date.now()
        let playArray = await getAiRecommendation(
          board,
          config.defensive ? ((3 - turn) as Turn) : turn,
          state.playHistory,
        )
        let delta = Date.now() - now
        if (delta < config.minimumTimeout) {
          await pause(config.minimumTimeout - delta)
        }
        if (ticket !== distributor.current) {
          return
        }
        if (playArray !== "gameover" && playArray.length > 0) {
          let { x, y } = playArray[Math.floor(Math.random() * playArray.length)]
          let { playHistory } = state
          playHistory.push({ x, y })
          setState((state) => ({
            ...state,
            importExportGame: exportGame(playHistory),
          }))
        }
      }, timeout)
      return () => {
        clearTimeout(timer)
      }
    }
  })

  let handleEngineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setState((state) => ({ ...state, engine: event.target.value as Engine }))
  }
  let engineOptionArray: Record<Engine, string> = {
    one: "One (hard)",
    pvs: "PVS (very hard)",
  }

  let handleVersusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setState((state) => ({ ...state, versus: event.target.value as Versus }))
  }
  let versusOptionArray: Record<Versus, string> = {
    humanAi: "Human vs AI",
    aiHuman: "AI vs Human",
    humanHuman: "Human vs Human",
    aiAi: "AI vs AI",
    onePvs: "One vs PVS",
    pvsOne: "PVS vs One",
  }

  let handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setState((state) => ({ ...state, dark: event.target.value === "dark" }))
  }

  let handleKeyDown =
    (position: Position) => (event: KeyboardEvent<HTMLButtonElement>) => {
      let { x, y } = position
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

      event.preventDefault()

      document
        .querySelector<HTMLButtonElement>(
          `.board tr:nth-of-type(${y + 1 + dy}) td:nth-of-type(${
            x + 1 + dx
          }) button`,
        )
        ?.focus?.()
    }

  let handleGoBack = (time: number) => () => {
    let playHistory = state.playHistory.slice(0, time)
    setState((state) => ({
      ...state,
      playHistory,
      importExportGame: exportGame(playHistory),
      importError: "",
    }))
  }
  let handlePlayAgain = () => {
    let playHistory: Position[] = []
    setState((state) => ({
      ...state,
      playHistory,
      importExportGame: exportGame(playHistory),
      importError: "",
    }))
  }
  let handlePlay = (position: Position) => () => {
    let { x, y } = position
    let validVersus =
      state.versus === "humanHuman" ||
      (state.versus === "humanAi" && turn === 1) ||
      (state.versus === "aiHuman" && turn === 2)
    if (validVersus && board[y][x] === 0) {
      let { playHistory } = state
      playHistory.push({ x, y })
      setState((state) => ({
        ...state,
        playHistory,
        importExportGame: exportGame(playHistory),
        importError: "",
      }))
    }
  }

  let crossDisabled = recommendation === "gameover"

  let horizontalHeader = (
    <tr>
      <th></th>
      {board.map((_, k) => (
        <th key={k}>{(k + 10).toString(36).toUpperCase()}</th>
      ))}
      <th></th>
    </tr>
  )

  let moveCount = Math.ceil(state.playHistory.length / 2)

  return (
    <>
      <div className="field">
        <div className="general-info">
          <div className="info">
            <h1>Gomoku</h1>
            <p style={{ maxWidth: "300px" }}>
              Fill a row, a column or a diagonal of five consecutive cross of
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
              Engine:{" "}
              <select
                onChange={handleEngineChange}
                value={state.engine}
                disabled={
                  state.versus === "pvsOne" || state.versus === "onePvs"
                }
              >
                {Object.entries(engineOptionArray).map(([value, text]) => (
                  <option {...{ value, key: value }}>{text}</option>
                ))}
              </select>
            </div>
            <div>
              Theme:{" "}
              <select
                onChange={handleThemeChange}
                value={state.dark ? "dark" : "light"}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <button
                disabled={state.playHistory.length === 0}
                onClick={() => {
                  let undoCount =
                    state.versus === "humanAi" || state.versus === "aiHuman"
                      ? 2
                      : 1
                  let playHistory = state.playHistory.slice(0, -undoCount)
                  setState((state) => ({
                    ...state,
                    playHistory,
                    importExportGame: exportGame(playHistory),
                  }))
                }}
              >
                Undo
              </button>
            </div>
            {recommendation === "gameover" && (
              <Modal className="game-status-modal">
                {state.versus === "humanHuman" ? (
                  <>
                    Player {<Cross value={(3 - turn) as Turn} textual />} won in{" "}
                    {moveCount} moves
                  </>
                ) : state.versus === "aiAi" ? (
                  <>
                    AI {<Cross value={(3 - turn) as Turn} textual />} won in{" "}
                    {moveCount} moves
                  </>
                ) : state.versus === "onePvs" || state.versus === "pvsOne" ? (
                  <>
                    AI{" "}
                    {(state.versus === "onePvs") === (turn === 2)
                      ? '"One"'
                      : '"PVS"'}{" "}
                    won after {moveCount} moves
                  </>
                ) : (state.versus === "humanAi") === (turn === 2) ? (
                  <>
                    Victory!
                    <br />
                    You won after {moveCount} moves
                  </>
                ) : (
                  <>
                    Defeat!
                    <br />
                    You lost after {moveCount} moves
                  </>
                )}
              </Modal>
            )}
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
                    setState((state) => ({
                      ...state,
                      importExportGame: event.target.value,
                    }))
                  }}
                />
              </div>
              <div>
                <button
                  onClick={() => {
                    try {
                      let playHistory = importGame(state.importExportGame)
                      setState((state) => ({
                        ...state,
                        playHistory,
                        importError: "",
                      }))
                    } catch (e: any) {
                      setState((state) => ({
                        ...state,
                        importError: e.message,
                      }))
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
                <col span={1} style={{ width: "6%" }} />
                <col span={1} style={{ width: "40%" }} />
                <col span={1} style={{ width: "6%" }} />
                <col span={1} style={{ width: "40%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>n°</th>
                  <th colSpan={4}>move</th>
                </tr>
              </thead>
              <tbody>
                {pairs(state.playHistory).map(([a, b], k) => (
                  <tr key={k}>
                    <td>{k + 1}</td>
                    <td>
                      <button title="go back" onClick={handleGoBack(2 * k)}>
                        ⮌
                      </button>
                    </td>
                    <td>
                      <Cross value={1} textual /> {positionToString(a)}
                    </td>
                    {b ? (
                      <>
                        <td>
                          <button
                            title="go back"
                            onClick={handleGoBack(2 * k + 1)}
                          >
                            ⮌
                          </button>
                        </td>
                        <td>
                          <Cross value={2} textual /> {positionToString(b)}
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
                  let lastPlay = state.playHistory.slice(-1)[0] ?? {}
                  return (
                    <td key={x}>
                      <Cross
                        onClick={handlePlay}
                        onKeyDown={handleKeyDown}
                        disabled={crossDisabled}
                        className={
                          lastPlay.x === x && lastPlay.y === y
                            ? "cross--highlight"
                            : ""
                        }
                        value={value}
                        position={{ x, y }}
                      />
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
