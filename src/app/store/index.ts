import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Video type interface
interface Video {
  id: string;
  title: string;
  thumbnail?: string;
}

// Message type interface
interface Message {
  roomId: string;
  message: string;
  senderId: string;
  type: 'text' | 'gif' | 'sticker' | 'image';
  content?: string | null;
  timestamp: string;
}

// Music Store interface
interface MusicStore {
  // State
  currentVideoId: string | null;
  currentVideoTitle: string;
  isPlaying: boolean;
  volume: number;
  playlist: Video[];
  darkMode: boolean;
  username: string;
  avatarColor: string;
  
  // Actions
  setCurrentVideo: (videoId: string, videoTitle: string) => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  addToPlaylist: (video: Video) => void;
  removeFromPlaylist: (videoId: string) => void;
  clearPlaylist: () => void;
  setDarkMode: (dark: boolean) => void;
  setUsername: (name: string) => void;
  setAvatarColor: (color: string) => void;
}

// Main store for music and user state
export const useStore = create<MusicStore>()(
  persist(
    (set, get) => ({
      // Music state
      currentVideoId: null,
      currentVideoTitle: "No track playing",
      isPlaying: false,
      volume: 70,
      playlist: [],
      
      // Set current video
      setCurrentVideo: (videoId, videoTitle) => set({ 
        currentVideoId: videoId, 
        currentVideoTitle: videoTitle
      }),
      
      // Set play state
      setPlaying: (isPlaying) => set({ isPlaying }),
      
      // Set volume
      setVolume: (volume) => set({ volume }),
      
      // Add to playlist
      addToPlaylist: (video) => {
        const playlist = get().playlist;
        if (!playlist.some(item => item.id === video.id)) {
          set({ playlist: [...playlist, video] });
        }
      },
      
      // Remove from playlist
      removeFromPlaylist: (videoId) => set({
        playlist: get().playlist.filter(item => item.id !== videoId)
      }),
      
      // Clear playlist
      clearPlaylist: () => set({ playlist: [] }),
      
      // User preferences
      darkMode: true,
      setDarkMode: (dark) => set({ darkMode: dark }),
      
      // User info
      username: '',
      avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16),
      setUsername: (name) => set({ username: name }),
      setAvatarColor: (color) => set({ avatarColor: color }),
    }),
    {
      name: 'melodyverse-storage',
      partialize: (state) => ({
        playlist: state.playlist,
        volume: state.volume,
        darkMode: state.darkMode,
        username: state.username,
        avatarColor: state.avatarColor,
      }),
    }
  )
);

// Chat store interface
interface ChatStore {
  messages: Record<string, Message[]>;
  typing: Record<string, Record<string, number>>;
  
  addMessage: (roomId: string, message: Message) => void;
  setTyping: (roomId: string, userId: string, isTyping: boolean) => void;
  clearMessages: (roomId: string) => void;
}

// Chat message history store (separate to avoid large persists)
export const useChatStore = create<ChatStore>((set) => ({
  messages: {},
  typing: {},
  
  // Add message to room
  addMessage: (roomId, message) => set((state) => {
    const roomMessages = state.messages[roomId] || [];
    return {
      messages: {
        ...state.messages,
        [roomId]: [...roomMessages, message]
      }
    };
  }),
  
  // Set typing status
  setTyping: (roomId, userId, isTyping) => set((state) => {
    const roomTyping = {...(state.typing[roomId] || {})};
    
    if (isTyping) {
      roomTyping[userId] = Date.now();
    } else {
      delete roomTyping[userId];
    }
    
    return {
      typing: {
        ...state.typing,
        [roomId]: roomTyping
      }
    };
  }),
  
  // Clear messages for a room
  clearMessages: (roomId) => set((state) => {
    const newMessages = {...state.messages};
    delete newMessages[roomId];
    return { messages: newMessages };
  }),
})); 