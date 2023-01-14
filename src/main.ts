import * as React from "react"
import { createRoot } from "react-dom/client"
import * as packageInfo from "../package.json"
import { Game } from "./game"
import { githubCornerHTML } from "./lib/githubCorner"

let cornerDiv = document.createElement("div")
cornerDiv.innerHTML = githubCornerHTML(
  packageInfo.repository.url,
  packageInfo.version,
)
document.body.appendChild(cornerDiv)

let root = createRoot(document.getElementById("root"))
root.render(React.createElement(Game))
