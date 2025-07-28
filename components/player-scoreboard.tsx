"use client"

import { User } from "lucide-react"
import type { Player } from "./player-management"

interface PlayerScoreboardProps {
  players: Player[]
  activePlayer: string | null
  setActivePlayer: (id: string | null) => void
}

export default function PlayerScoreboard({ players, activePlayer, setActivePlayer }: PlayerScoreboardProps) {
  if (players.length === 0) {
    return null // Don't show anything if no players
  }

  return (
    <div className="flex justify-center w-full">
      <div className="flex flex-wrap justify-center gap-2">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => setActivePlayer(player.id)}
            className={`px-3 py-1 rounded-lg transition-colors text-sm flex items-center gap-2 ${
              activePlayer === player.id
                ? "bg-[#f8d64e] text-[#00236A] font-bold"
                : "bg-[#005AF2] text-white hover:bg-[#0046c9]"
            }`}
          >
            <User size={16} className="flex-shrink-0" />
            <span className="font-medium">{player.name}</span>
            <span className={`font-bold ${player.score < 0 ? "text-red-400" : ""}`}>{player.score}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
