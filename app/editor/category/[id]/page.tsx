import { getCategories, getFinalJeopardy } from "@/app/actions/categories"
import QuestionEditor from "@/components/question-editor"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function CategoryQuestionsPage({ params }: Props) {
  const { id } = await params
  const categoryIndex = parseInt(id, 10)
  
  const categories = await getCategories()
  const finalJeopardy = await getFinalJeopardy()
  
  if (!categories || categoryIndex < 0 || categoryIndex >= categories.length) {
    notFound()
  }
  
  const category = categories[categoryIndex]

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#00236A]">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/editor" className="mr-4 bg-[#005AF2] hover:bg-[#0046c9] text-white p-2 rounded-full">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-[#f8d64e]">{category.category}</h1>
        </div>

        <QuestionEditor 
          categoryIndex={categoryIndex}
          initialCategories={categories}
          initialFinalJeopardy={finalJeopardy}
        />
      </div>
    </main>
  )
}
