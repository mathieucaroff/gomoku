import { Position } from "./gomokuAi"

export function pairs<T>(array: T[]): [T, T][] {
  let result: [T, T][] = []
  array.forEach((v, k) => {
    if (k % 2 === 0) {
      result.push([v] as any)
    } else {
      result[(k - 1) / 2].push(v)
    }
  })
  return result
}

export function positionToString({ x, y }: Position) {
  return (x + 10).toString(36).toUpperCase() + (y + 1)
}
