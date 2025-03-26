// YouTube IFrame API TypeScript declarations
interface YTPlayerOptions {
  height?: string | number;
  width?: string | number;
  videoId?: string;
  playerVars?: {
    autoplay?: number;
    controls?: number;
    disablekb?: number;
    fs?: number;
    modestbranding?: number;
    playsinline?: number;
    rel?: number;
    origin?: string;
    [key: string]: any;
  };
  events?: {
    onReady?: (event: YT.PlayerEvent) => void;
    onStateChange?: (event: YT.PlayerEvent) => void;
    onError?: (event: YT.PlayerEvent) => void;
    [key: string]: any;
  };
}

declare namespace YT {
  class Player {
    constructor(elementId: string | HTMLElement, options: YTPlayerOptions);
    
    // Player methods
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    loadVideoById(videoId: string | { videoId: string, startSeconds?: number }): void;
    cueVideoById(videoId: string | { videoId: string, startSeconds?: number }): void;
    
    // Getters
    getCurrentTime(): number;
    getDuration(): number;
    getVideoData(): { title: string, video_id: string };
    getPlayerState(): number;
    
    // Destruction
    destroy(): void;
  }
  
  interface PlayerEvent {
    target: Player;
    data?: any;
  }
  
  interface PlayerState {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  }
}

declare global {
  interface Window {
    YT: {
      Player: typeof YT.Player;
      PlayerState: YT.PlayerState;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export {}; 