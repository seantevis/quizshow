import GameBoard from "@/components/game-board"
import { getCategories, getFinalJeopardy } from "./actions/categories"
import { getGameState } from "./actions/game-state"

export default async function Home() {
  let customCategories = null
  let customFinalJeopardy = null
  let gameState = null

  try {
    // Fetch all data in parallel
    const [categories, finalJeopardy, state] = await Promise.all([
      getCategories().catch((err) => {
        console.error("Failed to load categories:", err)
        return null
      }),
      getFinalJeopardy().catch((err) => {
        console.error("Failed to load final jeopardy:", err)
        return null
      }),
      getGameState().catch((err) => {
        console.error("Failed to load game state:", err)
        return null
      }),
    ])

    customCategories = categories
    customFinalJeopardy = finalJeopardy
    gameState = state
  } catch (error) {
    console.error("Error loading custom data:", error)
    // Continue with default data if there's an error
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-[#00236A]">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        <div id="game-title" className="my-8 text-left w-full">
          {/* Game title will be dynamically updated by client-side JavaScript */}
          <h1 className="text-4xl md:text-5xl font-bold text-[#f8d64e] tracking-wider">
            {gameState?.settings?.gameName || "Questions!"}
          </h1>
        </div>
        <GameBoard
          customCategories={customCategories || undefined}
          customFinalJeopardy={customFinalJeopardy || undefined}
          initialGameState={gameState || undefined}
        />
      </div>
    </main>
  )
}
