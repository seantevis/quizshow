"use client"

import { useState, useEffect } from "react"
import { gameData, finalJeopardyData } from "@/data/game-data"
import QuestionOverlay from "./question-overlay"
import DailyDoubleOverlay from "./daily-double-overlay"
import FinalJeopardy from "./final-jeopardy"
import SettingsMenu from "./settings-menu"
import PlayerScoreboard from "./player-scoreboard"
import GameTitleUpdater from "./game-title-updater"
import type { Player } from "./player-management"
import { useSound } from "@/contexts/sound-context"
import { Button } from "@/components/ui/button"

export default function GameBoard({
  customCategories,
  customFinalJeopardy,
}: {
  customCategories?: typeof gameData
  customFinalJeopardy?: typeof finalJeopardyData
}) {
  const [selectedQuestion, setSelectedQuestion] = useState<{
    category: string
    value: number
    question: string
    answer: string
    imageUrl?: string
    isDailyDouble?: boolean
  } | null>(null)

  const [dailyDoubleData, setDailyDoubleData] = useState<{
    category: string
    value: number
    question: string
    answer: string
    imageUrl?: string
    wager: number
  } | null>(null)

  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())
  const [players, setPlayers] = useState<Player[]>([])
  const [activePlayer, setActivePlayer] = useState<string | null>(null)
  const [gameName, setGameName] = useState<string>("Questions!")
  const [gameTitleImage, setGameTitleImage] = useState<string>("")
  const [useImageAsTitle, setUseImageAsTitle] = useState<boolean>(false)
  const [hideGameTitle, setHideGameTitle] = useState<boolean>(false)
  const [showFinalJeopardy, setShowFinalJeopardy] = useState<boolean>(false)
  const [finalJeopardyCompleted, setFinalJeopardyCompleted] = useState<boolean>(false)
  const { playSound, stopAllSounds } = useSound()

  // Use custom categories if provided, otherwise use default gameData
  const categories = customCategories || gameData
  const finalJeopardy = customFinalJeopardy || finalJeopardyData

  // Load game settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedGameName = localStorage.getItem("walpeordy-game-name")
      if (savedGameName) {
        setGameName(savedGameName)
      }

      const savedGameTitleImage = localStorage.getItem("walpeordy-game-title-image")
      if (savedGameTitleImage) {
        setGameTitleImage(savedGameTitleImage)
      }

      const savedUseImageAsTitle = localStorage.getItem("walpeordy-use-image-as-title")
      if (savedUseImageAsTitle) {
        setUseImageAsTitle(savedUseImageAsTitle === "true")
      }

      const savedHideGameTitle = localStorage.getItem("walpeordy-hide-game-title")
      if (savedHideGameTitle) {
        setHideGameTitle(savedHideGameTitle === "true")
      }
    } catch (error) {
      console.warn("Could not access localStorage for game settings")
    }
  }, [])

  // Play board fill sound when the component mounts
  useEffect(() => {
    // Try to play the board fill sound, but don't worry if it fails
    try {
      playSound("boardFill")
    } catch (error) {
      // Silently continue if sound fails
    }

    // Clean up sounds when component unmounts
    return () => {
      try {
        stopAllSounds()
      } catch (error) {
        // Silently continue if cleanup fails
      }
    }
  }, [playSound, stopAllSounds])

  const handleQuestionClick = (category: string, value: number) => {
    const categoryData = categories.find((cat) => cat.category === category)
    if (!categoryData) return

    const questionData = categoryData.questions.find((q) => q.value === value)
    if (!questionData) return

    // Check if it's a Daily Double
    if (questionData.isDailyDouble) {
      // Play selection sound
      try {
        playSound("select")
      } catch (error) {
        // Continue even if sound fails
      }

      // Show Daily Double overlay
      setSelectedQuestion({
        category,
        value,
        question: questionData.question,
        answer: questionData.answer,
        imageUrl: questionData.imageUrl,
        isDailyDouble: true,
      })
    } else {
      // Regular question
      // Play selection sound
      try {
        playSound("select")
      } catch (error) {
        // Continue even if sound fails
      }

      setSelectedQuestion({
        category,
        value,
        question: questionData.question,
        answer: questionData.answer,
        imageUrl: questionData.imageUrl,
      })
    }
  }

  const handleDailyDoubleWager = (wager: number) => {
    if (!selectedQuestion) return

    setDailyDoubleData({
      category: selectedQuestion.category,
      value: selectedQuestion.value,
      question: selectedQuestion.question,
      answer: selectedQuestion.answer,
      imageUrl: selectedQuestion.imageUrl,
      wager,
    })

    // Clear selected question to close the Daily Double overlay
    setSelectedQuestion(null)
  }

  const handleCancelDailyDouble = () => {
    setSelectedQuestion(null)
  }

  const handleCloseOverlay = () => {
    if (selectedQuestion) {
      setAnsweredQuestions((prev) => {
        const newSet = new Set(prev)
        newSet.add(`${selectedQuestion.category}-${selectedQuestion.value}`)
        return newSet
      })
    }

    if (dailyDoubleData) {
      setAnsweredQuestions((prev) => {
        const newSet = new Set(prev)
        newSet.add(`${dailyDoubleData.category}-${dailyDoubleData.value}`)
        return newSet
      })
      setDailyDoubleData(null)
    }

    setSelectedQuestion(null)
  }

  const updateScore = (playerId: string, points: number) => {
    setPlayers((prev) =>
      prev.map((player) => (player.id === playerId ? { ...player, score: player.score + points } : player)),
    )
  }

  const getActivePlayerObject = () => {
    if (!activePlayer) return null
    return players.find((p) => p.id === activePlayer) || null
  }

  // Check if all questions have been answered
  const allQuestionsAnswered = categories.every((category) =>
    category.questions.every((question) => answeredQuestions.has(`${category.category}-${question.value}`)),
  )

  // Calculate total number of questions and answered questions
  const totalQuestions = categories.reduce((total, category) => total + category.questions.length, 0)
  const answeredCount = answeredQuestions.size

  const handleStartFinalJeopardy = () => {
    setShowFinalJeopardy(true)
  }

  const handleFinalJeopardyComplete = () => {
    setShowFinalJeopardy(false)
    setFinalJeopardyCompleted(true)
  }

  return (
    <>
      <GameTitleUpdater
        gameName={gameName}
        gameTitleImage={gameTitleImage}
        useImageAsTitle={useImageAsTitle}
        hideGameTitle={hideGameTitle}
      />

      <SettingsMenu
        players={players}
        setPlayers={setPlayers}
        activePlayer={activePlayer}
        setActivePlayer={setActivePlayer}
        answeredQuestions={answeredQuestions}
        setAnsweredQuestions={setAnsweredQuestions}
        customCategories={customCategories}
        gameName={gameName}
        setGameName={setGameName}
        gameTitleImage={gameTitleImage}
        setGameTitleImage={setGameTitleImage}
        useImageAsTitle={useImageAsTitle}
        setUseImageAsTitle={setUseImageAsTitle}
        hideGameTitle={hideGameTitle}
        setHideGameTitle={setHideGameTitle}
      />

      {/* Header row with game title and player scoreboard */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex-1 text-center md:text-left">{/* Game title is rendered here by GameTitleUpdater */}</div>
        <PlayerScoreboard players={players} activePlayer={activePlayer} setActivePlayer={setActivePlayer} />
      </div>

      <div className="w-full max-w-7xl">
        {/* Progress bar showing answered questions */}
        {totalQuestions > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-white mb-1">
              <span>
                Questions: {answeredCount} / {totalQuestions}
              </span>
              <span>{Math.round((answeredCount / totalQuestions) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-[#005AF2] rounded-full h-2.5">
              <div
                className="bg-[#f8d64e] h-2.5 rounded-full"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Final Jeopardy Button */}
        {allQuestionsAnswered && !showFinalJeopardy && !finalJeopardyCompleted && players.length > 0 && (
          <div className="mb-6 p-4 bg-[#f8d64e] rounded-lg text-center">
            <h2 className="text-2xl font-bold text-[#00236A] mb-4">All questions completed!</h2>
            <Button
              onClick={handleStartFinalJeopardy}
              className="bg-[#00236A] hover:bg-[#005AF2] text-white font-bold text-xl px-8 py-6"
            >
              Start Final Jeopardy
            </Button>
          </div>
        )}

        <div className="grid grid-cols-7 gap-3">
          {/* Category Headers */}
          {categories.map((category) => (
            <div
              key={category.category}
              className="bg-[#005AF2] p-3 text-center text-white font-bold border-2 border-[#005AF2] h-24 flex items-center justify-center rounded-lg shadow-lg"
            >
              <h2 className="text-sm md:text-base lg:text-lg uppercase tracking-wider">{category.category}</h2>
            </div>
          ))}

          {/* Question Values */}
          {[100, 200, 300, 400, 500].map((value) =>
            categories.map((category) => {
              const questionId = `${category.category}-${value}`
              const isAnswered = answeredQuestions.has(questionId)

              return (
                <button
                  key={`${category.category}-${value}`}
                  className={`${
                    isAnswered
                      ? "bg-[#00236A] text-[#00236A] border-[#005AF2]"
                      : "bg-[#005AF2] text-[#f8d64e] hover:bg-[#0046c9] border-[#0046c9]"
                  } p-2 text-center font-bold border-2 h-20 flex items-center justify-center transition-colors rounded-lg shadow-lg`}
                  onClick={() => !isAnswered && handleQuestionClick(category.category, value)}
                  disabled={isAnswered}
                >
                  <span className="text-2xl md:text-3xl lg:text-4xl">{isAnswered ? "" : value}</span>
                </button>
              )
            }),
          )}
        </div>

        {selectedQuestion?.isDailyDouble && (
          <DailyDoubleOverlay
            category={selectedQuestion.category}
            value={selectedQuestion.value}
            activePlayer={getActivePlayerObject()}
            onWagerSubmit={handleDailyDoubleWager}
            onCancel={handleCancelDailyDouble}
          />
        )}

        {selectedQuestion && !selectedQuestion.isDailyDouble && (
          <QuestionOverlay
            category={selectedQuestion.category}
            value={selectedQuestion.value}
            question={selectedQuestion.question}
            answer={selectedQuestion.answer}
            imageUrl={selectedQuestion.imageUrl}
            onClose={handleCloseOverlay}
            players={players}
            activePlayer={activePlayer}
            updateScore={updateScore}
          />
        )}

        {dailyDoubleData && (
          <QuestionOverlay
            category={dailyDoubleData.category}
            value={dailyDoubleData.wager}
            question={dailyDoubleData.question}
            answer={dailyDoubleData.answer}
            imageUrl={dailyDoubleData.imageUrl}
            onClose={handleCloseOverlay}
            players={players}
            activePlayer={activePlayer}
            updateScore={updateScore}
            isDailyDouble={true}
          />
        )}

        {showFinalJeopardy && (
          <FinalJeopardy
            finalJeopardy={finalJeopardy}
            players={players}
            updateScore={updateScore}
            onComplete={handleFinalJeopardyComplete}
          />
        )}
      </div>
    </>
  )
}
