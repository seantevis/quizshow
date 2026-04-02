"use server"

import { createClient } from "@vercel/kv"
import { revalidatePath } from "next/cache"
import type { Category, FinalJeopardy } from "@/data/game-data"

// Create KV client with error handling
function getKVClient() {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    return null
  }

  return createClient({
    url,
    token,
  })
}

export async function clearAllData() {
  const kv = getKVClient()
  if (!kv) {
    return { success: false, error: "KV not configured" }
  }

  try {
    await Promise.all([
      kv.del("custom-categories"),
      kv.del("final-jeopardy"),
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
  const kv = getKVClient()
  if (!kv) {
    return { success: false, error: "KV not configured" }
  }

  try {
    if (!Array.isArray(categories) || categories.length === 0) {
      return { success: false, error: "Invalid categories data" }
    }

    if (!finalJeopardy || !finalJeopardy.category || !finalJeopardy.question || !finalJeopardy.answer) {
      return { success: false, error: "Invalid final jeopardy data" }
    }

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
  const kv = getKVClient()
  if (!kv) {
    // KV not configured, return null to use default data
    return null
  }

  try {
    const rawData = await kv.get("custom-categories")

    if (!rawData) {
      return null
    }

    let categories: Category[]

    if (typeof rawData === "string") {
      try {
        categories = JSON.parse(rawData)
      } catch {
        // Invalid JSON, just return null without trying to clear
        return null
      }
    } else if (Array.isArray(rawData)) {
      categories = rawData
    } else {
      return null
    }

    if (Array.isArray(categories) && categories.length > 0) {
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
    }

    return null
  } catch (error) {
    // Just log and return null - don't try to clear data in error handler
    console.error("Error getting categories:", error)
    return null
  }
}

export async function getFinalJeopardy(): Promise<FinalJeopardy | null> {
  const kv = getKVClient()
  if (!kv) {
    // KV not configured, return null to use default data
    return null
  }

  try {
    const rawData = await kv.get("final-jeopardy")

    if (!rawData) {
      return null
    }

    let finalJeopardy: FinalJeopardy

    if (typeof rawData === "string") {
      try {
        finalJeopardy = JSON.parse(rawData)
      } catch {
        // Invalid JSON, just return null
        return null
      }
    } else if (typeof rawData === "object" && rawData !== null) {
      finalJeopardy = rawData as FinalJeopardy
    } else {
      return null
    }

    if (
      finalJeopardy &&
      typeof finalJeopardy.category === "string" &&
      typeof finalJeopardy.question === "string" &&
      typeof finalJeopardy.answer === "string"
    ) {
      return finalJeopardy
    }

    return null
  } catch (error) {
    // Just log and return null - don't try to clear data in error handler
    console.error("Error getting final jeopardy:", error)
    return null
  }
}

export async function emergencyClearAll() {
  const kv = getKVClient()
  if (!kv) {
    return { success: false, error: "KV not configured" }
  }

  try {
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
