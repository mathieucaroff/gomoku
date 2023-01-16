import * as React from "react"
import { createRoot } from "react-dom/client"
import * as packageInfo from "../package.json"
import { Game } from "./game"
import { githubCornerHTML } from "./lib/githubCorner"
import { createStyleSheet } from "./lib/styleSheet"
import { ensureSpacelessURL, resolveSearch } from "./lib/urlParameter"

import "./style.css"

export type Versus = "humanAi" | "aiHuman" | "humanHuman" | "aiAi"

export interface GomokuConfig {
  defensive: boolean
  versus: Versus
  timeout: number
  dark: boolean
  playerColors: string
  highlightColor: string
  game: string
}

function getConfig(location: Location) {
  let config = resolveSearch<GomokuConfig>(location, {
    defensive: () => false,
    versus: () => "humanAi" as Versus,
    timeout: () => 500,
    dark: () => false,
    playerColors: () => "",
    highlightColor: () => "",
    game: () => "",
  })
  return config
}

function main() {
  ensureSpacelessURL(location)

  let cornerDiv = document.createElement("div")
  cornerDiv.innerHTML = githubCornerHTML(
    packageInfo.repository.url,
    packageInfo.version,
  )
  document.body.appendChild(cornerDiv)

  let root = createRoot(document.getElementById("root"))
  let config = getConfig(location)
  console.log(config)

  let styleSheet = createStyleSheet(document)
  styleSheet.insertRule(":root {}")
  root.render(React.createElement(Game, { config, styleSheet }))
}
main()
