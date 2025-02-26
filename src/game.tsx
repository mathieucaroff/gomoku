import {
  KeyboardEvent,
  default as React,
  useEffect,
  useRef,
  useState,
} from "react"
import { Cross } from "./components/Cross/Cross"
import { Modal } from "./components/Modal/Modal"
import { UrlExportButton } from "./components/UrlExportButton/UrlExportButton"
import { GomokuAiOne } from "./core/gomokuAiOne"
import { GomokuAiTwo } from "./core/gomokuAiTwo"
import { GomokuPvs } from "./core/pvs/gomokuPvsAi"
import { exportGame, importGame } from "./exportImport"
import { Board, Engine, GomokuConfig, Position, Turn, Versus } from "./type"
import { pairs, pause, positionToString } from "./utils"

function getBoard(moveHistory: Position[]) {
  let board: Board = Array.from({ length: 19 }, () =>
    Array.from({ length: 19 }, () => 0),
  )
  let turn: Turn = 1
  moveHistory.forEach(({ x, y }) => {
    board[y][x] = turn
    turn = (3 - turn) as Turn
  })
  return board
}

export function Game(prop: {
  config: GomokuConfig
  styleSheet: CSSStyleSheet
}) {
  let { config, styleSheet } = prop
  /** /\ state /\ */
  let [state, setState] = useState(() => ({
    dark: !!+config.dark,
    engine: config.engine,
    secondEngine: config.secondEngine,
    versus: config.versus,
    moveHistory: importGame(config.game),
    importExportGame: "",
    importError: "",
    hover: null as Position | null,
  }))
  /** \/ state \/ */

  const stop = () => {
    setState((state) => ({
      ...state,
      versus: "humanHuman",
    }))
  }
  window.stop = stop

  /** /\ css dark theme management /\ */
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
  /** \/ css dark theme management \/ */

  /** /\ reusable variables /\ */
  let board = getBoard(state.moveHistory)
  let turn = ((state.moveHistory.length % 2) + 1) as Turn
  let moveCount = Math.ceil(state.moveHistory.length / 2)
  let undoCount =
    state.versus === "humanAi" || state.versus === "aiHuman" ? 2 : 1

  let score: number = 0.5

  let { gameover, moveArray } = new GomokuAiOne(
    board,
    turn,
    state.moveHistory,
  ).getMove()
  let disableBoardCrosses = gameover
  /** \/ reusable variables \/ */

  /** /\ text /\ */
  let maybeTheAiIsThinking =
    (state.versus === "humanAi" && turn === 1) ||
    (state.versus === "aiHuman" && turn === 2) ||
    state.versus === "humanHuman" ||
    gameover
      ? ""
      : ", the AI is thinking..."
  /** \/ text \/ */

  /** /\ elements /\ */
  let gameStatus = gameover ? (
    <>
      Game Over, player {<Cross value={(3 - turn) as Turn} textual />} won in{" "}
      {Math.ceil(state.moveHistory.length / 2)} moves.
    </>
  ) : moveArray.length === 0 ? (
    <>Equality was reached after {moveCount} moves.</>
  ) : (
    <>
      It is <Cross value={turn} textual />
      's turn{maybeTheAiIsThinking}
    </>
  )

  let horizontalHeader = (
    <tr>
      <th></th>
      {board.map((_, k) => (
        <th key={k}>{(k + 10).toString(36).toUpperCase()}</th>
      ))}
      <th></th>
    </tr>
  )

  let historyColgroup = (
    <colgroup>
      <col span={1} style={{ width: "5%" }} />
      <col span={1} style={{ width: "6%" }} />
      <col span={1} style={{ width: "40%" }} />
      <col span={1} style={{ width: "6%" }} />
      <col span={1} style={{ width: "40%" }} />
    </colgroup>
  )
  /** \/ elements \/ */

  /** /\ play useEffect /\ */
  // The distributor/ticket system allows to discard calculations when they
  // turn out to be out of date when an event changed the state before the
  // calculation finished.
  // let distributor = useRef(0)
  useEffect(() => {
    if (
      state.versus === "aiAi" ||
      (state.versus === "humanAi" && turn === 2) ||
      (state.versus === "aiHuman" && turn === 1)
    ) {
      let { engine } = state
      if (
        state.versus === "aiAi" &&
        turn === 2 &&
        state.secondEngine !== "same"
      ) {
        engine = state.secondEngine
      }

      let gomokuEngine = {
        basicOne: new GomokuAiOne(board, turn, state.moveHistory),
        basicTwo: new GomokuAiTwo(board, turn, state.moveHistory),
        pvsOne: new GomokuPvs(board, turn, {
          basicEngine: new GomokuAiOne(board, turn, state.moveHistory),
          moveHistory: state.moveHistory,
          verbose: config.verbose,
          dynamicLimit: (depth: number, moveCount: number) =>
            depth === 0
              ? 9
              : Math.max(1, 2 + Math.min(moveCount / 2, 4) - depth),
        }),
        pvsTwo: new GomokuPvs(board, turn, {
          basicEngine: new GomokuAiTwo(board, turn, state.moveHistory),
          moveHistory: state.moveHistory,
          dynamicLimit: (depth: number, moveCount: number) => {
            if (depth > 5) {
              return 1
            }
            if (moveCount < 6) {
              return [12, 4, 3, 2, 1, 1][depth]
            }
            return Math.max(1, 6 - depth)
          },
          verbose: config.verbose,
        }),
        defensiveOne: new GomokuAiOne(
          board,
          turn as Turn,
          state.moveHistory,
          true,
        ),
      }[engine]

      ;(async () => {
        await pause(5)
        setState((state) => {
          let beginning = Date.now()
          // The remaining function returns 1 when 100% of the allocated time
          // is still available, and less than 0 when more than all the allocated
          // time has been used.
          const remaining = () => {
            let now = Date.now()
            return 1 + (beginning - now) / +config.maximumThinkingTime
          }

          let {
            gameover,
            moveArray,
            score: scoreValue,
          } = gomokuEngine
            .init({ board, turn, moveHistory: state.moveHistory })
            .getMove(remaining, beginning)

          score = scoreValue

          if (!gameover && moveArray.length > 0) {
            let { x, y } =
              moveArray[Math.floor(Math.random() * moveArray.length)]
            let moveHistory = [...state.moveHistory, { x, y }]
            return {
              ...state,
              moveHistory,
              importExportGame: exportGame(moveHistory),
            }
          }
          return state
        })
      })()
    }
  }, [state.versus, turn, state.engine, state.secondEngine, state.moveHistory])
  /** \/ play useEffect \/ */

  /** /\ auto scroll history */
  let historyBodyRef = useRef<HTMLTableElement>(null)
  let lastHistoryHalfLengthRef = useRef(state.moveHistory.length)
  useEffect(() => {
    let halfLength = Math.floor((state.moveHistory.length + 1) / 2)
    if (halfLength > lastHistoryHalfLengthRef.current) {
      historyBodyRef.current?.scrollTo(0, historyBodyRef.current.scrollHeight)
    }
    lastHistoryHalfLengthRef.current = halfLength
  }, [state.moveHistory.length])
  /** \/ auto scroll history */

  /** /\ handlers /\ */
  let handleEngineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setState((state) => ({ ...state, engine: event.target.value as Engine }))
  }
  let handleSecondEngineChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setState((state) => ({
      ...state,
      secondEngine: event.target.value as Engine,
    }))
  }
  let engineOptionArray: Record<Engine, string> = {
    defensiveOne: "Defensive one (easy)",
    basicOne: "One (normal)",
    pvsOne: "PVS-one (normal-hard)",
    basicTwo: "Two (very hard)",
    pvsTwo: "PVS-two (very very hard)",
  }

  let handleVersusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setState((state) => ({ ...state, versus: event.target.value as Versus }))
  }
  let versusOptionArray: Record<Versus, string> = {
    humanAi: "Human vs AI",
    aiHuman: "AI vs Human",
    humanHuman: "Human vs Human",
    aiAi: "AI vs AI",
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
    let moveHistory = state.moveHistory.slice(0, time)
    setState((state) => ({
      ...state,
      moveHistory,
      importExportGame: exportGame(moveHistory),
      importError: "",
    }))
  }
  let handlePlayAgain = () => {
    setState((state) => ({
      ...state,
      moveHistory: [],
      importExportGame: exportGame([]),
      importError: "",
    }))
  }
  let handlePlay = (position: Position) => () => {
    setState((state) => {
      let { x, y } = position
      let turn = ((state.moveHistory.length % 2) + 1) as Turn
      let validVersus =
        state.versus === "humanHuman" ||
        (state.versus === "humanAi" && turn === 1) ||
        (state.versus === "aiHuman" && turn === 2)
      if (!validVersus) {
        return state
      }
      if (state.moveHistory.some((move) => move.x === x && move.y === y)) {
        return state
      }
      let moveHistory = [...state.moveHistory, { x, y }]
      return {
        ...state,
        moveHistory,
        importExportGame: exportGame(moveHistory),
        importError: "",
      }
    })
  }
  /** \/ handlers \/ */

  return (
    <div className="field">
      <div className="general-info">
        <div className="info">
          <a className="no-link-decoration" href="/">
            <h1>Gomoku</h1>
          </a>
          <p style={{ maxWidth: "300px" }}>
            Fill a row, a column or a diagonal of five consecutive cross of your
            color to win.
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
            <select onChange={handleEngineChange} value={state.engine}>
              {Object.entries(engineOptionArray).map(([value, text]) => (
                <option {...{ value, key: value }}>{text}</option>
              ))}
            </select>
          </div>
          <div>
            Second Engine:{" "}
            <select
              onChange={handleSecondEngineChange}
              value={state.secondEngine}
            >
              <option value="same">
                Same (
                {engineOptionArray[state.engine].replace(/ ?\([^()]*\)/, "")})
              </option>
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
            <UrlExportButton
              propertyNameArray={"versus engine secondEngine dark".split(" ")}
              targetObject={state}
              text="Export config to URL"
            />
          </div>
          <div>
            <button
              disabled={state.moveHistory.length === 0}
              title={`Undo (${undoCount})`}
              onClick={() => {
                setState((state) => {
                  let moveHistory = state.moveHistory.slice(0, -undoCount)
                  return {
                    ...state,
                    moveHistory,
                    importExportGame: exportGame(moveHistory),
                  }
                })
              }}
            >
              Undo last move
            </button>
          </div>
          <div>
            <button
              disabled={state.versus !== "aiAi"}
              title={`Interrupt AI-AI computations whenever possible`}
              onClick={stop}
            >
              Stop
            </button>
          </div>
          {(gameover || moveArray.length === 0) && (
            <Modal className="game-status-modal">
              {!gameover ? (
                <>Equality was reached after {moveCount} moves</>
              ) : state.versus === "humanHuman" ? (
                <>
                  Player {<Cross value={(3 - turn) as Turn} textual />} won in{" "}
                  {moveCount} moves
                </>
              ) : state.versus === "aiAi" ? (
                <>
                  AI {<Cross value={(3 - turn) as Turn} textual />} won in{" "}
                  {moveCount} moves
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
            {gameover || moveArray.length === 0 ? (
              <button onClick={handlePlayAgain}>Play again</button>
            ) : null}
          </p>
          <p style={{ color: "red" }}>{state.importError}</p>
        </div>
        <div className="field">
          <div className="importExport">
            <div>
              <textarea
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
                    setState((state) => {
                      let moveHistory = importGame(state.importExportGame)
                      return {
                        ...state,
                        moveHistory,
                        importError: "",
                      }
                    })
                  } catch (e: any) {
                    setState((state) => ({
                      ...state,
                      importError: e.message,
                    }))
                  }
                }}
                disabled={
                  state.importExportGame === exportGame(state.moveHistory)
                }
              >
                Import game
              </button>
            </div>
            <div>
              <UrlExportButton
                propertyNameArray={["game"]}
                targetObject={{ game: state.moveHistory }}
                text="Export to URL"
                transform={{
                  game: (moveHistory) =>
                    exportGame(moveHistory)
                      .replace(/ /g, "_")
                      .replace(/\n/g, "+"),
                }}
              />
            </div>
          </div>
          <div className="historyContainer">
            <table className="history history-header">
              {historyColgroup}
              <thead>
                <tr>
                  <th>n°</th>
                  <th colSpan={4}>move</th>
                </tr>
              </thead>
            </table>
            <table className="history history-body" ref={historyBodyRef}>
              {historyColgroup}
              <tbody>
                {pairs(state.moveHistory).map(([a, b], k) => (
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
      </div>
      <table className="board">
        <thead>
          {/* <tr>
            <td colSpan={(board[0]?.length ?? 0) + 2} style={{ padding: "0" }}>
              <HorizontalScoreBar score={score} />
            </td>
          </tr> */}
          {horizontalHeader}
        </thead>
        <tbody>
          {board.map((row, y) => (
            <tr key={y}>
              <th>{y + 1}</th>
              {row.map((value, x) => {
                let lastPlay = state.moveHistory.slice(-1)[0] ?? {}
                return (
                  <td key={x}>
                    <Cross
                      onKeyDown={handleKeyDown}
                      onClick={({ x, y }) => handlePlay({ x, y })}
                      disabled={disableBoardCrosses}
                      className={
                        (lastPlay.x === x && lastPlay.y === y
                          ? "cross--highlight "
                          : "") +
                        (state.hover &&
                        state.hover.x === x &&
                        state.hover.y === y
                          ? "cross--hover "
                          : "")
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
  )
}
