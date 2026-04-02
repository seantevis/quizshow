"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"
import type { Category, FinalJeopardy } from "@/data/game-data"

export async function clearAllData() {
  try {
    // Clear all possible keys that might contain corrupted data
    await Promise.all([
      kv.del("custom-categories"),
      kv.del("final-jeopardy"),
      kv.del("games"), // Clear saved games too if needed
      kv.del("games-by-date"),
    ])

    revalidatePath("/editor")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error clearing data:", error)
    return { success: false, error: "Failed to clear data" }
  }
}

export async function saveCategories(categories: Category[], finalJeopardy: FinalJeopardy) {
  try {
    // Validate input data before saving
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return { success: false, error: "Invalid categories data" }
    }

    if (!finalJeopardy) {
      return { success: false, error: "Final Jeopardy data is required" }
    }
    
    if (!finalJeopardy.category?.trim()) {
      return { success: false, error: "Final Jeopardy category cannot be empty" }
    }
    
    if (!finalJeopardy.question?.trim()) {
      return { success: false, error: "Final Jeopardy question cannot be empty" }
    }
    
    if (!finalJeopardy.answer?.trim()) {
      return { success: false, error: "Final Jeopardy answer cannot be empty" }
    }

    // Save categories and final jeopardy in parallel
    await Promise.all([
      kv.set("custom-categories", categories),
      kv.set("final-jeopardy", finalJeopardy),
    ])

    revalidatePath("/editor")
    revalidatePath("/editor/category/[id]", "page")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error saving categories:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to save categories"
    return { success: false, error: errorMessage }
  }
}

export async function getCategories(): Promise<Category[] | null> {
  try {
    const categories = await kv.get<Category[]>("custom-categories")

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return null
    }

    // Basic validation to ensure each category has the required properties
    const isValid = categories.every(
      (cat) =>
        cat &&
        typeof cat.category === "string" &&
        Array.isArray(cat.questions) &&
        cat.questions.every(
          (q) => q && typeof q.question === "string" && typeof q.answer === "string" && typeof q.value === "number",
        ),
    )

    if (isValid) {
      return categories
    }

    console.warn("Invalid category data structure found")
    return null
  } catch (error) {
    console.error("Error getting categories:", error)
    return null
  }
}

export async function getFinalJeopardy(): Promise<FinalJeopardy | null> {
  try {
    const finalJeopardy = await kv.get<FinalJeopardy>("final-jeopardy")

    if (!finalJeopardy) {
      return null
    }

    // Validate that the data has the expected structure
    if (
      typeof finalJeopardy.category === "string" &&
      typeof finalJeopardy.question === "string" &&
      typeof finalJeopardy.answer === "string"
    ) {
      return finalJeopardy
    }

    console.warn("Invalid final jeopardy data structure found")
    return null
  } catch (error) {
    console.error("Error getting final jeopardy:", error)
    return null
  }
}

// Emergency function to clear all KV data
export async function emergencyClearAll() {
  try {
    // Get all keys and delete them
    const keys = await kv.keys("*")
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => kv.del(key)))
    }

    revalidatePath("/")
    revalidatePath("/editor")
    return { success: true, clearedKeys: keys.length }
  } catch (error) {
    console.error("Emergency clear failed:", error)
    return { success: false, error: "Failed to clear all data" }
  }
}
