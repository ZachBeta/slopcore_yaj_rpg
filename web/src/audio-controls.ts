import { AudioManager } from './audio-manager';

/**
 * Class to create and manage audio controls in the UI
 */
export class AudioControls {
  private audioManager: AudioManager;
  private container: HTMLElement;
  private muteButton: HTMLButtonElement;
  private volumeSlider: HTMLInputElement;
  private playButton: HTMLButtonElement;
  private isPlaying: boolean = false;

  /**
   * Create audio controls and add them to a container element
   * @param containerId - The ID of the element to add controls to
   * @param position - Position to attach controls ('top-right', 'bottom-right', 'inline', etc.)
   */
  constructor(containerId: string, position: string = 'top-right') {
    this.audioManager = AudioManager.getInstance();

    // Find the container element
    const targetContainer = document.getElementById(containerId);
    if (!targetContainer) {
      console.error(`Container with ID '${containerId}' not found`);
      throw new Error(`Container with ID '${containerId}' not found`);
    }

    // Create a container for the audio controls
    this.container = document.createElement('div');
    this.container.className = 'audio-controls';

    // Style the container based on position
    if (position === 'top-right') {
      this.container.style.position = 'fixed'; // Changed to fixed to stay on top
      this.container.style.top = '10px';
      this.container.style.right = '10px';
      this.container.style.zIndex = '10000'; // Increased z-index to stay on top
      this.container.style.display = 'flex';
      this.container.style.alignItems = 'center';
      this.container.style.gap = '8px';
      this.container.style.background = 'rgba(0, 0, 0, 0.5)';
      this.container.style.padding = '5px 10px';
      this.container.style.borderRadius = '20px';
      this.container.style.backdropFilter = 'blur(5px)';
    }

    // Create the play button
    this.playButton = document.createElement('button');
    this.playButton.className = 'audio-btn';
    this.playButton.innerHTML = '▶️';
    this.playButton.addEventListener('click', () => this.togglePlay());

    // Style the play button
    this.playButton.style.background = 'none';
    this.playButton.style.border = 'none';
    this.playButton.style.color = '#fff';
    this.playButton.style.padding = '0';
    this.playButton.style.width = '24px';
    this.playButton.style.height = '24px';
    this.playButton.style.cursor = 'pointer';
    this.playButton.style.display = 'flex';
    this.playButton.style.alignItems = 'center';
    this.playButton.style.justifyContent = 'center';
    this.playButton.style.fontSize = '16px';

    // Create the mute button
    this.muteButton = document.createElement('button');
    this.muteButton.className = 'audio-btn';
    this.updateMuteButtonText();
    this.muteButton.addEventListener('click', () => this.toggleMute());

    // Style the mute button
    this.muteButton.style.background = 'none';
    this.muteButton.style.border = 'none';
    this.muteButton.style.color = '#fff';
    this.muteButton.style.padding = '0';
    this.muteButton.style.width = '24px';
    this.muteButton.style.height = '24px';
    this.muteButton.style.cursor = 'pointer';
    this.muteButton.style.display = 'flex';
    this.muteButton.style.alignItems = 'center';
    this.muteButton.style.justifyContent = 'center';
    this.muteButton.style.fontSize = '16px';

    // Create the volume slider
    this.volumeSlider = document.createElement('input');
    this.volumeSlider.type = 'range';
    this.volumeSlider.min = '0';
    this.volumeSlider.max = '1';
    this.volumeSlider.step = '0.1';
    this.volumeSlider.value = this.audioManager.getVolume().toString();
    this.volumeSlider.addEventListener('input', () => this.changeVolume());

    // Style the volume slider
    this.volumeSlider.style.width = '60px';
    this.volumeSlider.style.height = '4px';
    this.volumeSlider.style.accentColor = '#00aaff';
    this.volumeSlider.style.cursor = 'pointer';

    // Add elements to the container
    this.container.appendChild(this.playButton);
    this.container.appendChild(this.muteButton);
    this.container.appendChild(this.volumeSlider);

    // Add the container to the target
    targetContainer.appendChild(this.container);

    // Initialize audio system
    this.audioManager.initialize('/audio/the_netrunner2.mp3', true);
  }

  /**
   * Toggle play state and update the button text
   */
  private togglePlay(): void {
    if (this.isPlaying) {
      this.audioManager.stopBackgroundMusic();
      this.playButton.innerHTML = '▶️';
    } else {
      this.audioManager.playBackgroundMusic();
      this.playButton.innerHTML = '⏸️';
    }

    this.isPlaying = !this.isPlaying;
  }

  /**
   * Toggle mute state and update the button text
   */
  private toggleMute(): void {
    const newMuteState = this.audioManager.toggleMute();
    this.updateMuteButtonText();
  }

  /**
   * Update mute button text based on current state
   */
  private updateMuteButtonText(): void {
    this.muteButton.innerHTML = this.audioManager.isMutedState() ? '🔇' : '🔊';
  }

  /**
   * Handle volume slider changes
   */
  private changeVolume(): void {
    const newVolume = parseFloat(this.volumeSlider.value);
    this.audioManager.setVolume(newVolume);
  }
}
