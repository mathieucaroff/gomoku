import {
  Board,
  GetMoveOutput,
  GomokuBasicEngine,
  GomokuInitProp,
  Position,
  PotentialGrid,
  Turn,
} from "../type"

export class GomokuAiOne implements GomokuBasicEngine {
  private potentialGrid: PotentialGrid = []
  private gameoverRef = { current: false }
  private bestMoveArray: Position[] = []

  constructor(
    protected board: Board,
    protected turn: Turn,
    private moveHistory: Position[],
    private defensive = false,
  ) {
    this.init({ moveHistory, turn })
  }

  public init(prop: GomokuInitProp) {
    this.moveHistory = prop.moveHistory
    this.turn = this.defensive ? ((3 - prop.turn) as Turn) : prop.turn
    this.board = prop.board ?? this.board
    this.potentialGrid = prop.potentialGrid ?? this.newPotentialGrid()
    this.gameoverRef = prop.gameoverRef ?? { current: false }
    this.bestMoveArray = prop.bestMoveArray ?? []
    return this
  }

  private newPotentialGrid() {
    // start from a grid of zeros
    return this.board.map((row) =>
      row.map(() => Array.from({ length: 9 }, () => 0)),
    )
  }

  private processLineOfFive(x: number, y: number, dx: number, dy: number) {
    // determine the priority, between 0 and 8
    let color = 0 // The color of the current line, if any
    let counter = 0 // The number of stones in the current line
    for (let k = 0; k < 5; k++) {
      let c = this.board[y + dy * k][x + dx * k]
      if (c > 0) {
        if (color > 0) {
          if (c !== color) {
            return
          }
          counter += 1
        } else {
          color = c
          counter += 1
        }
      }
    }
    if (counter === 5) {
      this.gameoverRef.current = true
      return
    }

    let priority = counter > 0 ? 2 * counter + +(color === this.turn) : 1

    // increase the potential of each of the five positions
    for (let k = 0; k < 5; k++) {
      // (9 - priority) is used to store the best priority first
      // and worst priority last
      this.potentialGrid[y + dy * k][x + dx * k][9 - priority] += 1
    }
  }

  /**
   *
   * @param board the state of the board to evaluate
   * @param gameoverRef a reference to indicate that a line of five has been
   *          found in the game
   * @param turn whose player it is the turn of
   * @returns the potential grid. It associates a potential to each position
   *          of the grid. A potential is an array of ten priorities. For each
   *          index of that array, the associated priority is the number of
   *          lines containing a certain number of token from a single player.
   *          Said number of token is in relation with the index that the priority
   *          occupies in the array.
   */
  processBoard() {
    // go through horizontals
    for (let y = 0, c = this.board.length; y < c; y++) {
      for (let x = 0, d = this.board[y].length - 4; x < d; x++) {
        this.processLineOfFive(x, y, 1, 0)
      }
    }
    // go through verticals
    for (let y = 0, c = this.board.length - 4; y < c; y++) {
      for (let x = 0, d = this.board[y].length; x < d; x++) {
        this.processLineOfFive(x, y, 0, 1)
      }
    }
    // go through diagonals down-right
    for (let y = 0, c = this.board.length - 4; y < c; y++) {
      for (let x = 0, d = this.board[y].length - 4; x < d; x++) {
        this.processLineOfFive(x, y, 1, 1)
      }
    }
    // go through diagonals down-left
    for (let y = 0, c = this.board.length - 4; y < c; y++) {
      for (let x = 4, d = this.board[y].length; x < d; x++) {
        this.processLineOfFive(x, y, -1, 1)
      }
    }

    return this
  }

  aiProcessing() {
    // compute the potential grid
    this.processBoard()

    // extract the best position(s) and return one
    let bestPotential = "0".repeat(10)
    for (let y = 0, c = this.potentialGrid.length; y < c; y++) {
      for (let x = 0, d = this.potentialGrid[y].length; x < d; x++) {
        if (this.board[y][x] !== 0) {
          continue
        }
        let potential = this.potentialGrid[y][x]
          .map((x) => x.toString(36))
          .join("")
        if (bestPotential <= potential) {
          if (bestPotential < potential) {
            bestPotential = potential
            this.bestMoveArray.splice(0, this.bestMoveArray.length)
          }
          this.bestMoveArray.push({ x, y })
        }
      }
    }

    return this
  }

  getMove(): GetMoveOutput {
    if (this.moveHistory.length === 0) {
      return {
        gameover: false,
        moveArray: Array.from({ length: 25 }, (_, k) => ({
          x: 7 + (k % 5),
          y: 7 + Math.floor(k / 5),
        })),
      }
    }

    this.aiProcessing()

    if (this.gameoverRef.current) {
      return {
        gameover: true,
        moveArray: [],
      }
    }

    return {
      gameover: false,
      moveArray: this.bestMoveArray,
    }
  }

  get() {
    return {
      gameoverRef: this.gameoverRef,
      bestMoveArray: this.bestMoveArray,
      potentialGrid: this.potentialGrid,
    }
  }
}
