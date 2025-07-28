"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import type { Player } from "./player-management"
import { useSound } from "@/contexts/sound-context"
import Image from "next/image"

interface QuestionOverlayProps {
  category: string
  value: number
  question: string
  answer: string
  imageUrl?: string
  onClose: () => void
  players: Player[]
  activePlayer: string | null
  updateScore: (playerId: string, points: number) => void
  isDailyDouble?: boolean
}

export default function QuestionOverlay({
  category,
  value,
  question,
  answer,
  imageUrl,
  onClose,
  players,
  activePlayer,
  updateScore,
  isDailyDouble = false,
}: QuestionOverlayProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [answerStatus, setAnswerStatus] = useState<"correct" | "incorrect" | null>(null)
  const [imageError, setImageError] = useState(false)
  const { playSound, stopSound } = useSound()

  const activePlayerName = activePlayer
    ? players.find((p) => p.id === activePlayer)?.name || "Unknown Player"
    : "No player selected"

  // Play think music when the question is displayed
  useEffect(() => {
    try {
      playSound("thinkMusic")
    } catch (error) {
      // Continue even if sound fails
    }

    return () => {
      try {
        stopSound("thinkMusic")
      } catch (error) {
        // Continue even if sound fails
      }
    }
  }, [playSound, stopSound])

  const handleRevealAnswer = () => {
    // Stop think music and play reveal sound
    try {
      stopSound("thinkMusic")
      playSound("reveal")
    } catch (error) {
      // Continue even if sound fails
    }
    setShowAnswer(true)
  }

  const handleCorrectAnswer = () => {
    if (activePlayer) {
      try {
        playSound("correct")
      } catch (error) {
        // Continue even if sound fails
      }
      updateScore(activePlayer, value)
      setAnswerStatus("correct")
    }
  }

  const handleIncorrectAnswer = () => {
    if (activePlayer) {
      try {
        playSound("incorrect")
      } catch (error) {
        // Continue even if sound fails
      }
      updateScore(activePlayer, -value)
      setAnswerStatus("incorrect")
    }
  }

  const handleClose = () => {
    try {
      stopSound("thinkMusic")
    } catch (error) {
      // Continue even if sound fails
    }
    onClose()
  }

  const handleImageError = () => {
    console.error("Image failed to load:", imageUrl)
    setImageError(true)
  }

  // Check if the image URL is valid and not empty
  const hasValidImage = imageUrl && imageUrl.trim() !== "" && !imageError

  return (
    <div className="fixed inset-0 bg-[#00236A]/95 flex flex-col items-center justify-center p-4 z-50">
      <div className="w-full max-w-4xl text-center">
        <div className="mb-6">
          <h3 className="text-2xl text-[#f8d64e] font-bold">
            {category} - {isDailyDouble ? "Daily Double" : `${value} points`}
          </h3>
          {activePlayer && (
            <p className="text-white mt-2">
              Current player: <span className="font-bold text-[#f8d64e]">{activePlayerName}</span>
              {isDailyDouble && <span className="ml-2">| Wager: {value} points</span>}
            </p>
          )}
        </div>

        <div className="bg-[#005AF2] border-2 border-[#0046c9] p-8 mb-8 rounded-lg shadow-lg">
          <p className="text-2xl md:text-3xl lg:text-4xl text-white font-medium mb-6">{question}</p>

          {/* Only show image if there's a valid URL */}
          {hasValidImage && (
            <div className="flex justify-center">
              <div className="relative w-full max-w-lg h-64 md:h-80">
                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt="Question image"
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-lg"
                  onError={handleImageError}
                />
              </div>
            </div>
          )}
        </div>

        {showAnswer ? (
          <>
            <div className="bg-[#005AF2] border-2 border-[#0046c9] p-8 mb-8 rounded-lg shadow-lg">
              <p className="text-2xl md:text-3xl lg:text-4xl text-[#f8d64e] font-bold">{answer}</p>
            </div>

            {answerStatus === null && activePlayer && (
              <div className="flex justify-center gap-4 mb-8">
                <Button
                  onClick={handleCorrectAnswer}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl px-8 py-6 flex items-center rounded-lg"
                >
                  <CheckCircle className="mr-2" /> Correct (+{value})
                </Button>
                <Button
                  onClick={handleIncorrectAnswer}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-8 py-6 flex items-center rounded-lg"
                >
                  <XCircle className="mr-2" /> Incorrect (-{value})
                </Button>
              </div>
            )}

            {answerStatus && (
              <div
                className={`mb-8 text-xl font-bold ${answerStatus === "correct" ? "text-green-500" : "text-red-500"}`}
              >
                {answerStatus === "correct"
                  ? `Correct! ${activePlayerName} earned ${value} points`
                  : `Incorrect! ${activePlayerName} lost ${value} points`}
              </div>
            )}
          </>
        ) : (
          <Button
            onClick={handleRevealAnswer}
            className="bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold text-xl px-8 py-6 mb-8 rounded-lg"
          >
            Reveal Answer
          </Button>
        )}

        <Button
          onClick={handleClose}
          className="bg-[#005AF2] hover:bg-[#0046c9] text-white font-bold text-xl px-8 py-6 rounded-lg"
        >
          Return to Board
        </Button>
      </div>
    </div>
  )
}
