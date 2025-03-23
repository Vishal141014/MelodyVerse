/**
 * Play a sound effect with given volume
 * @param soundName Name of the sound file (without extension)
 * @param volume Volume level (0-1)
 */
export const playSound = (soundName: string, volume: number = 0.5): void => {
  try {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = Math.min(Math.max(volume, 0), 1); // Ensure volume is between 0-1
    
    // Some browsers require user interaction before playing audio
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error('Error playing sound:', error);
      });
    }
  } catch (error) {
    console.error('Error creating audio element:', error);
  }
};

// Predefined sounds with default volumes
export const Sounds = {
  message: () => playSound('message', 0.2),
  notification: () => playSound('notification', 0.3),
  connect: () => playSound('connect', 0.4),
  disconnect: () => playSound('disconnect', 0.3),
  error: () => playSound('error', 0.4),
}; 