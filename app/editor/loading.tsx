import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditorLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#00236A]">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4 bg-[#005AF2] hover:bg-[#0046c9] text-white p-2 rounded-full">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-[#f8d64e]">Question Editor</h1>
        </div>

        {/* Loading skeleton */}
        <div className="space-y-8 animate-pulse">
          {/* Action buttons skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-10 w-36 bg-[#005AF2] rounded-lg" />
            <div className="flex gap-4">
              <div className="h-10 w-32 bg-[#005AF2] rounded-lg" />
              <div className="h-10 w-36 bg-[#f8d64e]/50 rounded-lg" />
            </div>
          </div>

          {/* Categories skeleton */}
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#005AF2] p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-grow h-10 bg-[#0046c9] rounded-lg" />
                  <div className="h-10 w-28 bg-[#f8d64e]/50 rounded-lg" />
                  <div className="h-10 w-10 bg-red-600/50 rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Final Jeopardy skeleton */}
          <div className="bg-[#f8d64e]/50 p-4 rounded-lg">
            <div className="h-8 w-40 bg-[#00236A]/30 rounded mb-4" />
            <div className="bg-[#005AF2] p-4 rounded-lg space-y-4">
              <div className="h-10 bg-[#0046c9] rounded-lg" />
              <div className="h-24 bg-[#0046c9] rounded-lg" />
              <div className="h-16 bg-[#0046c9] rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
