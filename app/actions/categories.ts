"use server"

import { put, get, del, list } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import type { Category, FinalJeopardy } from "@/data/game-data"

const CATEGORIES_CSV_PATH = "game-data/categories.csv"
const FINAL_JEOPARDY_CSV_PATH = "game-data/final-jeopardy.csv"

// Helper to escape CSV values
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Helper to unescape CSV values
function unescapeCSV(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"')
  }
  return value
}

// Parse CSV line handling quoted values
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
  
  return result.map(unescapeCSV)
}

// Convert categories to CSV format
function categoriesToCSV(categories: Category[]): string {
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

// Convert Final Jeopardy to CSV format
function finalJeopardyToCSV(fj: FinalJeopardy): string {
  const header = "category,question,answer,imageUrl"
  const row = [
    escapeCSV(fj.category),
    escapeCSV(fj.question),
    escapeCSV(fj.answer),
    fj.imageUrl ? escapeCSV(fj.imageUrl) : ""
  ].join(",")
  
  return `${header}\n${row}`
}

// Parse CSV to categories
function csvToCategories(csv: string): Category[] {
  const lines = csv.split("\n").filter(line => line.trim())
  if (lines.length < 2) return []
  
  // Skip header
  const dataLines = lines.slice(1)
  
  const categoryMap = new Map<string, Category>()
  
  for (const line of dataLines) {
    const [categoryName, valueStr, question, answer, isDailyDoubleStr, imageUrl] = parseCSVLine(line)
    
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
  
  // Sort questions by value within each category
  for (const cat of categoryMap.values()) {
    cat.questions.sort((a, b) => a.value - b.value)
  }
  
  return Array.from(categoryMap.values())
}

// Parse CSV to Final Jeopardy
function csvToFinalJeopardy(csv: string): FinalJeopardy | null {
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

// Check if a blob exists
async function blobExists(pathname: string): Promise<boolean> {
  try {
    const { blobs } = await list({ prefix: pathname })
    return blobs.some(blob => blob.pathname === pathname)
  } catch {
    return false
  }
}

// Read CSV from blob storage
async function readCSVFromBlob(pathname: string): Promise<string | null> {
  try {
    const exists = await blobExists(pathname)
    if (!exists) return null
    
    const result = await get(pathname, { access: "private" })
    if (!result) return null
    
    const text = await new Response(result.stream).text()
    return text
  } catch (error) {
    console.error(`Error reading CSV from ${pathname}:`, error)
    return null
  }
}

// Write CSV to blob storage
async function writeCSVToBlob(pathname: string, content: string): Promise<boolean> {
  try {
    // Delete existing blob if it exists
    const exists = await blobExists(pathname)
    if (exists) {
      const { blobs } = await list({ prefix: pathname })
      const blob = blobs.find(b => b.pathname === pathname)
      if (blob) {
        await del(blob.url)
      }
    }
    
    // Write new content
    await put(pathname, content, {
      access: "private",
      contentType: "text/csv"
    })
    
    return true
  } catch (error) {
    console.error(`Error writing CSV to ${pathname}:`, error)
    return false
  }
}

export async function clearAllData() {
  try {
    const { blobs } = await list({ prefix: "game-data/" })
    
    await Promise.all(blobs.map(blob => del(blob.url)))

    revalidatePath("/editor")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error clearing data:", error)
    return { success: false, error: "Failed to clear data" }
  }
}

export async function saveCategories(categories: Category[], finalJeopardy: FinalJeopardy) {
  console.log("[v0] saveCategories called with", categories?.length, "categories")
  console.log("[v0] finalJeopardy:", finalJeopardy)
  
  try {
    // Validate input data before saving
    if (!Array.isArray(categories) || categories.length === 0) {
      console.log("[v0] Invalid categories data - not an array or empty")
      return { success: false, error: "Invalid categories data" }
    }

    if (!finalJeopardy || !finalJeopardy.category || !finalJeopardy.question || !finalJeopardy.answer) {
      console.log("[v0] Invalid final jeopardy data")
      return { success: false, error: "Invalid final jeopardy data" }
    }

    // Convert to CSV and save
    console.log("[v0] Converting to CSV and saving to Blob storage...")
    
    const categoriesCSV = categoriesToCSV(categories)
    const finalJeopardyCSV = finalJeopardyToCSV(finalJeopardy)
    
    const [catSuccess, fjSuccess] = await Promise.all([
      writeCSVToBlob(CATEGORIES_CSV_PATH, categoriesCSV),
      writeCSVToBlob(FINAL_JEOPARDY_CSV_PATH, finalJeopardyCSV)
    ])
    
    if (!catSuccess || !fjSuccess) {
      return { success: false, error: "Failed to save CSV files" }
    }

    revalidatePath("/editor")
    revalidatePath("/")
    console.log("[v0] Save successful!")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error saving categories:", error)
    return { success: false, error: "Failed to save categories: " + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function getCategories(): Promise<Category[] | null> {
  try {
    const csv = await readCSVFromBlob(CATEGORIES_CSV_PATH)
    
    if (!csv) {
      return null
    }

    const categories = csvToCategories(csv)
    
    if (categories.length === 0) {
      return null
    }

    // Validate structure
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
            typeof q.value === "number"
        )
    )

    if (isValid) {
      return categories
    }

    return null
  } catch (error) {
    console.error("Error getting categories:", error)
    return null
  }
}

export async function getFinalJeopardy(): Promise<FinalJeopardy | null> {
  try {
    const csv = await readCSVFromBlob(FINAL_JEOPARDY_CSV_PATH)
    
    if (!csv) {
      return null
    }

    const finalJeopardy = csvToFinalJeopardy(csv)
    
    if (!finalJeopardy) {
      return null
    }

    // Validate structure
    if (
      typeof finalJeopardy.category === "string" &&
      typeof finalJeopardy.question === "string" &&
      typeof finalJeopardy.answer === "string"
    ) {
      return finalJeopardy
    }

    return null
  } catch (error) {
    console.error("Error getting final jeopardy:", error)
    return null
  }
}

// Test database connection
export async function testDatabaseConnection() {
  const testPath = "game-data/connection-test.csv"
  const testContent = `timestamp,message\n${new Date().toISOString()},"Connection test successful!"`

  try {
    // Test WRITE operation
    const writeSuccess = await writeCSVToBlob(testPath, testContent)
    if (!writeSuccess) {
      throw new Error("Write operation failed")
    }
    
    // Test READ operation
    const readResult = await readCSVFromBlob(testPath)
    if (!readResult) {
      throw new Error("Read operation failed")
    }

    // Clean up test file
    const { blobs } = await list({ prefix: testPath })
    if (blobs.length > 0) {
      await del(blobs[0].url)
    }

    return {
      success: true,
      message: "CSV storage connection verified!",
      operations: {
        write: "Success",
        read: "Success",
        delete: "Success"
      },
      testData: {
        written: testContent,
        read: readResult
      }
    }
  } catch (error) {
    console.error("Storage connection test failed:", error)
    return {
      success: false,
      message: "Storage connection failed",
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Emergency function to clear all data
export async function emergencyClearAll() {
  try {
    const { blobs } = await list({ prefix: "game-data/" })
    
    if (blobs.length > 0) {
      await Promise.all(blobs.map(blob => del(blob.url)))
    }

    revalidatePath("/")
    revalidatePath("/editor")
    return { success: true, clearedFiles: blobs.length }
  } catch (error) {
    console.error("Emergency clear failed:", error)
    return { success: false, error: "Failed to clear all data" }
  }
}
