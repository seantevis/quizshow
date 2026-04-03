"use server"

import { revalidatePath } from "next/cache"
import { put, del, list } from "@vercel/blob"
import { csvToCategories, validateCSV } from "@/utils/csv-utils"
import type { Category, FinalJeopardy } from "@/data/game-data"

const CATEGORIES_CSV_PATH = "game-data/categories.csv"
const FINAL_JEOPARDY_CSV_PATH = "game-data/final-jeopardy.csv"

// Helper to escape CSV values (for internal storage format)
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Convert categories to internal CSV format
function categoriesToInternalCSV(categories: Category[]): string {
  const header = "category,value,question,answer,isDailyDouble,imageUrl"
  const rows: string[] = [header]
  
  for (const cat of categories) {
    for (const q of cat.questions) {
      rows.push([
        escapeCSV(cat.category),
        q.value.toString(),
        escapeCSV(q.question),
        escapeCSV(q.answer),
        q.isDailyDouble ? "true" : "false",
        q.imageUrl ? escapeCSV(q.imageUrl) : ""
      ].join(","))
    }
  }
  
  return rows.join("\n")
}

// Convert Final Jeopardy to internal CSV format
function finalJeopardyToInternalCSV(fj: FinalJeopardy): string {
  const header = "category,question,answer,imageUrl"
  const row = [
    escapeCSV(fj.category),
    escapeCSV(fj.question),
    escapeCSV(fj.answer),
    fj.imageUrl ? escapeCSV(fj.imageUrl) : ""
  ].join(",")
  
  return `${header}\n${row}`
}

// Write CSV to blob storage
async function writeCSVToBlob(pathname: string, content: string): Promise<boolean> {
  try {
    // Delete existing blob if it exists
    const { blobs } = await list({ prefix: pathname })
    const existingBlob = blobs.find(b => b.pathname === pathname)
    if (existingBlob) {
      await del(existingBlob.url)
    }
    
    // Write new content with public access
    await put(pathname, content, {
      access: "public",
      contentType: "text/csv",
      addRandomSuffix: false
    })
    
    return true
  } catch (error) {
    console.error(`Error writing CSV to ${pathname}:`, error)
    return false
  }
}

// Read CSV from blob storage
async function readCSVFromBlob(pathname: string): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: pathname })
    const blob = blobs.find(b => b.pathname === pathname)
    
    if (!blob) return null
    
    const response = await fetch(blob.url)
    if (!response.ok) return null
    
    const text = await response.text()
    return text
  } catch (error) {
    console.error(`Error reading CSV from ${pathname}:`, error)
    return null
  }
}

// Parse internal CSV format to categories
function parseInternalCSV(csv: string): Category[] {
  const lines = csv.split("\n").filter(line => line.trim())
  if (lines.length < 2) return []
  
  const dataLines = lines.slice(1)
  const categoryMap = new Map<string, Category>()
  
  for (const line of dataLines) {
    const fields = parseCSVLine(line)
    const [categoryName, valueStr, question, answer, isDailyDoubleStr, imageUrl] = fields
    
    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, {
        category: categoryName,
        questions: []
      })
    }
    
    const category = categoryMap.get(categoryName)!
    category.questions.push({
      value: parseInt(valueStr, 10),
      question,
      answer,
      isDailyDouble: isDailyDoubleStr === "true",
      ...(imageUrl ? { imageUrl } : {})
    })
  }
  
  for (const cat of categoryMap.values()) {
    cat.questions.sort((a, b) => a.value - b.value)
  }
  
  return Array.from(categoryMap.values())
}

// Parse internal CSV format to Final Jeopardy
function parseInternalFinalJeopardyCSV(csv: string): FinalJeopardy | null {
  const lines = csv.split("\n").filter(line => line.trim())
  if (lines.length < 2) return null
  
  const [category, question, answer, imageUrl] = parseCSVLine(lines[1])
  
  return {
    category,
    question,
    answer,
    ...(imageUrl ? { imageUrl } : {})
  }
}

// Helper to parse CSV line
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  
  return result.map(val => {
    if (val.startsWith('"') && val.endsWith('"')) {
      return val.slice(1, -1).replace(/""/g, '"')
    }
    return val
  })
}

export async function importCategoriesFromCSV(csvContent: string) {
  try {
    // Validate CSV format using the shared validator
    const validation = validateCSV(csvContent)
    if (!validation.valid) {
      return { success: false, error: validation.message || "Invalid CSV format" }
    }

    // Convert CSV to categories and final jeopardy using shared utility
    const { categories, finalJeopardy } = csvToCategories(csvContent)

    if (categories.length === 0) {
      return { success: false, error: "No valid categories found in CSV" }
    }

    // Convert to internal CSV format and save to Blob storage
    const categoriesCSV = categoriesToInternalCSV(categories)
    const catSuccess = await writeCSVToBlob(CATEGORIES_CSV_PATH, categoriesCSV)
    
    if (!catSuccess) {
      return { success: false, error: "Failed to save categories to storage" }
    }

    // Save final jeopardy if provided
    if (finalJeopardy) {
      const fjCSV = finalJeopardyToInternalCSV(finalJeopardy)
      await writeCSVToBlob(FINAL_JEOPARDY_CSV_PATH, fjCSV)
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
    // Read from Blob storage
    const categoriesCSV = await readCSVFromBlob(CATEGORIES_CSV_PATH)
    const finalJeopardyCSV = await readCSVFromBlob(FINAL_JEOPARDY_CSV_PATH)

    let categories: Category[] = []
    let finalJeopardy: FinalJeopardy | undefined = undefined

    if (categoriesCSV) {
      categories = parseInternalCSV(categoriesCSV)
    }

    if (finalJeopardyCSV) {
      const fj = parseInternalFinalJeopardyCSV(finalJeopardyCSV)
      if (fj) {
        finalJeopardy = fj
      }
    }

    return { categories, finalJeopardy }
  } catch (error) {
    console.error("Error getting exportable categories:", error)
    return { categories: [] }
  }
}
