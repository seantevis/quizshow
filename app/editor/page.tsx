import { getCategories, getFinalJeopardy, testDatabaseConnection } from "../actions/categories"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DatabaseTestButton } from "@/components/database-test-button"
import { CategoryList } from "@/components/category-list"
import { gameData, finalJeopardyData } from "@/data/game-data"

export default async function EditorPage() {
  const existingCategories = await getCategories()
  const existingFinalJeopardy = await getFinalJeopardy()
  const dbTest = await testDatabaseConnection()

  const categories = existingCategories && existingCategories.length > 0 
    ? existingCategories 
    : gameData

  const finalJeopardy = existingFinalJeopardy || finalJeopardyData

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-[#00236A]">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="mr-4 bg-[#005AF2] hover:bg-[#0046c9] text-white p-2 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-[#f8d64e]">Edit Categories</h1>
          </div>
          <DatabaseTestButton initialResult={dbTest} />
        </div>

        <CategoryList 
          initialCategories={categories} 
          initialFinalJeopardy={finalJeopardy} 
        />
      </div>
    </main>
  )
}
