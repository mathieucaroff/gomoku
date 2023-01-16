import * as React from "react"
import { Position } from "../../type"

export type ButtonProp = {
  position?: { x: number; y: number }
  value: 0 | 1 | 2
  onClick?: (position: Position) => () => void
  onKeyDown?: (
    position: Position,
  ) => (event: React.KeyboardEvent<HTMLButtonElement>) => void
  disabled?: boolean
  className?: string
}

export function Square(props: ButtonProp) {
  let { className, position, value, disabled, onClick, onKeyDown } = props
  return (
    <button
      disabled={disabled}
      className={`square square--${value} ${className ?? ""}`}
      onClick={position && onClick?.(position)}
      onKeyDown={position && onKeyDown?.(position)}
    >
      {["", "X", "O"][value]}
    </button>
  )
}
