/**
 * AudioManager class for handling background music and sound effects
 */
export class AudioManager {
  private static instance: AudioManager;
  private backgroundMusic: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of AudioManager
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize the audio system
   * @param track - Path to the MP3 file
   * @param loop - Whether to loop the track (default: true)
   */
  public initialize(track: string, loop: boolean = true): void {
    if (this.isInitialized) return;

    // Create a new audio element
    this.backgroundMusic = new Audio(track);
    this.backgroundMusic.loop = loop;
    this.backgroundMusic.volume = this.volume;

    // Apply mute state if needed
    if (this.isMuted) {
      this.backgroundMusic.muted = true;
    }

    this.isInitialized = true;
  }

  /**
   * Play background music after user interaction
   */
  public playBackgroundMusic(): void {
    if (!this.backgroundMusic) {
      console.error('Audio not initialized. Call initialize() first.');
      return;
    }

    // Play the music
    this.backgroundMusic.play().catch((error) => {
      console.error('Error playing background music:', error);
    });
  }

  /**
   * Stop the currently playing background music
   */
  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  /**
   * Play a sound effect once
   * @param sound - Path to the MP3 file
   * @param volume - Volume level (0-1, default: uses current volume setting)
   */
  public playSoundEffect(sound: string, volume?: number): void {
    const soundEffect = new Audio(sound);
    soundEffect.loop = false;
    soundEffect.volume = volume !== undefined ? volume : this.volume;

    if (this.isMuted) {
      soundEffect.muted = true;
    }

    soundEffect.play().catch((error) => {
      console.error('Error playing sound effect:', error);
    });
  }

  /**
   * Mute or unmute all audio
   * @param mute - Whether to mute (true) or unmute (false)
   */
  public setMute(mute: boolean): void {
    this.isMuted = mute;

    if (this.backgroundMusic) {
      this.backgroundMusic.muted = mute;
    }
  }

  /**
   * Toggle mute state
   * @returns The new mute state
   */
  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Set the volume for all audio
   * @param volume - Volume level (0-1)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));

    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.volume;
    }
  }

  /**
   * Get the current volume level
   * @returns Volume level (0-1)
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Check if audio is currently muted
   * @returns Mute state
   */
  public isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Check if audio is initialized
   * @returns Initialization state
   */
  public isInitializedState(): boolean {
    return this.isInitialized;
  }
}
