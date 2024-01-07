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

export interface GomokuEngine {
  getMove(
    moveHistory: Position[],
    shouldStop: (param: { moveCount: number }) => boolean,
  ): Position[] | "gameover"
}

export interface GomokuBasicEngine extends GomokuEngine {
  processBoard(): PotentialGrid
  aiProcessing(): Position[]
  newPotentialGrid(): PotentialGrid
}

export interface GomokuConsturctor<TEngine extends GomokuEngine> {
  new (
    board: Board,
    turn: Turn,
    gameOverRef?: { current: boolean },
    bestMoveArray?: Position[],
    potentialGrid?: PotentialGrid,
  ): TEngine
}

export interface GomokuConfig {
  engine: Engine
  secondEngine: "same" | Engine
  versus: Versus
  timeout: number
  maximumThinkingTime: number
  dark: boolean
  playerColors: string
  highlightColors: string
  game: string
}
