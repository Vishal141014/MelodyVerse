// Helper function to load the YouTube API
export const loadYouTubeAPI = () => {
  return new Promise((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Not in browser environment'));
      return;
    }

    // If already loaded, resolve immediately
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    // Set up callback for when API is ready
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT) {
        resolve(window.YT);
      } else {
        reject(new Error('YouTube API failed to load'));
      }
    };

    // Check if script is already in DOM but not loaded yet
    if (document.getElementById('youtube-iframe-api')) {
      return; // Script is loading, just wait for callback
    }

    // Load API script
    try {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    } catch (error) {
      reject(error);
    }
  });
};

// Helper to safely create a YouTube player
export const createYouTubePlayer = (elementId, options) => {
  return new Promise((resolve, reject) => {
    loadYouTubeAPI()
      .then(YT => {
        try {
          const player = new YT.Player(elementId, options);
          resolve(player);
        } catch (error) {
          reject(error);
        }
      })
      .catch(reject);
  });
}; 