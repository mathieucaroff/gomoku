import { Position } from "./gomokuAi"

export function exportGame(playHistory: Position[]): string {
  return playHistory
    .map(({ x, y }, k) => {
      return `${(x + 10).toString(36).toUpperCase()}${y + 1}${
        k % 2 === 0 ? " " : "\n"
      }`
    })
    .join("")
}

export function importGame(gameDescription: string): Position[] {
  return gameDescription.split(/[\n ]/).map((line) => ({
    x: parseInt(line[0], 36) - 10,
    y: +line.slice(1) - 1,
  }))
}
