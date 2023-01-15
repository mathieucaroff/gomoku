import { Position } from "./type"
import { positionToString } from "./utils"

export function isValidCoordinate(n: number) {
  return 0 <= n && n < 19
}

export function exportGame(playHistory: Position[]): string {
  return playHistory
    .map((a, k) => {
      return positionToString(a) + (k % 2 === 0 ? " " : "\n")
    })
    .join("")
}

export function importGame(gameDescription: string): Position[] {
  return gameDescription
    .trim()
    .split(/[\n ]/)
    .map((line, k) => {
      let x = parseInt(line[0], 36) - 10
      let y = +line.slice(1) - 1
      if (!isValidCoordinate(x) || !isValidCoordinate(y)) {
        throw new Error(`Failed to parse line ${k + 1}: "${line}"`)
      }
      return { x, y }
    })
}
