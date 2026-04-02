"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Save, Trash2, AlertCircle, X, LinkIcon } from "lucide-react"
import { saveCategories } from "@/app/actions/categories"
import { gameData, finalJeopardyData, type Category, type Question, type FinalJeopardy } from "@/data/game-data"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface CategoryEditorProps {
  initialCategories: Category[] | null
  initialFinalJeopardy: FinalJeopardy | null
}

export default function CategoryEditor({ initialCategories, initialFinalJeopardy }: CategoryEditorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [finalJeopardy, setFinalJeopardy] = useState<FinalJeopardy>({
    category: "",
    question: "",
    answer: "",
    imageUrl: "",
  })
  const [saveStatus, setSaveStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Initialize with existing categories or default ones
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(JSON.parse(JSON.stringify(initialCategories)))
    } else {
      // Start with a copy of the default categories
      setCategories(JSON.parse(JSON.stringify(gameData)))
    }

    if (initialFinalJeopardy) {
      setFinalJeopardy(JSON.parse(JSON.stringify(initialFinalJeopardy)))
    } else {
      // Start with a copy of the default final jeopardy
      setFinalJeopardy(JSON.parse(JSON.stringify(finalJeopardyData)))
    }
  }, [initialCategories, initialFinalJeopardy])

  const handleCategoryChange = (index: number, value: string) => {
    const newCategories = [...categories]
    newCategories[index].category = value
    setCategories(newCategories)
  }

  const handleQuestionChange = (
    categoryIndex: number,
    questionIndex: number,
    field: keyof Question,
    value: string | number | boolean,
  ) => {
    const newCategories = [...categories]

    if (field === "value" && typeof value === "string") {
      // Convert string to number for the value field
      newCategories[categoryIndex].questions[questionIndex][field] = Number.parseInt(value as string, 10) || 0
    } else if (field === "isDailyDouble" && typeof value === "boolean") {
      newCategories[categoryIndex].questions[questionIndex][field] = value
    } else if (typeof value === "string") {
      // For question, answer, and imageUrl fields
      newCategories[categoryIndex].questions[questionIndex][field as "question" | "answer" | "imageUrl"] = value
    }

    setCategories(newCategories)
  }

  const handleFinalJeopardyChange = (field: keyof FinalJeopardy, value: string) => {
    setFinalJeopardy((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addCategory = () => {
    // Create a new category with empty questions
    const newCategory: Category = {
      category: "New Category",
      questions: [
        { value: 100, question: "", answer: "" },
        { value: 200, question: "", answer: "" },
        { value: 300, question: "", answer: "" },
        { value: 400, question: "", answer: "" },
        { value: 500, question: "", answer: "" },
      ],
    }

    setCategories([...categories, newCategory])
  }

  const removeCategory = (index: number) => {
    const newCategories = [...categories]
    newCategories.splice(index, 1)
    setCategories(newCategories)
  }

  const toggleDailyDouble = (categoryIndex: number, questionIndex: number) => {
    const newCategories = [...categories]
    const currentValue = newCategories[categoryIndex].questions[questionIndex].isDailyDouble || false
    newCategories[categoryIndex].questions[questionIndex].isDailyDouble = !currentValue
    setCategories(newCategories)
  }

  const removeImage = (categoryIndex: number, questionIndex: number) => {
    const newCategories = [...categories]
    newCategories[categoryIndex].questions[questionIndex].imageUrl = ""
    setCategories(newCategories)
  }

  const removeFinalJeopardyImage = () => {
    setFinalJeopardy((prev) => ({
      ...prev,
      imageUrl: "",
    }))
  }

  const handleSave = async () => {
    // Validate categories
    for (const category of categories) {
      if (!category.category.trim()) {
        setSaveStatus({
          message: "Category names cannot be empty",
          isError: true,
        })
        return
      }

      for (const question of category.questions) {
        if (!question.question.trim() || !question.answer.trim()) {
          setSaveStatus({
            message: "Questions and answers cannot be empty",
            isError: true,
          })
          return
        }
      }
    }

    // Validate Final Jeopardy
    if (!finalJeopardy.category.trim() || !finalJeopardy.question.trim() || !finalJeopardy.answer.trim()) {
      setSaveStatus({
        message: "Final Jeopardy category, question, and answer cannot be empty",
        isError: true,
      })
      return
    }

    setIsLoading(true)
    setSaveStatus({ message: "Saving...", isError: false })

    console.log("[v0] Saving categories:", JSON.stringify(categories, null, 2))
    console.log("[v0] Saving finalJeopardy:", JSON.stringify(finalJeopardy, null, 2))

    try {
      const result = await saveCategories(categories, finalJeopardy)
      console.log("[v0] Save result:", result)

      if (result.success) {
        setSaveStatus({ message: "Categories saved successfully!", isError: false })
        router.refresh()
      } else {
        console.log("[v0] Save failed with error:", result.error)
        setSaveStatus({ message: result.error || "Failed to save categories", isError: true })
      }
    } catch (error) {
      console.log("[v0] Save exception:", error)
      setSaveStatus({ message: "An error occurred while saving: " + (error instanceof Error ? error.message : String(error)), isError: true })
    }

    setIsLoading(false)

    // Clear status after 3 seconds
    setTimeout(() => {
      setSaveStatus(null)
    }, 3000)
  }

  const resetToDefault = () => {
    if (confirm("Are you sure you want to reset to default categories? All changes will be lost.")) {
      setCategories(JSON.parse(JSON.stringify(gameData)))
      setFinalJeopardy(JSON.parse(JSON.stringify(finalJeopardyData)))
    }
  }

  // Function to validate if a string is a valid URL
  const isValidUrl = (url: string): boolean => {
    if (!url) return true // Empty URL is valid (no image)
    try {
      new URL(url)
      return true
    } catch (error) {
      return false
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Button onClick={addCategory} className="bg-green-600 hover:bg-green-700 text-white">
          <Plus size={18} className="mr-2" /> Add Category
        </Button>

        <div className="flex gap-4">
          <Button onClick={resetToDefault} className="bg-[#005AF2] hover:bg-[#0046c9] text-white">
            Reset to Default
          </Button>

          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold"
          >
            <Save size={18} className="mr-2" /> Save Categories
          </Button>
        </div>
      </div>

      {saveStatus && (
        <div className={`p-4 rounded-lg ${saveStatus.isError ? "bg-red-600/20" : "bg-green-600/20"} flex items-center`}>
          {saveStatus.isError ? (
            <AlertCircle size={20} className="text-red-500 mr-2" />
          ) : (
            <Save size={20} className="text-green-500 mr-2" />
          )}
          <p className={saveStatus.isError ? "text-red-400" : "text-green-400"}>{saveStatus.message}</p>
        </div>
      )}

      {/* Regular Categories */}
      <div className="space-y-8">
        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-[#005AF2] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <Input
                value={category.category}
                onChange={(e) => handleCategoryChange(categoryIndex, e.target.value)}
                className="text-xl font-bold bg-[#0046c9] border-[#0046c9] text-white"
                placeholder="Category Name"
              />

              <Button
                onClick={() => removeCategory(categoryIndex)}
                className="bg-red-600 hover:bg-red-700 text-white ml-2"
                disabled={categories.length <= 1}
              >
                <Trash2 size={18} />
              </Button>
            </div>

            <div className="space-y-4">
              {category.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="bg-[#0046c9] p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="text-white font-bold mr-2">Value:</span>
                    <Input
                      type="number"
                      value={question.value}
                      onChange={(e) => handleQuestionChange(categoryIndex, questionIndex, "value", e.target.value)}
                      className="w-24 bg-[#00236A] border-[#00236A] text-white"
                    />

                    <div className="ml-auto flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={question.isDailyDouble || false}
                          onChange={() => toggleDailyDouble(categoryIndex, questionIndex)}
                          className="mr-2 h-4 w-4"
                        />
                        <span className="text-[#f8d64e] font-bold">Daily Double</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-white font-bold mb-1">Question:</label>
                    <textarea
                      value={question.question}
                      onChange={(e) => handleQuestionChange(categoryIndex, questionIndex, "question", e.target.value)}
                      className="w-full p-2 bg-[#00236A] border-[#00236A] text-white rounded-lg"
                      rows={2}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-white font-bold mb-1">Answer:</label>
                    <textarea
                      value={question.answer}
                      onChange={(e) => handleQuestionChange(categoryIndex, questionIndex, "answer", e.target.value)}
                      className="w-full p-2 bg-[#00236A] border-[#00236A] text-white rounded-lg"
                      rows={2}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-white font-bold mb-1">Image URL:</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-grow relative">
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <LinkIcon size={16} />
                        </div>
                        <Input
                          type="url"
                          value={question.imageUrl || ""}
                          onChange={(e) =>
                            handleQuestionChange(categoryIndex, questionIndex, "imageUrl", e.target.value)
                          }
                          placeholder="https://example.com/image.jpg"
                          className="w-full pl-8 bg-[#00236A] border-[#00236A] text-white"
                        />
                      </div>
                      {question.imageUrl && (
                        <Button
                          onClick={() => removeImage(categoryIndex, questionIndex)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 h-8 w-8 flex-shrink-0"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                    {question.imageUrl && !isValidUrl(question.imageUrl) && (
                      <p className="text-red-400 text-sm mt-1">Please enter a valid URL</p>
                    )}

                    {/* Preview of the image if URL is provided */}
                    {question.imageUrl && isValidUrl(question.imageUrl) && (
                      <div className="mt-2 relative w-full h-40 bg-[#00236A] rounded-lg overflow-hidden">
                        <Image
                          src={question.imageUrl || "/placeholder.svg"}
                          alt="Question image preview"
                          fill
                          style={{ objectFit: "contain" }}
                          onError={(e) => {
                            console.error("Image failed to load:", question.imageUrl)
                            // Show a placeholder or error message
                            ;(e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Final Jeopardy Section */}
      <div className="bg-[#f8d64e] p-4 rounded-lg">
        <h2 className="text-2xl font-bold text-[#00236A] mb-4">Final Jeopardy</h2>

        <div className="bg-[#005AF2] p-4 rounded-lg">
          <div className="mb-3">
            <label className="block text-white font-bold mb-1">Category:</label>
            <Input
              value={finalJeopardy.category}
              onChange={(e) => handleFinalJeopardyChange("category", e.target.value)}
              className="bg-[#0046c9] border-[#0046c9] text-white"
              placeholder="Final Jeopardy Category"
            />
          </div>

          <div className="mb-3">
            <label className="block text-white font-bold mb-1">Question:</label>
            <textarea
              value={finalJeopardy.question}
              onChange={(e) => handleFinalJeopardyChange("question", e.target.value)}
              className="w-full p-2 bg-[#0046c9] border-[#0046c9] text-white rounded-lg"
              rows={3}
              placeholder="Final Jeopardy Question"
            />
          </div>

          <div className="mb-3">
            <label className="block text-white font-bold mb-1">Answer:</label>
            <textarea
              value={finalJeopardy.answer}
              onChange={(e) => handleFinalJeopardyChange("answer", e.target.value)}
              className="w-full p-2 bg-[#0046c9] border-[#0046c9] text-white rounded-lg"
              rows={2}
              placeholder="Final Jeopardy Answer"
            />
          </div>

          <div className="mt-4">
            <label className="block text-white font-bold mb-1">Image URL:</label>
            <div className="flex items-center gap-2">
              <div className="flex-grow relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <LinkIcon size={16} />
                </div>
                <Input
                  type="url"
                  value={finalJeopardy.imageUrl || ""}
                  onChange={(e) => handleFinalJeopardyChange("imageUrl", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full pl-8 bg-[#0046c9] border-[#0046c9] text-white"
                />
              </div>
              {finalJeopardy.imageUrl && (
                <Button
                  onClick={removeFinalJeopardyImage}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 h-8 w-8 flex-shrink-0"
                >
                  <X size={16} />
                </Button>
              )}
            </div>
            {finalJeopardy.imageUrl && !isValidUrl(finalJeopardy.imageUrl) && (
              <p className="text-red-400 text-sm mt-1">Please enter a valid URL</p>
            )}

            {/* Preview of the image if URL is provided */}
            {finalJeopardy.imageUrl && isValidUrl(finalJeopardy.imageUrl) && (
              <div className="mt-2 relative w-full h-40 bg-[#0046c9] rounded-lg overflow-hidden">
                <Image
                  src={finalJeopardy.imageUrl || "/placeholder.svg"}
                  alt="Final Jeopardy image preview"
                  fill
                  style={{ objectFit: "contain" }}
                  onError={(e) => {
                    console.error("Image failed to load:", finalJeopardy.imageUrl)
                    // Show a placeholder or error message
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-[#00236A] p-4 border-t border-[#005AF2]">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold py-6 text-xl"
        >
          <Save size={20} className="mr-2" /> Save Categories
        </Button>
      </div>
    </div>
  )
}
