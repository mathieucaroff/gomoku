import { Position } from "./type"

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

export function compareStringProperty<T extends string>(propertyName: T) {
  type TT = { [property in T]: string }
  return (a: TT, b: TT) => a[propertyName].localeCompare(b[propertyName])
}

export function compareNumberProperty<T extends string>(propertyName: T) {
  type TT = { [property in T]: number }
  return (a: TT, b: TT) => a[propertyName] - b[propertyName]
}

export function readableScore(score: number): string {
  if (score === Infinity) {
    return "Inf"
  } else if (score === -Infinity) {
    return "-Inf"
  }
  let text = score.toExponential(1)
  text = text.replace(/^(-?)(\d)\.\d+e\+(\d+)$/, "$1e$3m$2")
  text = text.replace(/^(-?)(\d)\.\d+e-(\d+)$/, "=$1e$3m$2")
  return text.replace(/^(=?)e/, "$1+e")
}

export function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
