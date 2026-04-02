import CategoryEditor from "@/components/category-editor"
import { getCategories, getFinalJeopardy, testDatabaseConnection } from "../actions/categories"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DatabaseTestButton } from "@/components/database-test-button"

export default async function EditorPage() {
  // Get existing custom categories or use default ones
  const existingCategories = await getCategories()
  const existingFinalJeopardy = await getFinalJeopardy()
  
  // Test database connection on page load
  const dbTest = await testDatabaseConnection()

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#00236A]">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/" className="mr-4 bg-[#005AF2] hover:bg-[#0046c9] text-white p-2 rounded-full">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-[#f8d64e]">Question Editor</h1>
          </div>
          <DatabaseTestButton initialResult={dbTest} />
        </div>

        <CategoryEditor initialCategories={existingCategories} initialFinalJeopardy={existingFinalJeopardy} />
      </div>
    </main>
  )
}
