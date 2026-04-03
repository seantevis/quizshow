"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, AlertCircle, LinkIcon, X } from "lucide-react"
import { getCategories, getFinalJeopardy, saveCategories } from "@/app/actions/categories"
import { gameData, finalJeopardyData, type Category, type Question } from "@/data/game-data"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface QuestionEditorProps {
  categoryIndex: number
  initialCategory: Category
  totalCategories: number
}

export function QuestionEditor({ categoryIndex, initialCategory, totalCategories }: QuestionEditorProps) {
  const [category, setCategory] = useState<Category>(
    JSON.parse(JSON.stringify(initialCategory))
  )
  const [saveStatus, setSaveStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleQuestionChange = (
    questionIndex: number,
    field: keyof Question,
    value: string | number | boolean,
  ) => {
    const newCategory = { ...category }
    const questions = [...newCategory.questions]

    if (field === "value" && typeof value === "string") {
      questions[questionIndex] = {
        ...questions[questionIndex],
        [field]: parseInt(value, 10) || 0
      }
    } else if (field === "isDailyDouble" && typeof value === "boolean") {
      questions[questionIndex] = {
        ...questions[questionIndex],
        [field]: value
      }
    } else if (typeof value === "string") {
      questions[questionIndex] = {
        ...questions[questionIndex],
        [field]: value
      }
    }

    newCategory.questions = questions
    setCategory(newCategory)
  }

  const removeImage = (questionIndex: number) => {
    handleQuestionChange(questionIndex, "imageUrl", "")
  }

  const isValidUrl = (url: string): boolean => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSave = async () => {
    for (const question of category.questions) {
      if (!question.question.trim() || !question.answer.trim()) {
        setSaveStatus({
          message: "Questions and answers cannot be empty",
          isError: true,
        })
        return
      }
    }

    setIsLoading(true)
    setSaveStatus({ message: "Saving...", isError: false })

    try {
      // Load all categories and update just this one
      const existingCategories = await getCategories()
      const existingFinalJeopardy = await getFinalJeopardy()
      
      const categories = existingCategories && existingCategories.length > 0 
        ? [...existingCategories]
        : [...gameData]
      
      const finalJeopardy = existingFinalJeopardy || finalJeopardyData

      categories[categoryIndex] = category

      const result = await saveCategories(categories, finalJeopardy)

      if (result.success) {
        setSaveStatus({ message: "Questions saved successfully!", isError: false })
        router.refresh()
      } else {
        setSaveStatus({ message: result.error || "Failed to save questions", isError: true })
      }
    } catch (error) {
      setSaveStatus({ 
        message: "An error occurred while saving", 
        isError: true 
      })
    }

    setIsLoading(false)
    setTimeout(() => setSaveStatus(null), 3000)
  }

  return (
    <div className="space-y-6">
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

      <div className="space-y-4">
        {category.questions.map((question, questionIndex) => (
          <div key={questionIndex} className="bg-[#005AF2] p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">Value:</span>
                <Input
                  type="number"
                  value={question.value}
                  onChange={(e) => handleQuestionChange(questionIndex, "value", e.target.value)}
                  className="w-28 bg-[#0046c9] border-[#0046c9] text-white text-lg"
                />
              </div>
              
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={question.isDailyDouble || false}
                  onChange={(e) => handleQuestionChange(questionIndex, "isDailyDouble", e.target.checked)}
                  className="mr-2 h-5 w-5"
                />
                <span className="text-[#f8d64e] font-bold">Daily Double</span>
              </label>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Question:</label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(questionIndex, "question", e.target.value)}
                className="w-full p-3 bg-[#0046c9] border-[#0046c9] text-white rounded-lg resize-none"
                rows={3}
                placeholder="Enter the question..."
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Answer:</label>
              <textarea
                value={question.answer}
                onChange={(e) => handleQuestionChange(questionIndex, "answer", e.target.value)}
                className="w-full p-3 bg-[#0046c9] border-[#0046c9] text-white rounded-lg resize-none"
                rows={2}
                placeholder="Enter the answer..."
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Image URL (optional):</label>
              <div className="flex items-center gap-2">
                <div className="flex-grow relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <LinkIcon size={16} />
                  </div>
                  <Input
                    type="url"
                    value={question.imageUrl || ""}
                    onChange={(e) => handleQuestionChange(questionIndex, "imageUrl", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full pl-10 bg-[#0046c9] border-[#0046c9] text-white"
                  />
                </div>
                {question.imageUrl && (
                  <Button
                    onClick={() => removeImage(questionIndex)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 h-10 w-10"
                  >
                    <X size={18} />
                  </Button>
                )}
              </div>
              
              {question.imageUrl && !isValidUrl(question.imageUrl) && (
                <p className="text-red-400 text-sm mt-1">Please enter a valid URL</p>
              )}

              {question.imageUrl && isValidUrl(question.imageUrl) && (
                <div className="mt-3 relative w-full h-40 bg-[#0046c9] rounded-lg overflow-hidden">
                  <Image
                    src={question.imageUrl}
                    alt="Question image preview"
                    fill
                    style={{ objectFit: "contain" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-4 pt-4">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold py-6 text-lg shadow-lg"
        >
          <Save size={20} className="mr-2" /> Save Questions
        </Button>
      </div>
    </div>
  )
}
