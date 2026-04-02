"use client"

import { useState } from "react"
import { testDatabaseConnection } from "@/app/actions/categories"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Database } from "lucide-react"

interface DatabaseTestResult {
  success: boolean
  message: string
  operations?: {
    write: string
    read: string
    delete: string
  }
  testData?: {
    written: { timestamp: string; message: string }
    read: { timestamp: string; message: string }
  }
  error?: string
}

interface DatabaseTestButtonProps {
  initialResult: DatabaseTestResult
}

export function DatabaseTestButton({ initialResult }: DatabaseTestButtonProps) {
  const [result, setResult] = useState<DatabaseTestResult>(initialResult)
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async () => {
    setIsLoading(true)
    try {
      const testResult = await testDatabaseConnection()
      setResult(testResult)
    } catch (error) {
      setResult({
        success: false,
        message: "Test failed",
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
        <Database className="w-4 h-4 text-white/70" />
        <span className="text-sm text-white/70">Database:</span>
        {result.success ? (
          <span className="flex items-center gap-1 text-sm text-green-400">
            <CheckCircle className="w-4 h-4" />
            Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm text-red-400">
            <XCircle className="w-4 h-4" />
            {result.error || "Disconnected"}
          </span>
        )}
      </div>
      <Button
        onClick={runTest}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Testing...
          </>
        ) : (
          "Re-test"
        )}
      </Button>
    </div>
  )
}
