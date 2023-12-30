export type Turn = 1 | 2

export type Square = 0 | 1 | 2

export type Board = Square[][]

export interface Position {
  x: number
  y: number
}

export type Move = Position & { potential: number }

export type PotentialGrid = number[][][]

export type Engine = "one" | "pvs"

export type Versus =
  | "humanAi"
  | "aiHuman"
  | "humanHuman"
  | "aiAi"
  | "onePvs"
  | "pvsOne"

export interface GomokuConfig {
  defensive: boolean
  engine: Engine
  versus: Versus
  timeout: number | null
  aiOneTimeout: number
  aiPvsTimeout: number
  dark: boolean
  playerColors: string
  highlightColors: string
  game: string
}
