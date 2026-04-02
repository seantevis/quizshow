"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, AlertCircle, X, LinkIcon } from "lucide-react"
import { saveCategories } from "@/app/actions/categories"
import { type Category, type Question, type FinalJeopardy } from "@/data/game-data"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface QuestionEditorProps {
  categoryIndex: number
  initialCategories: Category[]
  initialFinalJeopardy: FinalJeopardy | null
}

export default function QuestionEditor({ categoryIndex, initialCategories, initialFinalJeopardy }: QuestionEditorProps) {
  const [categories, setCategories] = useState<Category[]>(JSON.parse(JSON.stringify(initialCategories)))
  const [finalJeopardy, setFinalJeopardy] = useState<FinalJeopardy>(
    initialFinalJeopardy 
      ? JSON.parse(JSON.stringify(initialFinalJeopardy))
      : { category: "", question: "", answer: "", imageUrl: "" }
  )
  const [saveStatus, setSaveStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const category = categories[categoryIndex]

  const handleQuestionChange = (
    questionIndex: number,
    field: keyof Question,
    value: string | number | boolean,
  ) => {
    const newCategories = [...categories]

    if (field === "value" && typeof value === "string") {
      newCategories[categoryIndex].questions[questionIndex][field] = Number.parseInt(value as string, 10) || 0
    } else if (field === "isDailyDouble" && typeof value === "boolean") {
      newCategories[categoryIndex].questions[questionIndex][field] = value
    } else if (typeof value === "string") {
      newCategories[categoryIndex].questions[questionIndex][field as "question" | "answer" | "imageUrl"] = value
    }

    setCategories(newCategories)
  }

  const toggleDailyDouble = (questionIndex: number) => {
    const newCategories = [...categories]
    const currentValue = newCategories[categoryIndex].questions[questionIndex].isDailyDouble || false
    newCategories[categoryIndex].questions[questionIndex].isDailyDouble = !currentValue
    setCategories(newCategories)
  }

  const removeImage = (questionIndex: number) => {
    const newCategories = [...categories]
    newCategories[categoryIndex].questions[questionIndex].imageUrl = ""
    setCategories(newCategories)
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
      const result = await saveCategories(categories, finalJeopardy)

      if (result.success) {
        setSaveStatus({ message: "Questions saved successfully!", isError: false })
        router.refresh()
      } else {
        setSaveStatus({ message: result.error || "Failed to save questions", isError: true })
      }
    } catch (error) {
      setSaveStatus({ message: "An error occurred while saving", isError: true })
    }

    setIsLoading(false)

    setTimeout(() => {
      setSaveStatus(null)
    }, 3000)
  }

  const isValidUrl = (url: string): boolean => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch (error) {
      return false
    }
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
          <div key={questionIndex} className="bg-[#005AF2] p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <span className="text-white font-bold mr-2">Value:</span>
              <Input
                type="number"
                value={question.value}
                onChange={(e) => handleQuestionChange(questionIndex, "value", e.target.value)}
                className="w-24 bg-[#0046c9] border-[#0046c9] text-white"
              />

              <div className="ml-auto flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={question.isDailyDouble || false}
                    onChange={() => toggleDailyDouble(questionIndex)}
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
                onChange={(e) => handleQuestionChange(questionIndex, "question", e.target.value)}
                className="w-full p-2 bg-[#0046c9] border-[#0046c9] text-white rounded-lg"
                rows={2}
              />
            </div>

            <div className="mb-3">
              <label className="block text-white font-bold mb-1">Answer:</label>
              <textarea
                value={question.answer}
                onChange={(e) => handleQuestionChange(questionIndex, "answer", e.target.value)}
                className="w-full p-2 bg-[#0046c9] border-[#0046c9] text-white rounded-lg"
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
                    onChange={(e) => handleQuestionChange(questionIndex, "imageUrl", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full pl-8 bg-[#0046c9] border-[#0046c9] text-white"
                  />
                </div>
                {question.imageUrl && (
                  <Button
                    onClick={() => removeImage(questionIndex)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 h-8 w-8 flex-shrink-0"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
              {question.imageUrl && !isValidUrl(question.imageUrl) && (
                <p className="text-red-400 text-sm mt-1">Please enter a valid URL</p>
              )}

              {question.imageUrl && isValidUrl(question.imageUrl) && (
                <div className="mt-2 relative w-full h-40 bg-[#0046c9] rounded-lg overflow-hidden">
                  <Image
                    src={question.imageUrl || "/placeholder.svg"}
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

      <div className="sticky bottom-0 bg-[#00236A] p-4 border-t border-[#005AF2]">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold py-6 text-xl"
        >
          <Save size={20} className="mr-2" /> Save Questions
        </Button>
      </div>
    </div>
  )
}
