"use client"

import { useState, useEffect } from "react"

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
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    // Reset image error when image URL changes
    setImageError(false)
  }, [gameTitleImage])

  if (hideGameTitle) {
    return null
  }

  if (useImageAsTitle && gameTitleImage && !imageError) {
    return (
      <div className="relative w-full h-24 md:h-32">
        <img
          src={gameTitleImage}
          alt={gameName}
          className="object-contain w-auto h-full object-left"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  return (
    <h1 className="text-4xl md:text-5xl font-bold text-[#f8d64e] tracking-wider">
      {gameName}
    </h1>
  )
}
