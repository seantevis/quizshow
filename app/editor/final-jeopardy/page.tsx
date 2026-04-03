import { getFinalJeopardy } from "@/app/actions/categories"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FinalJeopardyEditor } from "@/components/final-jeopardy-editor"
import { finalJeopardyData } from "@/data/game-data"

export default async function FinalJeopardyPage() {
  const existingFinalJeopardy = await getFinalJeopardy()
  const finalJeopardy = existingFinalJeopardy || finalJeopardyData

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
          <h1 className="text-2xl md:text-3xl font-bold text-[#f8d64e]">Final Jeopardy</h1>
        </div>

        <FinalJeopardyEditor initialFinalJeopardy={finalJeopardy} />
      </div>
    </main>
  )
}
