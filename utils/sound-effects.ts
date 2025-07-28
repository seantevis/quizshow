// Sound effect utility for managing game sounds

class SoundEffects {
  private sounds: { [key: string]: HTMLAudioElement | null } = {}
  private muted = false
  private soundsLoaded = false

  constructor() {
    // Initialize with null values first
    this.sounds = {
      select: null,
      reveal: null,
      correct: null,
      incorrect: null,
      boardFill: null,
      dailyDouble: null,
      thinkMusic: null,
    }

    // We'll load sounds on demand instead of all at once
    this.initializeSounds()
  }

  private initializeSounds(): void {
    // Only initialize in browser environment
    if (typeof window === "undefined") return

    try {
      // Create audio elements but don't set sources yet
      Object.keys(this.sounds).forEach((key) => {
        this.sounds[key] = new Audio()
      })

      this.soundsLoaded = true
    } catch (error) {
      console.error("Error initializing sounds:", error)
      this.soundsLoaded = false
    }
  }

  // Load a specific sound on demand
  private loadSound(soundName: string): void {
    if (!this.soundsLoaded || !this.sounds[soundName]) return

    try {
      const audio = this.sounds[soundName] as HTMLAudioElement

      // Only set source if not already set
      if (!audio.src) {
        audio.src = `/sounds/${soundName}.mp3`

        // Add error handling
        audio.onerror = () => {
          console.warn(`Could not load sound: ${soundName}`)
          // Set to null so we don't try to play it
          this.sounds[soundName] = null
        }
      }
    } catch (error) {
      console.error(`Error loading sound ${soundName}:`, error)
      this.sounds[soundName] = null
    }
  }

  play(soundName: string): void {
    if (this.muted || !this.soundsLoaded) return

    // Try to load the sound if it hasn't been loaded yet
    if (this.sounds[soundName] && !this.sounds[soundName]?.src) {
      this.loadSound(soundName)
    }

    // If sound is null or not loaded, just return silently
    if (!this.sounds[soundName]) return

    try {
      const audio = this.sounds[soundName] as HTMLAudioElement

      // Reset the audio to the beginning
      audio.currentTime = 0

      // Play the sound with error handling
      audio.play().catch((error) => {
        console.warn(`Error playing sound ${soundName}:`, error)
      })
    } catch (error) {
      console.warn(`Could not play sound: ${soundName}`)
    }
  }

  stop(soundName: string): void {
    if (!this.soundsLoaded || !this.sounds[soundName]) return

    try {
      const audio = this.sounds[soundName] as HTMLAudioElement
      audio.pause()
      audio.currentTime = 0
    } catch (error) {
      console.warn(`Could not stop sound: ${soundName}`)
    }
  }

  stopAll(): void {
    if (!this.soundsLoaded) return

    Object.values(this.sounds).forEach((audio) => {
      if (audio) {
        try {
          audio.pause()
          audio.currentTime = 0
        } catch (error) {
          // Silently fail for individual sounds
        }
      }
    })
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (muted) {
      this.stopAll()
    }
  }

  isMuted(): boolean {
    return this.muted
  }
}

// Create a singleton instance
const soundEffects = new SoundEffects()

export default soundEffects
