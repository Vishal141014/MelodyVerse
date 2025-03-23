"use client";
import { create } from 'zustand';

interface PlaylistItem {
  id: string;
  title: string;
}

interface StoreState {
  // User
  username: string;
  setUsername: (username: string) => void;
  
  // Current video
  currentVideoId: string | null;
  currentVideoTitle: string | null;
  setCurrentVideo: (id: string | null, title: string | null) => void;
  
  // Playback state
  isPlaying: boolean;
  setPlaying: (isPlaying: boolean) => void;
  
  // Volume
  volume: number;
  setVolume: (volume: number) => void;
  
  // Playlist
  playlist: PlaylistItem[];
  addToPlaylist: (item: PlaylistItem) => void;
  removeFromPlaylist: (id: string) => void;
  clearPlaylist: () => void;
}

export const useStore = create<StoreState>((set) => ({
  // User state
  username: '',
  setUsername: (username) => set({ username }),
  
  // Current video
  currentVideoId: null,
  currentVideoTitle: null,
  setCurrentVideo: (id, title) => set({ currentVideoId: id, currentVideoTitle: title }),
  
  // Playback state
  isPlaying: false,
  setPlaying: (isPlaying) => set({ isPlaying }),
  
  // Volume
  volume: 70,
  setVolume: (volume) => set({ volume }),
  
  // Playlist
  playlist: [],
  addToPlaylist: (item) => set((state) => {
    // Don't add duplicates
    if (state.playlist.some(i => i.id === item.id)) {
      return state;
    }
    return { playlist: [...state.playlist, item] };
  }),
  removeFromPlaylist: (id) => set((state) => ({ 
    playlist: state.playlist.filter(item => item.id !== id) 
  })),
  clearPlaylist: () => set({ playlist: [] }),
})); 