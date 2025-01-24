import { default as React } from "react"
import "./HorizontalScoreBar.css"

export interface HorizontalScoreBarProps {
  score: number
}

export function HorizontalScoreBar(prop: HorizontalScoreBarProps) {
  let { score } = prop
  if (window.isNaN(score)) {
    return <></>
  }

  return (
    <div className="horizontalScoreBar">
      <div
        className="black"
        style={{ width: `calc(${(score + 1) * 0.5} * 100%)` }}
      ></div>
      <div className="white"></div>
    </div>
  )
}
