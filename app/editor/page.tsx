import CategoryEditor from "@/components/category-editor"
import { getCategories, getFinalJeopardy } from "../actions/categories"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditorPage() {
  // Get existing custom categories or use default ones
  const existingCategories = await getCategories()
  const existingFinalJeopardy = await getFinalJeopardy()

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#00236A]">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4 bg-[#005AF2] hover:bg-[#0046c9] text-white p-2 rounded-full">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-[#f8d64e]">Question Editor</h1>
        </div>

        <CategoryEditor initialCategories={existingCategories} initialFinalJeopardy={existingFinalJeopardy} />
      </div>
    </main>
  )
}
