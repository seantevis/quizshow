"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Save, Trash2, List, AlertCircle, Star } from "lucide-react"
import { saveCategories } from "@/app/actions/categories"
import { type Category, type FinalJeopardy } from "@/data/game-data"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface CategoryListProps {
  initialCategories: Category[]
  initialFinalJeopardy: FinalJeopardy
}

export function CategoryList({ initialCategories, initialFinalJeopardy }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>(
    JSON.parse(JSON.stringify(initialCategories))
  )
  const [saveStatus, setSaveStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCategoryChange = (index: number, value: string) => {
    const newCategories = [...categories]
    newCategories[index].category = value
    setCategories(newCategories)
  }

  const addCategory = () => {
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
    if (categories.length <= 1) return
    const newCategories = [...categories]
    newCategories.splice(index, 1)
    setCategories(newCategories)
  }

  const handleSave = async () => {
    for (const category of categories) {
      if (!category.category.trim()) {
        setSaveStatus({
          message: "Category names cannot be empty",
          isError: true,
        })
        return
      }
    }

    setIsLoading(true)
    setSaveStatus({ message: "Saving...", isError: false })

    try {
      const result = await saveCategories(categories, initialFinalJeopardy)

      if (result.success) {
        setSaveStatus({ message: "Categories saved successfully!", isError: false })
        router.refresh()
      } else {
        setSaveStatus({ message: result.error || "Failed to save categories", isError: true })
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

  const getQuestionsFilledCount = (category: Category) => {
    return category.questions.filter(q => q.question.trim() && q.answer.trim()).length
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

      <div className="space-y-3">
        {categories.map((category, index) => (
          <div 
            key={index} 
            className="flex items-center gap-3 bg-[#005AF2] p-4 rounded-lg"
          >
            <div className="flex-1">
              <Input
                value={category.category}
                onChange={(e) => handleCategoryChange(index, e.target.value)}
                className="bg-[#0046c9] border-[#0046c9] text-white text-lg font-medium"
                placeholder="Category Name"
              />
              <p className="text-white/60 text-sm mt-1">
                {getQuestionsFilledCount(category)} of {category.questions.length} questions filled
              </p>
            </div>
            
            <Link href={`/editor/${index}`}>
              <Button
                className="bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-medium"
              >
                <List size={18} className="mr-2" /> Questions
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
              onClick={() => removeCategory(index)}
              disabled={categories.length <= 1}
            >
              <Trash2 size={20} />
            </Button>
          </div>
        ))}
      </div>

      <Button
        onClick={addCategory}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-6"
      >
        <Plus size={20} className="mr-2" /> Add New Category
      </Button>

      {/* Final Jeopardy Link */}
      <Link href="/editor/final-jeopardy" className="block">
        <div className="bg-[#f8d64e] p-4 rounded-lg flex items-center justify-between hover:bg-[#e9c73f] transition-colors">
          <div className="flex items-center">
            <Star size={24} className="text-[#00236A] mr-3" />
            <div>
              <h3 className="text-[#00236A] font-bold text-lg">Final Jeopardy</h3>
              <p className="text-[#00236A]/70 text-sm">{initialFinalJeopardy.category}</p>
            </div>
          </div>
          <Button className="bg-[#00236A] hover:bg-[#001a4d] text-white">
            Edit
          </Button>
        </div>
      </Link>

      {/* Save Button */}
      <div className="sticky bottom-4 pt-4">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-[#f8d64e] hover:bg-[#e9c73f] text-[#00236A] font-bold py-6 text-lg shadow-lg"
        >
          <Save size={20} className="mr-2" /> Save All Categories
        </Button>
      </div>
    </div>
  )
}
