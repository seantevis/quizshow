"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, AlertCircle, LinkIcon, X } from "lucide-react"
import { getCategories, saveCategories } from "@/app/actions/categories"
import { gameData, type FinalJeopardy } from "@/data/game-data"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface FinalJeopardyEditorProps {
  initialFinalJeopardy: FinalJeopardy
}

export function FinalJeopardyEditor({ initialFinalJeopardy }: FinalJeopardyEditorProps) {
  const [finalJeopardy, setFinalJeopardy] = useState<FinalJeopardy>(
    JSON.parse(JSON.stringify(initialFinalJeopardy))
  )
  const [saveStatus, setSaveStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (field: keyof FinalJeopardy, value: string) => {
    setFinalJeopardy(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const removeImage = () => {
    setFinalJeopardy(prev => ({
      ...prev,
      imageUrl: "",
    }))
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
    if (!finalJeopardy.category.trim() || !finalJeopardy.question.trim() || !finalJeopardy.answer.trim()) {
      setSaveStatus({
        message: "Category, question, and answer cannot be empty",
        isError: true,
      })
      return
    }

    setIsLoading(true)
    setSaveStatus({ message: "Saving...", isError: false })

    try {
      const existingCategories = await getCategories()
      const categories = existingCategories && existingCategories.length > 0 
        ? existingCategories
        : gameData

      const result = await saveCategories(categories, finalJeopardy)

      if (result.success) {
        setSaveStatus({ message: "Final Jeopardy saved successfully!", isError: false })
        router.refresh()
      } else {
        setSaveStatus({ message: result.error || "Failed to save", isError: true })
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

      <div className="bg-[#f8d64e] p-6 rounded-lg space-y-5">
        <div>
          <label className="block text-[#00236A] font-bold mb-2">Category:</label>
          <Input
            value={finalJeopardy.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="bg-white border-[#00236A]/20 text-[#00236A] text-lg"
            placeholder="Final Jeopardy Category"
          />
        </div>

        <div>
          <label className="block text-[#00236A] font-bold mb-2">Question:</label>
          <textarea
            value={finalJeopardy.question}
            onChange={(e) => handleChange("question", e.target.value)}
            className="w-full p-3 bg-white border border-[#00236A]/20 text-[#00236A] rounded-lg resize-none"
            rows={4}
            placeholder="Enter the Final Jeopardy question..."
          />
        </div>

        <div>
          <label className="block text-[#00236A] font-bold mb-2">Answer:</label>
          <textarea
            value={finalJeopardy.answer}
            onChange={(e) => handleChange("answer", e.target.value)}
            className="w-full p-3 bg-white border border-[#00236A]/20 text-[#00236A] rounded-lg resize-none"
            rows={2}
            placeholder="Enter the answer..."
          />
        </div>

        <div>
          <label className="block text-[#00236A] font-bold mb-2">Image URL (optional):</label>
          <div className="flex items-center gap-2">
            <div className="flex-grow relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00236A]/50">
                <LinkIcon size={16} />
              </div>
              <Input
                type="url"
                value={finalJeopardy.imageUrl || ""}
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full pl-10 bg-white border-[#00236A]/20 text-[#00236A]"
              />
            </div>
            {finalJeopardy.imageUrl && (
              <Button
                onClick={removeImage}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 h-10 w-10"
              >
                <X size={18} />
              </Button>
            )}
          </div>
          
          {finalJeopardy.imageUrl && !isValidUrl(finalJeopardy.imageUrl) && (
            <p className="text-red-600 text-sm mt-1">Please enter a valid URL</p>
          )}

          {finalJeopardy.imageUrl && isValidUrl(finalJeopardy.imageUrl) && (
            <div className="mt-3 relative w-full h-48 bg-white rounded-lg overflow-hidden">
              <Image
                src={finalJeopardy.imageUrl}
                alt="Final Jeopardy image preview"
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

      {/* Save Button */}
      <div className="sticky bottom-4 pt-4">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold py-6 text-lg shadow-lg"
        >
          <Save size={20} className="mr-2" /> Save Final Jeopardy
        </Button>
      </div>
    </div>
  )
}
