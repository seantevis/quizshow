"use server"

import { revalidatePath } from "next/cache"
import { Redis } from "@upstash/redis"
import { csvToCategories, validateCSV } from "@/utils/csv-utils"
import type { Category, FinalJeopardy } from "@/data/game-data"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function importCategoriesFromCSV(csvContent: string) {
  try {
    // Validate CSV format
    const validation = validateCSV(csvContent)
    if (!validation.valid) {
      return { success: false, error: validation.message || "Invalid CSV format" }
    }

    // Convert CSV to categories and final jeopardy
    const { categories, finalJeopardy } = csvToCategories(csvContent)

    // Save to Redis store
    await redis.set("custom-categories", JSON.stringify(categories))

    // Save final jeopardy if provided
    if (finalJeopardy) {
      await redis.set("final-jeopardy", JSON.stringify(finalJeopardy))
    }

    // Revalidate paths
    revalidatePath("/editor")
    revalidatePath("/")

    return { success: true, categories, finalJeopardy }
  } catch (error) {
    console.error("Error importing categories:", error)
    return {
      success: false,
      error: "Failed to import categories: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function getExportableCategories(): Promise<{
  categories: Category[]
  finalJeopardy?: FinalJeopardy
}> {
  try {
    // Try to get custom categories first
    const rawCategories = await redis.get("custom-categories")
    const rawFinalJeopardy = await redis.get("final-jeopardy")

    // Parse the data (handle both string and object formats)
    let customCategories: Category[] | null = null
    let customFinalJeopardy: FinalJeopardy | null = null

    if (rawCategories) {
      customCategories = typeof rawCategories === "string" ? JSON.parse(rawCategories) : rawCategories as Category[]
    }
    if (rawFinalJeopardy) {
      customFinalJeopardy = typeof rawFinalJeopardy === "string" ? JSON.parse(rawFinalJeopardy) : rawFinalJeopardy as FinalJeopardy
    }

    if (customCategories && customCategories.length > 0) {
      return { categories: customCategories, finalJeopardy: customFinalJeopardy || undefined }
    }

    // If no custom categories, return an empty array
    // The client will use default categories if needed
    return { categories: [] }
  } catch (error) {
    console.error("Error getting exportable categories:", error)
    return { categories: [] }
  }
}
