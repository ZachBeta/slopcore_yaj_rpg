import { AudioManager } from './audio-manager';

/**
 * Class to create and manage audio controls in the UI
 */
export class AudioControls {
  private audioManager: AudioManager;
  private container: HTMLElement;
  private muteButton: HTMLButtonElement;
  private volumeSlider: HTMLInputElement;

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
      this.container.style.position = 'absolute';
      this.container.style.top = '10px';
      this.container.style.right = '10px';
      this.container.style.zIndex = '1000';
    } else if (position === 'bottom-right') {
      this.container.style.position = 'absolute';
      this.container.style.bottom = '10px';
      this.container.style.right = '10px';
      this.container.style.zIndex = '1000';
    } else if (position === 'inline') {
      // No special positioning for inline
      this.container.style.margin = '10px 0';
    }
    
    // Create the mute button
    this.muteButton = document.createElement('button');
    this.muteButton.className = 'btn audio-btn';
    this.updateMuteButtonText();
    this.muteButton.addEventListener('click', () => this.toggleMute());
    
    // Style the mute button
    this.muteButton.style.backgroundColor = '#333';
    this.muteButton.style.border = 'none';
    this.muteButton.style.color = '#fff';
    this.muteButton.style.padding = '5px 10px';
    this.muteButton.style.marginRight = '10px';
    this.muteButton.style.borderRadius = '4px';
    this.muteButton.style.cursor = 'pointer';
    
    // Create the volume slider
    this.volumeSlider = document.createElement('input');
    this.volumeSlider.type = 'range';
    this.volumeSlider.min = '0';
    this.volumeSlider.max = '1';
    this.volumeSlider.step = '0.1';
    this.volumeSlider.value = this.audioManager.getVolume().toString();
    this.volumeSlider.addEventListener('input', () => this.changeVolume());
    
    // Style the volume slider
    this.volumeSlider.style.width = '100px';
    this.volumeSlider.style.accentColor = '#00aaff';
    
    // Create a label for the controls
    const label = document.createElement('span');
    label.textContent = 'Music: ';
    label.style.color = '#fff';
    label.style.marginRight = '10px';
    label.style.fontSize = '14px';
    
    // Add elements to the container
    this.container.appendChild(label);
    this.container.appendChild(this.muteButton);
    this.container.appendChild(this.volumeSlider);
    
    // Add the container to the target
    targetContainer.appendChild(this.container);
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
    this.muteButton.textContent = this.audioManager.isMutedState() ? '🔇 Unmute' : '🔊 Mute';
  }
  
  /**
   * Handle volume slider changes
   */
  private changeVolume(): void {
    const newVolume = parseFloat(this.volumeSlider.value);
    this.audioManager.setVolume(newVolume);
  }
} 