import type { Category, Question, FinalJeopardy } from "@/data/game-data"

// Convert categories to CSV string
export function categoriesToCSV(categories: Category[], finalJeopardy?: FinalJeopardy): string {
  // CSV header
  let csv = "Type,Category,Value,Question,Answer,IsDailyDouble,ImageUrl\n"

  // Add each question as a row
  categories.forEach((category) => {
    category.questions.forEach((question) => {
      // Escape fields that might contain commas or quotes
      const escapedCategory = escapeCSVField(category.category)
      const escapedQuestion = escapeCSVField(question.question)
      const escapedAnswer = escapeCSVField(question.answer)
      const escapedImageUrl = question.imageUrl ? escapeCSVField(question.imageUrl) : ""

      // Create the CSV row
      csv += `Regular,${escapedCategory},${question.value},${escapedQuestion},${escapedAnswer},${
        question.isDailyDouble ? "true" : "false"
      },${escapedImageUrl}\n`
    })
  })

  // Add Final Jeopardy if provided
  if (finalJeopardy) {
    const escapedCategory = escapeCSVField(finalJeopardy.category)
    const escapedQuestion = escapeCSVField(finalJeopardy.question)
    const escapedAnswer = escapeCSVField(finalJeopardy.answer)
    const escapedImageUrl = finalJeopardy.imageUrl ? escapeCSVField(finalJeopardy.imageUrl) : ""

    csv += `Final,${escapedCategory},0,${escapedQuestion},${escapedAnswer},false,${escapedImageUrl}\n`
  }

  return csv
}

// Parse CSV string to categories and final jeopardy
export function csvToCategories(csv: string): { categories: Category[]; finalJeopardy?: FinalJeopardy } {
  const lines = csv.split("\n")

  // Skip header row and empty lines
  const dataLines = lines.slice(1).filter((line) => line.trim() !== "")

  // Create a map to group questions by category
  const categoriesMap = new Map<string, Question[]>()
  let finalJeopardy: FinalJeopardy | undefined = undefined

  dataLines.forEach((line) => {
    // Parse the CSV line, handling quoted fields correctly
    const fields = parseCSVLine(line)

    if (fields.length >= 6) {
      const type = fields[0].toLowerCase()
      const categoryName = fields[1]
      const value = Number.parseInt(fields[2], 10)
      const questionText = fields[3]
      const answer = fields[4]
      const isDailyDouble = fields[5].toLowerCase() === "true"
      const imageUrl = fields[6] || undefined

      if (type === "final") {
        // This is a Final Jeopardy entry
        finalJeopardy = {
          category: categoryName,
          question: questionText,
          answer,
          imageUrl,
        }
      } else if (type === "regular" && !isNaN(value) && categoryName && questionText && answer) {
        const question: Question = {
          value,
          question: questionText,
          answer,
          isDailyDouble,
          imageUrl,
        }

        // Add to the category map
        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, [])
        }
        categoriesMap.get(categoryName)?.push(question)
      }
    }
  })

  // Convert map to array of categories
  const categories: Category[] = []
  categoriesMap.forEach((questions, categoryName) => {
    // Sort questions by value
    questions.sort((a, b) => a.value - b.value)
    categories.push({
      category: categoryName,
      questions,
    })
  })

  return { categories, finalJeopardy }
}

// Helper function to escape CSV fields
function escapeCSVField(field: string): string {
  // If the field contains commas, quotes, or newlines, wrap it in quotes
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    // Double any quotes in the field
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

// Helper function to parse a CSV line, handling quoted fields
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let currentField = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Double quotes inside a quoted field represent a single quote
        currentField += '"'
        i++ // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      fields.push(currentField)
      currentField = ""
    } else {
      // Regular character
      currentField += char
    }
  }

  // Add the last field
  fields.push(currentField)

  return fields
}

// Function to validate CSV format
export function validateCSV(csv: string): { valid: boolean; message?: string } {
  try {
    const lines = csv.split("\n")

    // Check if there's at least a header and one data row
    if (lines.length < 2) {
      return { valid: false, message: "CSV must contain a header row and at least one data row" }
    }

    // Check header format
    const header = lines[0].toLowerCase()
    if (
      !header.includes("type") ||
      !header.includes("category") ||
      !header.includes("value") ||
      !header.includes("question") ||
      !header.includes("answer")
    ) {
      return {
        valid: false,
        message: "CSV header must include Type, Category, Value, Question, and Answer columns",
      }
    }

    // Parse and validate data
    const { categories, finalJeopardy } = csvToCategories(csv)

    if (categories.length === 0) {
      return { valid: false, message: "No valid categories found in CSV" }
    }

    // Check if each category has at least one question
    for (const category of categories) {
      if (category.questions.length === 0) {
        return { valid: false, message: `Category "${category.category}" has no questions` }
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, message: "Error parsing CSV: " + (error instanceof Error ? error.message : String(error)) }
  }
}
