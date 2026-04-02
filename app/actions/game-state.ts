"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

// Types
export interface Player {
  id: string
  name: string
  score: number
}

export interface GameSettings {
  gameName: string
  gameTitleImage: string
  useImageAsTitle: boolean
  hideGameTitle: boolean
}

export interface GameState {
  players: Player[]
  activePlayerId: string | null
  answeredQuestions: string[]
  settings: GameSettings
}

const GAME_STATE_KEY = "game-state"
const DEFAULT_SETTINGS: GameSettings = {
  gameName: "Questions!",
  gameTitleImage: "",
  useImageAsTitle: false,
  hideGameTitle: false,
}

// Get the full game state
export async function getGameState(): Promise<GameState | null> {
  try {
    const state = await kv.get<GameState>(GAME_STATE_KEY)
    return state
  } catch (error) {
    console.error("Error getting game state:", error)
    return null
  }
}

// Save the full game state
export async function saveGameState(state: GameState): Promise<{ success: boolean; error?: string }> {
  try {
    await kv.set(GAME_STATE_KEY, state)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error saving game state:", error)
    return { success: false, error: "Failed to save game state" }
  }
}

// Get game settings only
export async function getGameSettings(): Promise<GameSettings> {
  try {
    const state = await kv.get<GameState>(GAME_STATE_KEY)
    return state?.settings || DEFAULT_SETTINGS
  } catch (error) {
    console.error("Error getting game settings:", error)
    return DEFAULT_SETTINGS
  }
}

// Save game settings
export async function saveGameSettings(settings: GameSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const currentState = await kv.get<GameState>(GAME_STATE_KEY)
    const newState: GameState = {
      players: currentState?.players || [],
      activePlayerId: currentState?.activePlayerId || null,
      answeredQuestions: currentState?.answeredQuestions || [],
      settings,
    }
    await kv.set(GAME_STATE_KEY, newState)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error saving game settings:", error)
    return { success: false, error: "Failed to save game settings" }
  }
}

// Get players
export async function getPlayers(): Promise<Player[]> {
  try {
    const state = await kv.get<GameState>(GAME_STATE_KEY)
    return state?.players || []
  } catch (error) {
    console.error("Error getting players:", error)
    return []
  }
}

// Save players
export async function savePlayers(
  players: Player[],
  activePlayerId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentState = await kv.get<GameState>(GAME_STATE_KEY)
    const newState: GameState = {
      players,
      activePlayerId,
      answeredQuestions: currentState?.answeredQuestions || [],
      settings: currentState?.settings || DEFAULT_SETTINGS,
    }
    await kv.set(GAME_STATE_KEY, newState)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error saving players:", error)
    return { success: false, error: "Failed to save players" }
  }
}

// Update a single player's score
export async function updatePlayerScore(
  playerId: string,
  scoreChange: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentState = await kv.get<GameState>(GAME_STATE_KEY)
    if (!currentState) {
      return { success: false, error: "No game state found" }
    }

    const updatedPlayers = currentState.players.map((player) =>
      player.id === playerId ? { ...player, score: player.score + scoreChange } : player
    )

    const newState: GameState = {
      ...currentState,
      players: updatedPlayers,
    }
    await kv.set(GAME_STATE_KEY, newState)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating player score:", error)
    return { success: false, error: "Failed to update player score" }
  }
}

// Get answered questions
export async function getAnsweredQuestions(): Promise<string[]> {
  try {
    const state = await kv.get<GameState>(GAME_STATE_KEY)
    return state?.answeredQuestions || []
  } catch (error) {
    console.error("Error getting answered questions:", error)
    return []
  }
}

// Save answered questions
export async function saveAnsweredQuestions(answeredQuestions: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const currentState = await kv.get<GameState>(GAME_STATE_KEY)
    const newState: GameState = {
      players: currentState?.players || [],
      activePlayerId: currentState?.activePlayerId || null,
      answeredQuestions,
      settings: currentState?.settings || DEFAULT_SETTINGS,
    }
    await kv.set(GAME_STATE_KEY, newState)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error saving answered questions:", error)
    return { success: false, error: "Failed to save answered questions" }
  }
}

// Reset game state (clears players, scores, and answered questions but keeps settings)
export async function resetGameState(): Promise<{ success: boolean; error?: string }> {
  try {
    const currentState = await kv.get<GameState>(GAME_STATE_KEY)
    const newState: GameState = {
      players: [],
      activePlayerId: null,
      answeredQuestions: [],
      settings: currentState?.settings || DEFAULT_SETTINGS,
    }
    await kv.set(GAME_STATE_KEY, newState)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error resetting game state:", error)
    return { success: false, error: "Failed to reset game state" }
  }
}

// Clear all game state including settings
export async function clearGameState(): Promise<{ success: boolean; error?: string }> {
  try {
    await kv.del(GAME_STATE_KEY)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error clearing game state:", error)
    return { success: false, error: "Failed to clear game state" }
  }
}
