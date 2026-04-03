import { getCategories } from "@/app/actions/categories"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { QuestionEditor } from "@/components/question-editor"
import { gameData } from "@/data/game-data"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ categoryIndex: string }>
}

export default async function QuestionsPage({ params }: PageProps) {
  const { categoryIndex } = await params
  const index = parseInt(categoryIndex, 10)
  
  const existingCategories = await getCategories()
  const categories = existingCategories && existingCategories.length > 0 
    ? existingCategories 
    : gameData

  if (isNaN(index) || index < 0 || index >= categories.length) {
    notFound()
  }

  const category = categories[index]

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-[#00236A]">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link 
            href="/editor" 
            className="mr-4 bg-[#005AF2] hover:bg-[#0046c9] text-white p-2 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <p className="text-white/70 text-sm">Editing Questions for</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[#f8d64e]">{category.category}</h1>
          </div>
        </div>

        <QuestionEditor 
          categoryIndex={index}
          initialCategory={category}
          totalCategories={categories.length}
        />
      </div>
    </main>
  )
}
