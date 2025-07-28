"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Check, X, Clock } from "lucide-react"
import type { Player } from "./player-management"
import { useSound } from "@/contexts/sound-context"
import Image from "next/image"

interface FinalJeopardyProps {
  finalJeopardy: {
    category: string
    question: string
    answer: string
    imageUrl?: string
  }
  players: Player[]
  updateScore: (playerId: string, points: number) => void
  onComplete: () => void
}

export default function FinalJeopardy({ finalJeopardy, players, updateScore, onComplete }: FinalJeopardyProps) {
  const [stage, setStage] = useState<"category" | "wager" | "question" | "answer" | "results">("category")
  const [wagers, setWagers] = useState<Record<string, number>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, boolean>>({})
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerActive, setTimerActive] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { playSound, stopSound } = useSound()

  // Initialize wagers and answers
  useEffect(() => {
    const initialWagers: Record<string, number> = {}
    const initialAnswers: Record<string, string> = {}
    const initialCorrectAnswers: Record<string, boolean> = {}

    players.forEach((player) => {
      initialWagers[player.id] = 0
      initialAnswers[player.id] = ""
      initialCorrectAnswers[player.id] = false
    })

    setWagers(initialWagers)
    setAnswers(initialAnswers)
    setCorrectAnswers(initialCorrectAnswers)
  }, [players])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false)
      if (stage === "question") {
        setStage("answer")
        try {
          stopSound("thinkMusic")
        } catch (error) {
          // Continue even if sound fails
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, timeLeft, stage, stopSound])

  // Play think music during question stage
  useEffect(() => {
    if (stage === "question") {
      try {
        playSound("thinkMusic")
      } catch (error) {
        // Continue even if sound fails
      }
    }

    return () => {
      try {
        stopSound("thinkMusic")
      } catch (error) {
        // Continue even if sound fails
      }
    }
  }, [stage, playSound, stopSound])

  const handleWagerChange = (playerId: string, value: string) => {
    const numValue = Number.parseInt(value, 10) || 0
    setWagers((prev) => ({
      ...prev,
      [playerId]: numValue,
    }))
  }

  const handleAnswerChange = (playerId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [playerId]: value,
    }))
  }

  const validateWagers = () => {
    let valid = true
    const errors: Record<string, string> = {}

    players.forEach((player) => {
      const wager = wagers[player.id] || 0
      if (wager < 0) {
        valid = false
        errors[player.id] = "Wager cannot be negative"
      } else if (player.score >= 0 && wager > player.score) {
        // Only apply this rule if player has a positive score
        valid = false
        errors[player.id] = `Wager cannot exceed current score (${player.score})`
      }
    })

    return { valid, errors }
  }

  const handleProceedToQuestion = () => {
    const { valid } = validateWagers()
    if (!valid) return

    setStage("question")
    setTimeLeft(30)
    setTimerActive(true)
  }

  const handleMarkAnswer = (playerId: string, isCorrect: boolean) => {
    setCorrectAnswers((prev) => ({
      ...prev,
      [playerId]: isCorrect,
    }))
  }

  const handleFinalizeScores = () => {
    // Update scores based on wagers and correct answers
    players.forEach((player) => {
      const wager = wagers[player.id] || 0
      const isCorrect = correctAnswers[player.id] || false

      if (isCorrect) {
        updateScore(player.id, wager)
      } else {
        updateScore(player.id, -wager)
      }
    })

    // Move to results stage
    setStage("results")
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // Check if the image URL is valid and not empty
  const hasValidImage = finalJeopardy.imageUrl && finalJeopardy.imageUrl.trim() !== "" && !imageError

  const renderCategoryStage = () => (
    <div className="text-center">
      <h2 className="text-4xl md:text-5xl font-bold text-[#f8d64e] mb-8 animate-pulse">FINAL JEOPARDY!</h2>
      <div className="bg-[#005AF2] border-2 border-[#0046c9] p-8 mb-8 rounded-lg shadow-lg">
        <h3 className="text-3xl text-white font-bold mb-2">Category:</h3>
        <p className="text-4xl text-[#f8d64e] font-bold">{finalJeopardy.category}</p>
      </div>
      <Button
        onClick={() => setStage("wager")}
        className="bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold text-xl px-8 py-6 rounded-lg"
      >
        Continue to Wagers
      </Button>
    </div>
  )

  const renderWagerStage = () => (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-[#f8d64e] mb-6">Final Jeopardy Wagers</h2>
      <p className="text-xl text-white mb-6">
        Category: <span className="font-bold">{finalJeopardy.category}</span>
      </p>

      <div className="bg-[#005AF2] border-2 border-[#0046c9] p-6 mb-8 rounded-lg shadow-lg">
        <h3 className="text-xl text-white font-bold mb-4">Enter your wagers:</h3>

        <div className="space-y-4 max-h-80 overflow-y-auto">
          {players.map((player) => (
            <div key={player.id} className="bg-[#0046c9] p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">{player.name}</span>
                <span className="text-[#f8d64e]">Current Score: {player.score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max={player.score > 0 ? player.score : 1000}
                  value={wagers[player.id] || ""}
                  onChange={(e) => handleWagerChange(player.id, e.target.value)}
                  className="bg-[#00236A] border-[#00236A] text-white text-xl text-center py-4"
                  placeholder="Enter wager"
                />
                {player.score >= 0 && wagers[player.id] > player.score && (
                  <div className="text-red-500 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    <span className="text-sm">Max: {player.score}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={handleProceedToQuestion}
        className="bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold text-xl px-8 py-6 rounded-lg"
      >
        Reveal Question
      </Button>
    </div>
  )

  const renderQuestionStage = () => (
    <div className="text-center">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-[#f8d64e]">Final Jeopardy</h2>
        <div className="flex items-center bg-[#005AF2] px-4 py-2 rounded-lg">
          <Clock size={20} className="text-white mr-2" />
          <span className="text-white font-bold">{timeLeft} seconds</span>
        </div>
      </div>

      <div className="bg-[#005AF2] border-2 border-[#0046c9] p-8 mb-8 rounded-lg shadow-lg">
        <h3 className="text-xl text-white mb-2">Category: {finalJeopardy.category}</h3>
        <p className="text-2xl md:text-3xl text-white font-medium mb-6">{finalJeopardy.question}</p>

        {/* Only show image if there's a valid URL */}
        {hasValidImage && (
          <div className="flex justify-center">
            <div className="relative w-full max-w-lg h-64 md:h-80">
              <Image
                src={finalJeopardy.imageUrl || "/placeholder.svg"}
                alt="Final Jeopardy image"
                fill
                style={{ objectFit: "contain" }}
                className="rounded-lg"
                onError={handleImageError}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {players.map((player) => (
          <div key={player.id} className="bg-[#0046c9] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-bold">{player.name}</span>
              <span className="text-[#f8d64e]">Wager: {wagers[player.id] || 0}</span>
            </div>
            <Input
              type="text"
              value={answers[player.id] || ""}
              onChange={(e) => handleAnswerChange(player.id, e.target.value)}
              className="bg-[#00236A] border-[#00236A] text-white"
              placeholder="Enter answer"
            />
          </div>
        ))}
      </div>

      <Button
        onClick={() => {
          setStage("answer")
          setTimerActive(false)
          try {
            stopSound("thinkMusic")
          } catch (error) {
            // Continue even if sound fails
          }
        }}
        className="bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold text-xl px-8 py-6 mt-6 rounded-lg"
      >
        Reveal Answer
      </Button>
    </div>
  )

  const renderAnswerStage = () => (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-[#f8d64e] mb-6">Final Jeopardy Answer</h2>

      <div className="bg-[#005AF2] border-2 border-[#0046c9] p-8 mb-8 rounded-lg shadow-lg">
        <h3 className="text-xl text-white mb-2">Category: {finalJeopardy.category}</h3>
        <p className="text-2xl text-white mb-4">Question: {finalJeopardy.question}</p>
        <p className="text-3xl text-[#f8d64e] font-bold">Answer: {finalJeopardy.answer}</p>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto mb-8">
        {players.map((player) => (
          <div key={player.id} className="bg-[#0046c9] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-bold">{player.name}</span>
              <span className="text-[#f8d64e]">Wager: {wagers[player.id] || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white">Answer: {answers[player.id] || "No answer provided"}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleMarkAnswer(player.id, true)}
                  className={`${
                    correctAnswers[player.id] === true ? "bg-green-600" : "bg-gray-600"
                  } hover:bg-green-700 text-white`}
                >
                  <Check size={18} />
                </Button>
                <Button
                  onClick={() => handleMarkAnswer(player.id, false)}
                  className={`${
                    correctAnswers[player.id] === false ? "bg-red-600" : "bg-gray-600"
                  } hover:bg-red-700 text-white`}
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleFinalizeScores}
        className="bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold text-xl px-8 py-6 rounded-lg"
      >
        Finalize Scores
      </Button>
    </div>
  )

  const renderResultsStage = () => (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-[#f8d64e] mb-8">Final Results</h2>

      <div className="bg-[#005AF2] border-2 border-[#0046c9] p-8 mb-8 rounded-lg shadow-lg">
        <h3 className="text-2xl text-white mb-6">Final Scores</h3>

        <div className="space-y-4">
          {/* Sort players by score in descending order */}
          {[...players]
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div
                key={player.id}
                className={`flex justify-between items-center p-4 rounded-lg ${
                  index === 0 ? "bg-[#f8d64e] text-[#00236A]" : "bg-[#0046c9] text-white"
                }`}
              >
                <div className="flex items-center">
                  {index === 0 && <span className="text-2xl mr-2">👑</span>}
                  <span className={`font-bold text-xl ${index === 0 ? "text-[#00236A]" : "text-white"}`}>
                    {player.name}
                  </span>
                </div>
                <span className={`text-2xl font-bold ${index === 0 ? "text-[#00236A]" : "text-[#f8d64e]"}`}>
                  {player.score}
                </span>
              </div>
            ))}
        </div>
      </div>

      <Button
        onClick={onComplete}
        className="bg-[#005AF2] hover:bg-[#0046c9] text-white font-bold text-xl px-8 py-6 rounded-lg"
      >
        Return to Game Board
      </Button>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-[#00236A]/95 flex flex-col items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-4xl">
        {stage === "category" && renderCategoryStage()}
        {stage === "wager" && renderWagerStage()}
        {stage === "question" && renderQuestionStage()}
        {stage === "answer" && renderAnswerStage()}
        {stage === "results" && renderResultsStage()}
      </div>
    </div>
  )
}
