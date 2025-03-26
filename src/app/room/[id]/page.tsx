"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import ChatSection from '@/app/components/chat/ChatSection';
import YouTubePlayer from '@/app/components/youtube/YouTubePlayer';
import SearchModal from '@/app/components/youtube/SearchModal';
import PlayerControls from '@/app/components/youtube/PlayerControls';
import { FaMusic, FaPlus, FaSearch, FaShare, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  username: string;
}

interface RoomState {
  hostId: string;
  users: User[];
  playlist: { id: string; title: string }[];
  currentVideo: { id: string; title: string } | null;
  isPlaying: boolean;
}

export default function RoomPage() {
  const { id: roomId } = useParams();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [usernameEntered, setUsernameEntered] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Derived state
  const isHost = userId === roomState?.hostId;
  const currentVideoId = roomState?.currentVideo?.id || null;
  const isPlaying = roomState?.isPlaying || false;
  
  // Initialize socket connection
  useEffect(() => {
    if (!usernameEntered) return;
    
    // Connect to the server
    const socketUrl = 'https://melody-verse-socket-server.onrender.com';
    console.log(`Connecting to socket server at: ${socketUrl}`);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 30000
    });
    
    setSocket(newSocket);
    
    // Handle self user ID
    newSocket.on('user:self', (data: { id: string }) => {
      setUserId(data.id);
    });
    
    // Join the room once connected
    newSocket.on('connect', () => {
      console.log('Connected to server, joining room:', roomId);
      newSocket.emit('join-room', { roomId, username });
    });
    
    // Handle room data
    newSocket.on('room:joined', (data: RoomState) => {
      console.log('Joined room, received state:', data);
      setRoomState(data);
    });
    
    // Handle room updates
    newSocket.on('users:update', (data: { users: User[], hostId: string }) => {
      setRoomState(prev => prev ? { ...prev, users: data.users, hostId: data.hostId } : null);
    });
    
    // Handle playlist updates
    newSocket.on('playlist:update', (data: { playlist: { id: string; title: string }[] }) => {
      setRoomState(prev => prev ? { ...prev, playlist: data.playlist } : null);
    });
    
    // Handle video play
    newSocket.on('video:play', (data: { videoId: string, title: string }) => {
      console.log('Video play event:', data);
      setRoomState(prev => prev ? {
        ...prev,
        currentVideo: { id: data.videoId, title: data.title },
        isPlaying: true
      } : null);
    });
    
    // Handle video pause/resume
    newSocket.on('video:pause', () => {
      setRoomState(prev => prev ? { ...prev, isPlaying: false } : null);
    });
    
    newSocket.on('video:resume', () => {
      setRoomState(prev => prev ? { ...prev, isPlaying: true } : null);
    });
    
    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [roomId, username, usernameEntered]);
  
  // Handle username submission
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setUsernameEntered(true);
    }
  };
  
  // Handle video selection
  const handleVideoSelect = (videoId: string, videoTitle: string) => {
    if (!socket) return;
    
    // Close search modal
    setShowSearchModal(false);
    
    // If this is the first video, play it immediately
    if (!roomState?.currentVideo?.id) {
      socket.emit('video:play', {
        roomId,
        videoId,
        title: videoTitle
      });
    }
  };
  
  // Handle play of playlist item
  const playPlaylistItem = (item: { id: string; title: string }) => {
    if (!socket || !isHost) return;
    
    socket.emit('video:play', {
      roomId,
      videoId: item.id,
      title: item.title
    });
  };
  
  // Handle remove from playlist
  const removeFromPlaylist = (videoId: string) => {
    if (!socket || !isHost) return;
    
    socket.emit('playlist:remove', {
      roomId,
      videoId
    });
  };
  
  // Share room link
  const shareRoom = () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    
    navigator.clipboard.writeText(roomUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };
  
  // Set player state
  const handleSetPlaying = (newPlayingState: boolean) => {
    setRoomState(prev => prev ? { ...prev, isPlaying: newPlayingState } : null);
  };

  // Username entry screen
  if (!usernameEntered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-pink-dark text-center mb-6">
            Join Music Room
          </h1>
          
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-pink-dark mb-1">
                Your Display Name
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 border border-pink-medium/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-dark/50"
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-pink-dark text-white rounded-lg font-medium transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Room
            </button>
          </form>
          
          <p className="mt-4 text-xs text-center text-pink-dark/60">
            Room ID: {roomId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col">
      {/* Header with room info */}
      <header className="bg-white border-b border-pink-medium/10 shadow-sm p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-pink-dark">
            <span className="text-pink-medium mr-2">▶</span> 
            MelodyVerse Room
          </h1>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={shareRoom}
              className="flex items-center gap-1 px-3 py-1.5 bg-pink-medium/10 hover:bg-pink-medium/20 text-pink-dark rounded-lg transition-colors text-sm"
            >
              <FaShare className="text-xs" />
              {copySuccess ? 'Copied!' : 'Share'}
            </button>
            
            <div className="text-sm bg-pink-medium/10 px-3 py-1.5 rounded-lg text-pink-dark">
              <span className="font-semibold">Room:</span> {roomId}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Left side - video player */}
          <div className="lg:col-span-2 space-y-4">
            {/* YouTube Player */}
            <YouTubePlayer
              socket={socket}
              roomId={roomId as string}
              currentVideoId={currentVideoId}
              isHost={isHost}
              isPlaying={isPlaying}
              setIsPlaying={handleSetPlaying}
            />
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {isHost && (
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-dark text-white rounded-lg hover:shadow-md transition-all"
                >
                  <FaSearch /> Search Music
                </button>
              )}
              
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-medium/10 text-pink-dark rounded-lg hover:bg-pink-medium/20 transition-colors"
              >
                <FaMusic /> {showPlaylist ? 'Hide Playlist' : 'Show Playlist'}
              </button>
            </div>
            
            {/* Playlist */}
            <AnimatePresence>
              {showPlaylist && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-4 border-b border-pink-medium/10 flex items-center justify-between">
                    <h2 className="font-semibold text-pink-dark">Playlist</h2>
                    <button
                      onClick={() => setShowPlaylist(false)}
                      className="text-pink-dark/70 hover:text-pink-dark"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto p-2">
                    {roomState?.playlist && roomState.playlist.length > 0 ? (
                      <div className="space-y-2">
                        {roomState.playlist.map((item) => (
                          <div 
                            key={item.id}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              currentVideoId === item.id 
                                ? 'bg-pink-medium/20 border-l-4 border-pink-dark' 
                                : 'bg-pink-light/10 hover:bg-pink-light/20'
                            } transition-colors`}
                          >
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate text-sm text-pink-dark" title={item.title}>
                                {item.title}
                              </p>
                            </div>
                            
                            <div className="flex items-center ml-2">
                              {isHost && (
                                <>
                                  <button
                                    onClick={() => playPlaylistItem(item)}
                                    className="p-1.5 text-xs bg-pink-medium/10 text-pink-dark rounded-full hover:bg-pink-medium/30 transition-colors mr-1"
                                    title="Play"
                                  >
                                    ▶
                                  </button>
                                  <button
                                    onClick={() => removeFromPlaylist(item.id)}
                                    className="p-1.5 text-xs bg-red-100 text-red-500 rounded-full hover:bg-red-200 transition-colors"
                                    title="Remove"
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-6 text-pink-dark/50">
                        No songs in playlist yet.
                        {isHost && " Search and add some music!"}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Right side - chat */}
          <div className="lg:col-span-1">
            {socket && (
              <ChatSection 
                socket={socket}
                roomId={roomId as string}
                username={username}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <SearchModal
            socket={socket}
            roomId={roomId as string}
            onClose={() => setShowSearchModal(false)}
            onVideoSelect={handleVideoSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 