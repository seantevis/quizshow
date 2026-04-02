"use server"

import { revalidatePath } from "next/cache"
import { kv } from "@vercel/kv"
import { csvToCategories, validateCSV } from "@/utils/csv-utils"
import type { Category, FinalJeopardy } from "@/data/game-data"

export async function importCategoriesFromCSV(csvContent: string) {
  try {
    // Validate CSV format
    const validation = validateCSV(csvContent)
    if (!validation.valid) {
      return { success: false, error: validation.message || "Invalid CSV format" }
    }

    // Convert CSV to categories and final jeopardy
    const { categories, finalJeopardy } = csvToCategories(csvContent)

    // Save to KV store with JSON.stringify for consistency with saveCategories
    await kv.set("custom-categories", JSON.stringify(categories))

    // Save final jeopardy if provided
    if (finalJeopardy) {
      await kv.set("final-jeopardy", JSON.stringify(finalJeopardy))
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
    const rawCategories = await kv.get("custom-categories")
    const rawFinalJeopardy = await kv.get("final-jeopardy")

    let customCategories: Category[] | null = null
    let customFinalJeopardy: FinalJeopardy | null = null

    // Handle both string and object data for categories
    if (rawCategories) {
      if (typeof rawCategories === "string") {
        try {
          customCategories = JSON.parse(rawCategories)
        } catch {
          customCategories = null
        }
      } else if (Array.isArray(rawCategories)) {
        customCategories = rawCategories
      }
    }

    // Handle both string and object data for final jeopardy
    if (rawFinalJeopardy) {
      if (typeof rawFinalJeopardy === "string") {
        try {
          customFinalJeopardy = JSON.parse(rawFinalJeopardy)
        } catch {
          customFinalJeopardy = null
        }
      } else if (typeof rawFinalJeopardy === "object") {
        customFinalJeopardy = rawFinalJeopardy as FinalJeopardy
      }
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
