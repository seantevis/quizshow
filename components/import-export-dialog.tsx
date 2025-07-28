"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Download, Upload, X, FileText, Check } from "lucide-react"
import { importCategoriesFromCSV, getExportableCategories } from "@/app/actions/import-export"
import { categoriesToCSV } from "@/utils/csv-utils"
import { gameData, finalJeopardyData } from "@/data/game-data"
import { useRouter } from "next/navigation"

interface ImportExportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function ImportExportDialog({ isOpen, onClose }: ImportExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"import" | "export">("export")
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [exportStatus, setExportStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setCsvFile(files[0])
      setImportStatus(null)
    }
  }

  const handleImport = async () => {
    if (!csvFile) {
      setImportStatus({ message: "Please select a CSV file", isError: true })
      return
    }

    setIsLoading(true)
    setImportStatus({ message: "Importing...", isError: false })

    try {
      // Read the file content
      const fileContent = await csvFile.text()

      // Import the categories
      const result = await importCategoriesFromCSV(fileContent)

      if (result.success) {
        setImportStatus({ message: "Categories imported successfully!", isError: false })
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        setCsvFile(null)

        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh()
          onClose()
        }, 1500)
      } else {
        setImportStatus({ message: result.error || "Import failed", isError: true })
      }
    } catch (error) {
      setImportStatus({
        message: "Error reading file: " + (error instanceof Error ? error.message : String(error)),
        isError: true,
      })
    }

    setIsLoading(false)
  }

  const handleExport = async () => {
    setIsLoading(true)
    setExportStatus({ message: "Preparing export...", isError: false })

    try {
      // Get categories to export
      const { categories, finalJeopardy } = await getExportableCategories()

      // If no custom categories, use default game data
      const dataToExport = categories.length > 0 ? categories : gameData
      const finalJeopardyToExport = finalJeopardy || finalJeopardyData

      // Convert to CSV
      const csv = categoriesToCSV(dataToExport, finalJeopardyToExport)

      // Create a blob and download link
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "jeopardy-categories.csv")
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setExportStatus({ message: "Categories exported successfully!", isError: false })

      // Clear status after 3 seconds
      setTimeout(() => {
        setExportStatus(null)
      }, 3000)
    } catch (error) {
      setExportStatus({
        message: "Export failed: " + (error instanceof Error ? error.message : String(error)),
        isError: true,
      })
    }

    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-[#00236A] w-full max-w-md rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#f8d64e]">Import/Export Categories</h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#f8d64e] hover:text-[#f8d64e] hover:bg-[#005AF2] rounded-full w-10 h-10"
            onClick={onClose}
          >
            <X size={24} />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex mb-4 border-b border-[#0046c9]">
            <button
              className={`px-4 py-2 ${activeTab === "export" ? "text-[#f8d64e] border-b-2 border-[#f8d64e]" : "text-white"}`}
              onClick={() => setActiveTab("export")}
            >
              Export
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "import" ? "text-[#f8d64e] border-b-2 border-[#f8d64e]" : "text-white"}`}
              onClick={() => setActiveTab("import")}
            >
              Import
            </button>
          </div>

          {activeTab === "export" && (
            <div className="space-y-4">
              <p className="text-white">
                Export your current categories, questions, and Final Jeopardy to a CSV file. You can edit this file and
                import it back later.
              </p>

              <Button
                onClick={handleExport}
                disabled={isLoading}
                className="w-full bg-[#005AF2] hover:bg-[#0046c9] text-white py-6"
              >
                <Download size={18} className="mr-2" /> Export Categories to CSV
              </Button>

              {exportStatus && (
                <div
                  className={`p-4 rounded-lg ${exportStatus.isError ? "bg-red-600/20" : "bg-green-600/20"} flex items-center`}
                >
                  {exportStatus.isError ? (
                    <AlertCircle size={20} className="text-red-500 mr-2" />
                  ) : (
                    <Check size={20} className="text-green-500 mr-2" />
                  )}
                  <p className={exportStatus.isError ? "text-red-400" : "text-green-400"}>{exportStatus.message}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "import" && (
            <div className="space-y-4">
              <p className="text-white">
                Import categories, questions, and Final Jeopardy from a CSV file. The file should have the following
                columns:
              </p>

              <div className="bg-[#005AF2] p-3 rounded-lg text-white text-sm">
                <code>Type, Category, Value, Question, Answer, IsDailyDouble, ImageUrl</code>
              </div>

              <p className="text-white text-sm">
                The "Type" column should be either "Regular" for normal questions or "Final" for Final Jeopardy.
              </p>

              <div className="border-2 border-dashed border-[#005AF2] rounded-lg p-6 text-center">
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" ref={fileInputRef} />

                {csvFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText size={24} className="text-[#f8d64e]" />
                    <span className="text-white">{csvFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 p-1"
                      onClick={() => {
                        setCsvFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#005AF2] hover:bg-[#0046c9] text-white"
                  >
                    <Upload size={18} className="mr-2" /> Select CSV File
                  </Button>
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={isLoading || !csvFile}
                className="w-full bg-[#005AF2] hover:bg-[#0046c9] text-white py-6 disabled:opacity-50"
              >
                <Upload size={18} className="mr-2" /> Import Categories
              </Button>

              {importStatus && (
                <div
                  className={`p-4 rounded-lg ${importStatus.isError ? "bg-red-600/20" : "bg-green-600/20"} flex items-center`}
                >
                  {importStatus.isError ? (
                    <AlertCircle size={20} className="text-red-500 mr-2" />
                  ) : (
                    <Check size={20} className="text-green-500 mr-2" />
                  )}
                  <p className={importStatus.isError ? "text-red-400" : "text-green-400"}>{importStatus.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
