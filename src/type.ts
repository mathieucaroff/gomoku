export type Turn = 1 | 2

export type Square = 0 | 1 | 2

export type Board = Square[][]

export interface Position {
  x: number
  y: number
}

export interface ClientPos {
  clientX: number
  clientY: number
}

export type Move = Position & { potential: number }

export type PotentialGrid = number[][][]

export type Engine =
  | "basicOne"
  | "basicTwo"
  | "pvsOne"
  | "pvsTwo"
  | "defensiveOne"

export type Versus = "humanAi" | "aiHuman" | "humanHuman" | "aiAi"

export interface ProcessBoardParameter {
  gameOverRef: { current: boolean }
  potentialGrid: PotentialGrid
  board: Board
  turn: Turn
}

export type ProcessBoardFunction = (param: ProcessBoardParameter) => void

export interface AiProcessingParameter extends ProcessBoardParameter {
  bestMoveArray: Position[]
}

export interface GomokuConfig {
  engine: Engine
  secondEngine: "same" | Engine
  versus: Versus
  timeout: number
  dark: boolean
  playerColors: string
  highlightColors: string
  game: string
}
