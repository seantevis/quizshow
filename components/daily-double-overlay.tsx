"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSound } from "@/contexts/sound-context"
import type { Player } from "./player-management"

interface DailyDoubleOverlayProps {
  category: string
  value: number
  activePlayer: Player | null
  onWagerSubmit: (wager: number) => void
  onCancel: () => void
}

export default function DailyDoubleOverlay({
  category,
  value,
  activePlayer,
  onWagerSubmit,
  onCancel,
}: DailyDoubleOverlayProps) {
  const [wager, setWager] = useState<string>(value.toString())
  const [error, setError] = useState<string | null>(null)
  const [showDailyDouble, setShowDailyDouble] = useState(true)
  const { playSound } = useSound()

  // Play daily double sound when component mounts
  useEffect(() => {
    try {
      playSound("dailyDouble")
    } catch (error) {
      // Continue even if sound fails
    }

    // After 2 seconds, show the wager form
    const timer = setTimeout(() => {
      setShowDailyDouble(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [playSound])

  const handleWagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, "")
    setWager(value)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const wagerValue = Number.parseInt(wager, 10)

    // Validate wager
    if (isNaN(wagerValue) || wagerValue < 5) {
      setError("Minimum wager is 5 points")
      return
    }

    // For players with positive scores, enforce maximum wager
    // For players with negative scores, allow up to 1000
    const maxWager = activePlayer ? Math.max(activePlayer.score > 0 ? activePlayer.score : 0, 1000) : 1000
    if (wagerValue > maxWager) {
      setError(`Maximum wager is ${maxWager} points`)
      return
    }

    onWagerSubmit(wagerValue)
  }

  if (showDailyDouble) {
    return (
      <div className="fixed inset-0 bg-[#00236A]/95 flex flex-col items-center justify-center p-4 z-50">
        <div className="w-full max-w-4xl text-center">
          <div className="animate-pulse">
            <h2 className="text-5xl md:text-7xl font-bold text-[#f8d64e] mb-4 tracking-wider">DAILY DOUBLE!</h2>
            <p className="text-2xl text-white">{category}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#00236A]/95 flex flex-col items-center justify-center p-4 z-50">
      <div className="w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-[#f8d64e] mb-4">Daily Double</h2>
        <p className="text-xl text-white mb-2">{category}</p>

        {activePlayer ? (
          <>
            <p className="text-white mb-6">
              {activePlayer.name}, your current score is {activePlayer.score} points.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="wager" className="block text-white text-lg mb-2">
                  Enter your wager:
                </label>
                <Input
                  id="wager"
                  type="text"
                  value={wager}
                  onChange={handleWagerChange}
                  className="bg-[#005AF2] border-[#0046c9] text-white text-xl text-center py-6"
                  autoFocus
                />
                {error && <p className="text-red-500 mt-2">{error}</p>}
                <p className="text-gray-300 text-sm mt-2">
                  Minimum: 5 points | Maximum: {Math.max(activePlayer.score > 0 ? activePlayer.score : 0, 1000)} points
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <Button type="button" onClick={onCancel} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold px-6 py-3">
                  Submit Wager
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            <p className="text-lg">No active player selected!</p>
            <p>Please select a player to continue with the Daily Double.</p>
          </div>
        )}
      </div>
    </div>
  )
}
