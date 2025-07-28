"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, X } from "lucide-react"

export interface Player {
  id: string
  name: string
  score: number
}

interface PlayerManagementProps {
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  activePlayer: string | null
  setActivePlayer: React.Dispatch<React.SetStateAction<string | null>>
}

export default function PlayerManagement({
  players,
  setPlayers,
  activePlayer,
  setActivePlayer,
}: PlayerManagementProps) {
  const [newPlayerName, setNewPlayerName] = useState("")

  const addPlayer = () => {
    if (newPlayerName.trim() === "") return

    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: newPlayerName.trim(),
      score: 0,
    }

    setPlayers((prev) => [...prev, newPlayer])
    setNewPlayerName("")

    // Set as active player if it's the first player
    if (players.length === 0) {
      setActivePlayer(newPlayer.id)
    }
  }

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id))

    // If active player is removed, set the first player as active
    if (activePlayer === id) {
      setActivePlayer(players.length > 1 ? players[0].id : null)
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 mb-4">
        {players.map((player) => (
          <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-[#005AF2] text-white">
            <div className="flex items-center gap-2">
              <span className="font-bold">{player.name}</span>
              <span className="text-lg">{player.score}</span>
            </div>
            <button className="text-red-500 hover:text-red-400" onClick={() => removePlayer(player.id)}>
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Add player..."
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPlayer()}
          className="bg-[#005AF2] border-[#0046c9] text-white rounded-lg"
        />
        <Button onClick={addPlayer} className="bg-green-600 hover:bg-green-700 text-white rounded-lg">
          <PlusCircle size={18} className="mr-2" /> Add
        </Button>
      </div>
    </div>
  )
}
