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
    if (!Array.isArray(categories) || categories.length === 0) {
      return { success: false, error: "Invalid categories data" }
    }

    if (!finalJeopardy || !finalJeopardy.category || !finalJeopardy.question || !finalJeopardy.answer) {
      return { success: false, error: "Invalid final jeopardy data" }
    }

    // Save the data with explicit JSON serialization
    await kv.set("custom-categories", JSON.stringify(categories))
    await kv.set("final-jeopardy", JSON.stringify(finalJeopardy))

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
    // Get raw data first
    const rawData = await kv.get("custom-categories")

    if (!rawData) {
      return null
    }

    let categories: Category[]

    // Handle both string and object data
    if (typeof rawData === "string") {
      try {
        categories = JSON.parse(rawData)
      } catch (parseError) {
        console.error("JSON parse error for categories:", parseError)
        // Clear corrupted data
        await kv.del("custom-categories")
        return null
      }
    } else if (Array.isArray(rawData)) {
      categories = rawData
    } else {
      console.error("Unexpected data type for categories:", typeof rawData)
      await kv.del("custom-categories")
      return null
    }

    // Validate that the data is an array and has the expected structure
    if (Array.isArray(categories) && categories.length > 0) {
      // Basic validation to ensure each category has the required properties
      const isValid = categories.every(
        (cat) =>
          cat &&
          typeof cat.category === "string" &&
          Array.isArray(cat.questions) &&
          cat.questions.every(
            (q) =>
              q &&
              typeof q.question === "string" &&
              typeof q.answer === "string" &&
              typeof q.value === "number" &&
              // Optional fields validation (if present, must be correct type)
              (q.isDailyDouble === undefined || typeof q.isDailyDouble === "boolean") &&
              (q.imageUrl === undefined || typeof q.imageUrl === "string"),
          ),
      )

      if (isValid) {
        return categories
      } else {
        console.warn("Invalid category data structure found, clearing corrupted data")
        await kv.del("custom-categories")
        return null
      }
    }

    return null
  } catch (error) {
    console.error("Error getting categories:", error)

    // Clear corrupted data on any error
    try {
      await kv.del("custom-categories")
      console.log("Cleared corrupted category data")
    } catch (clearError) {
      console.error("Error clearing corrupted data:", clearError)
    }

    return null
  }
}

export async function getFinalJeopardy(): Promise<FinalJeopardy | null> {
  try {
    // Get raw data first
    const rawData = await kv.get("final-jeopardy")

    if (!rawData) {
      return null
    }

    let finalJeopardy: FinalJeopardy

    // Handle both string and object data
    if (typeof rawData === "string") {
      try {
        finalJeopardy = JSON.parse(rawData)
      } catch (parseError) {
        console.error("JSON parse error for final jeopardy:", parseError)
        // Clear corrupted data
        await kv.del("final-jeopardy")
        return null
      }
    } else if (typeof rawData === "object" && rawData !== null) {
      finalJeopardy = rawData as FinalJeopardy
    } else {
      console.error("Unexpected data type for final jeopardy:", typeof rawData)
      await kv.del("final-jeopardy")
      return null
    }

    // Validate that the data has the expected structure
    if (
      finalJeopardy &&
      typeof finalJeopardy.category === "string" &&
      typeof finalJeopardy.question === "string" &&
      typeof finalJeopardy.answer === "string" &&
      // Optional field validation (if present, must be correct type)
      (finalJeopardy.imageUrl === undefined || typeof finalJeopardy.imageUrl === "string")
    ) {
      return finalJeopardy
    }

    // Clear invalid data
    await kv.del("final-jeopardy")
    return null
  } catch (error) {
    console.error("Error getting final jeopardy:", error)

    // Clear corrupted data on any error
    try {
      await kv.del("final-jeopardy")
      console.log("Cleared corrupted final jeopardy data")
    } catch (clearError) {
      console.error("Error clearing corrupted data:", clearError)
    }

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
