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
      kv.del("game-state"),
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
    if (!Array.isArray(categories) || categories.length === 0) {
      return { success: false, error: "Invalid categories data" }
    }

    if (!finalJeopardy || !finalJeopardy.category || !finalJeopardy.question || !finalJeopardy.answer) {
      return { success: false, error: "Invalid final jeopardy data" }
    }

    // Save the data - @vercel/kv handles JSON serialization automatically
    await kv.set("custom-categories", categories)
    await kv.set("final-jeopardy", finalJeopardy)

    revalidatePath("/editor")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error saving categories:", error)
    return { success: false, error: "Failed to save categories" }
  }
}

export async function getCategories(): Promise<Category[] | null> {
  try {
    // @vercel/kv automatically handles JSON deserialization
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
    } else {
      console.warn("Invalid category data structure found, clearing corrupted data")
      await kv.del("custom-categories")
      return null
    }
  } catch (error) {
    console.error("Error getting categories:", error)
    return null
  }
}

export async function getFinalJeopardy(): Promise<FinalJeopardy | null> {
  try {
    // @vercel/kv automatically handles JSON deserialization
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

    // Clear invalid data
    await kv.del("final-jeopardy")
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
