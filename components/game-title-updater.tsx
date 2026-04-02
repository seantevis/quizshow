"use client"

import { useEffect } from "react"

interface GameTitleUpdaterProps {
  gameName: string
  gameTitleImage: string
  useImageAsTitle: boolean
  hideGameTitle: boolean
}

export default function GameTitleUpdater({
  gameName,
  gameTitleImage,
  useImageAsTitle,
  hideGameTitle,
}: GameTitleUpdaterProps) {
  useEffect(() => {
    // Update the game title in the DOM
    const titleContainer = document.getElementById("game-title")
    if (!titleContainer) return

    if (hideGameTitle) {
      // Hide the title completely
      titleContainer.innerHTML = ""
      titleContainer.style.display = "none"
    } else {
      // Show the title container
      titleContainer.style.display = "block"

      if (useImageAsTitle && gameTitleImage) {
        // Create image element
        titleContainer.innerHTML = `
          <div class="relative w-full h-24 md:h-32">
            <img 
              src="${gameTitleImage}" 
              alt="${gameName}" 
              class="object-contain w-auto h-full object-left"
              onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML='<h1 class=\'text-4xl md:text-5xl font-bold text-[#f8d64e] tracking-wider\'>${gameName}</h1>';"
            />
          </div>
        `
      } else {
        // Use text title
        titleContainer.innerHTML = `<h1 class="text-4xl md:text-5xl font-bold text-[#f8d64e] tracking-wider">${gameName}</h1>`
      }
    }
  }, [gameName, gameTitleImage, useImageAsTitle, hideGameTitle])

  // This component doesn't render anything
  return null
}
