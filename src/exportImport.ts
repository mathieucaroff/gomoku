import { Position } from "./gomokuAi"
import { positionToString } from "./utils"

export function exportGame(playHistory: Position[]): string {
  return playHistory
    .map((a, k) => {
      return positionToString(a) + (k % 2 === 0 ? " " : "\n")
    })
    .join("")
}

export function importGame(gameDescription: string): Position[] {
  return gameDescription.split(/[\n ]/).map((line) => ({
    x: parseInt(line[0], 36) - 10,
    y: +line.slice(1) - 1,
  }))
}
