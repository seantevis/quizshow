"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Menu,
  X,
  FileEdit,
  Trash2,
  Edit2,
  LinkIcon,
  EyeOff,
  FileDown,
  AlertTriangle,
} from "lucide-react"
import PlayerManagement, { type Player } from "./player-management"
import { useRouter } from "next/navigation"
import Image from "next/image"
import ImportExportDialog from "./import-export-dialog"
import { clearAllData, emergencyClearAll } from "@/app/actions/categories"
import Link from "next/link"

interface SettingsMenuProps {
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  activePlayer: string | null
  setActivePlayer: React.Dispatch<React.SetStateAction<string | null>>
  answeredQuestions: Set<string>
  setAnsweredQuestions: React.Dispatch<React.SetStateAction<Set<string>>>
  customCategories?: any[]
  gameName: string
  setGameName: React.Dispatch<React.SetStateAction<string>>
  gameTitleImage: string
  setGameTitleImage: React.Dispatch<React.SetStateAction<string>>
  useImageAsTitle: boolean
  setUseImageAsTitle: React.Dispatch<React.SetStateAction<boolean>>
  hideGameTitle: boolean
  setHideGameTitle: React.Dispatch<React.SetStateAction<boolean>>
}

export default function SettingsMenu({
  players,
  setPlayers,
  activePlayer,
  setActivePlayer,
  answeredQuestions,
  setAnsweredQuestions,
  customCategories,
  gameName,
  setGameName,
  gameTitleImage,
  setGameTitleImage,
  useImageAsTitle,
  setUseImageAsTitle,
  hideGameTitle,
  setHideGameTitle,
}: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [isEditingGameName, setIsEditingGameName] = useState(false)
  const [tempGameName, setTempGameName] = useState(gameName)
  const [tempGameTitleImage, setTempGameTitleImage] = useState(gameTitleImage)
  const [tempUseImageAsTitle, setTempUseImageAsTitle] = useState(useImageAsTitle)
  const [tempHideGameTitle, setTempHideGameTitle] = useState(hideGameTitle)
  const [imagePreviewError, setImagePreviewError] = useState(false)
  const router = useRouter()
  const [showImportExport, setShowImportExport] = useState(false)

  // Initialize save game name with current game name
  useEffect(() => {}, [gameName])

  const handleGameNameChange = () => {
    if (tempGameName.trim()) {
      setGameName(tempGameName.trim())
      setGameTitleImage(tempGameTitleImage)
      setUseImageAsTitle(tempUseImageAsTitle)
      setHideGameTitle(tempHideGameTitle)

      // Save to localStorage
      try {
        localStorage.setItem("walpeordy-game-name", tempGameName.trim())
        localStorage.setItem("walpeordy-game-title-image", tempGameTitleImage)
        localStorage.setItem("walpeordy-use-image-as-title", tempUseImageAsTitle.toString())
        localStorage.setItem("walpeordy-hide-game-title", tempHideGameTitle.toString())
      } catch (error) {
        console.warn("Could not save game settings to localStorage")
      }
    } else {
      setTempGameName(gameName) // Reset to current name if empty
    }
    setIsEditingGameName(false)
    setImagePreviewError(false)
  }

  const handleGameNameCancel = () => {
    setTempGameName(gameName)
    setTempGameTitleImage(gameTitleImage)
    setTempUseImageAsTitle(useImageAsTitle)
    setTempHideGameTitle(hideGameTitle)
    setIsEditingGameName(false)
    setImagePreviewError(false)
  }

  const handleImageError = () => {
    setImagePreviewError(true)
  }

  // Function to validate if a string is a valid URL
  const isValidUrl = (url: string): boolean => {
    if (!url) return true // Empty URL is valid (no image)
    try {
      new URL(url)
      return true
    } catch (error) {
      return false
    }
  }

  const handleClearAllData = async () => {
    if (
      confirm("Are you sure you want to clear all custom categories and final jeopardy data? This cannot be undone.")
    ) {
      setIsLoading(true)
      const result = await clearAllData()

      if (result.success) {
        setSaveMessage("All data cleared successfully!")
        // Refresh the page to reload with default data
        setTimeout(() => {
          router.refresh()
          setIsOpen(false)
        }, 1500)
      } else {
        setSaveMessage("Failed to clear data")
      }

      setIsLoading(false)

      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage("")
      }, 3000)
    }
  }

  const handleEmergencyClear = async () => {
    if (
      confirm(
        "EMERGENCY CLEAR: This will delete ALL stored data including saved games. Are you absolutely sure? This cannot be undone.",
      )
    ) {
      setIsLoading(true)
      setSaveMessage("Emergency clearing all data...")

      const result = await emergencyClearAll()

      if (result.success) {
        setSaveMessage(`Emergency clear successful! Cleared ${result.clearedKeys} items.`)
        // Refresh the page to reload with default data
        setTimeout(() => {
          router.refresh()
          setIsOpen(false)
        }, 2000)
      } else {
        setSaveMessage("Emergency clear failed")
      }

      setIsLoading(false)

      // Clear message after 5 seconds
      setTimeout(() => {
        setSaveMessage("")
      }, 5000)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 bg-[#005AF2] text-[#f8d64e] hover:bg-[#0046c9] hover:text-[#f8d64e] rounded-full w-12 h-12"
        onClick={() => setIsOpen(true)}
      >
        <Menu size={24} />
        <span className="sr-only">Settings</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-end">
          <div className="bg-[#00236A] w-full max-w-md h-full overflow-y-auto p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#f8d64e]">Game Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#f8d64e] hover:text-[#f8d64e] hover:bg-[#005AF2] rounded-full w-10 h-10"
                onClick={() => setIsOpen(false)}
              >
                <X size={24} />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <div className="space-y-6">
              {/* Game Name Editor */}
              <div className="bg-[#005AF2] p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">Game Title</h3>
                  {!isEditingGameName && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#f8d64e] hover:text-white p-1 h-8 w-8"
                      onClick={() => {
                        setIsEditingGameName(true)
                        setTempGameName(gameName)
                        setTempGameTitleImage(gameTitleImage)
                        setTempUseImageAsTitle(useImageAsTitle)
                        setTempHideGameTitle(hideGameTitle)
                      }}
                    >
                      <Edit2 size={16} />
                      <span className="sr-only">Edit Game Title</span>
                    </Button>
                  )}
                </div>

                {isEditingGameName ? (
                  <div className="space-y-4">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="hideGameTitle"
                        checked={tempHideGameTitle}
                        onChange={(e) => setTempHideGameTitle(e.target.checked)}
                        className="mr-2 h-4 w-4"
                      />
                      <label htmlFor="hideGameTitle" className="text-white cursor-pointer flex items-center">
                        <EyeOff size={16} className="mr-1" /> Hide game title
                      </label>
                    </div>

                    {!tempHideGameTitle && (
                      <>
                        <div>
                          <label className="block text-white text-sm mb-1">Title Text:</label>
                          <Input
                            value={tempGameName}
                            onChange={(e) => setTempGameName(e.target.value)}
                            className="bg-[#0046c9] border-[#0046c9] text-white"
                            placeholder="Enter game title"
                          />
                        </div>

                        <div>
                          <label className="block text-white text-sm mb-1">Title Image URL:</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-grow relative">
                              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <LinkIcon size={16} />
                              </div>
                              <Input
                                value={tempGameTitleImage}
                                onChange={(e) => setTempGameTitleImage(e.target.value)}
                                className="pl-8 bg-[#0046c9] border-[#0046c9] text-white"
                                placeholder="https://example.com/image.jpg"
                              />
                            </div>
                          </div>
                          {tempGameTitleImage && !isValidUrl(tempGameTitleImage) && (
                            <p className="text-red-400 text-sm mt-1">Please enter a valid URL</p>
                          )}
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="useImageAsTitle"
                            checked={tempUseImageAsTitle}
                            onChange={(e) => setTempUseImageAsTitle(e.target.checked)}
                            className="mr-2 h-4 w-4"
                          />
                          <label htmlFor="useImageAsTitle" className="text-white cursor-pointer">
                            Use image as title
                          </label>
                        </div>

                        {/* Image Preview */}
                        {tempGameTitleImage && tempUseImageAsTitle && isValidUrl(tempGameTitleImage) && (
                          <div className="mt-2">
                            <p className="text-white text-sm mb-1">Preview:</p>
                            <div className="relative w-full h-20 bg-[#00236A] rounded-lg overflow-hidden">
                              {!imagePreviewError ? (
                                <Image
                                  src={tempGameTitleImage || "/placeholder.svg"}
                                  alt="Title image preview"
                                  fill
                                  style={{ objectFit: "contain" }}
                                  onError={handleImageError}
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-red-400">
                                  <span>Image failed to load</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleGameNameChange}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={handleGameNameCancel}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {hideGameTitle ? (
                      <div className="flex items-center text-gray-400">
                        <EyeOff size={16} className="mr-2" />
                        <span>Game title is hidden</span>
                      </div>
                    ) : useImageAsTitle && gameTitleImage ? (
                      <div className="relative w-full h-16 bg-[#0046c9] rounded-lg overflow-hidden">
                        <Image
                          src={gameTitleImage || "/placeholder.svg"}
                          alt={gameName}
                          fill
                          style={{ objectFit: "contain" }}
                          onError={() => {
                            // If image fails to load, show the text title
                            setUseImageAsTitle(false)
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-[#f8d64e] font-bold text-xl">{gameName}</p>
                    )}
                  </div>
                )}
              </div>

              <Link href="/editor" className="block">
                <Button className="w-full bg-[#005AF2] hover:bg-[#0046c9] text-white">
                  <FileEdit size={18} className="mr-2" /> Edit Questions & Categories
                </Button>
              </Link>

              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={handleClearAllData}
                disabled={isLoading}
              >
                <Trash2 size={18} className="mr-2" /> Clear All Data
              </Button>

              <Button
                className="w-full bg-[#005AF2] hover:bg-[#0046c9] text-white"
                onClick={() => setShowImportExport(true)}
              >
                <FileDown size={18} className="mr-2" /> Import/Export Categories
              </Button>

              <Button
                className="w-full bg-red-800 hover:bg-red-900 text-white border-2 border-red-600"
                onClick={handleEmergencyClear}
                disabled={isLoading}
              >
                <AlertTriangle size={18} className="mr-2" /> Emergency Clear All
              </Button>

              <div className="bg-[#005AF2] p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Player Management</h3>
                <PlayerManagement
                  players={players}
                  setPlayers={setPlayers}
                  activePlayer={activePlayer}
                  setActivePlayer={setActivePlayer}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {showImportExport && <ImportExportDialog isOpen={showImportExport} onClose={() => setShowImportExport(false)} />}
    </>
  )
}
