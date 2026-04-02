"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"
import type { Category } from "@/data/game-data"
import type { Player } from "@/components/player-management"

export interface GameState {
  id: string
  name: string
  timestamp: number
  players: Player[]
  activePlayer: string | null
  answeredQuestions: string[]
  customCategories?: Category[]
  gameName?: string
  gameTitleImage?: string
  useImageAsTitle?: boolean
  hideGameTitle?: boolean
}

export async function saveGameState(state: Omit<GameState, "id" | "timestamp">) {
  try {
    const id = `game-${Date.now()}`
    const gameState: GameState = {
      ...state,
      id,
      timestamp: Date.now(),
    }

    // Save to the games list
    await kv.hset("games", { [id]: gameState })

    // Also save to a sorted set for easier retrieval by date
    await kv.zadd("games-by-date", { score: gameState.timestamp, member: id })

    revalidatePath("/")
    return { success: true, id }
  } catch (error) {
    console.error("Error saving game state:", error)
    return { success: false, error: "Failed to save game state" }
  }
}

export async function loadGameState(id: string): Promise<GameState | null> {
  try {
    const gameState = await kv.hget<GameState>("games", id)
    return gameState
  } catch (error) {
    console.error("Error loading game state:", error)
    return null
  }
}

export async function getSavedGames(): Promise<GameState[]> {
  try {
    // Get the most recent 10 game IDs
    const gameIds = await kv.zrange("games-by-date", 0, 9, { rev: true })

    if (!gameIds.length) return []

    // Get the game states for these IDs
    const games = await Promise.all(gameIds.map((id) => kv.hget<GameState>("games", id)))

    // Filter out any null values and sort by timestamp (newest first)
    return games.filter((game): game is GameState => game !== null).sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error("Error getting saved games:", error)
    return []
  }
}

export async function deleteGameState(id: string) {
  try {
    await kv.hdel("games", id)
    await kv.zrem("games-by-date", id)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting game state:", error)
    return { success: false, error: "Failed to delete game state" }
  }
}
