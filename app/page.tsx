import GameBoard from "@/components/game-board"
import { getCategories, getFinalJeopardy } from "./actions/categories"

export default async function Home() {
  let customCategories = null
  let customFinalJeopardy = null

  try {
    // Try to get custom categories and final jeopardy with individual error handling
    try {
      customCategories = await getCategories()
    } catch (categoryError) {
      console.error("Failed to load categories:", categoryError)
      customCategories = null
    }

    try {
      customFinalJeopardy = await getFinalJeopardy()
    } catch (finalJeopardyError) {
      console.error("Failed to load final jeopardy:", finalJeopardyError)
      customFinalJeopardy = null
    }
  } catch (error) {
    console.error("Error loading custom data:", error)
    // Continue with default data if there's an error
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-[#00236A]">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        <GameBoard
          customCategories={customCategories || undefined}
          customFinalJeopardy={customFinalJeopardy || undefined}
        />
      </div>
    </main>
  )
}
