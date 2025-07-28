"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import soundEffects from "@/utils/sound-effects"

type SoundContextType = {
  muted: boolean
  toggleMute: () => void
  playSound: (sound: string) => void
  stopSound: (sound: string) => void
  stopAllSounds: () => void
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Check if sound was previously muted
    try {
      const savedMuted = localStorage.getItem("walpeordy-muted")
      if (savedMuted) {
        const isMuted = savedMuted === "true"
        setMuted(isMuted)
        soundEffects.setMuted(isMuted)
      }
    } catch (error) {
      // If localStorage is not available, just continue
      console.warn("Could not access localStorage for sound preferences")
    }
  }, [])

  const toggleMute = () => {
    const newMuted = !muted
    setMuted(newMuted)
    soundEffects.setMuted(newMuted)

    // Save preference
    if (isClient) {
      try {
        localStorage.setItem("walpeordy-muted", String(newMuted))
      } catch (error) {
        // If localStorage is not available, just continue
        console.warn("Could not save sound preferences")
      }
    }
  }

  const playSound = (sound: string) => {
    try {
      soundEffects.play(sound)
    } catch (error) {
      // Silently fail if sound can't be played
    }
  }

  const stopSound = (sound: string) => {
    try {
      soundEffects.stop(sound)
    } catch (error) {
      // Silently fail if sound can't be stopped
    }
  }

  const stopAllSounds = () => {
    try {
      soundEffects.stopAll()
    } catch (error) {
      // Silently fail if sounds can't be stopped
    }
  }

  return (
    <SoundContext.Provider value={{ muted, toggleMute, playSound, stopSound, stopAllSounds }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const context = useContext(SoundContext)
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider")
  }
  return context
}
