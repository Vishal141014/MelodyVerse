"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useStore } from '@/app/store';
import { FaTimes, FaUsers, FaVolumeMute, FaVolumeUp, FaMusic, FaComments } from 'react-icons/fa';
import YouTubePlayer from './youtube/YouTubePlayer';
import Chat from './chat/Chat';
import UserList from './users/UserList';
import { motion, AnimatePresence } from 'framer-motion';

interface RoomContainerProps {
  socket: Socket | null;
  roomId: string;
  username: string;
  isHost: boolean;
}

interface User {
  id: string;
  username: string;
  isHost?: boolean;
}

const RoomContainer: React.FC<RoomContainerProps> = ({ 
  socket,
  roomId,
  username,
  isHost
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [hostId, setHostId] = useState<string>('');
  const [showUsers, setShowUsers] = useState(false);
  const { 
    currentVideoId,
    currentVideoTitle,
    setCurrentVideo,
    isPlaying: storeIsPlaying,
    setPlaying,
    playlist,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist
  } = useStore();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [roomName, setRoomName] = useState<string>('');
  
  // Sync playback state with store
  const [localIsPlaying, setLocalIsPlaying] = useState(storeIsPlaying);
  
  // Handle user list updates
  useEffect(() => {
    if (!socket) return;
    
    // Set up listeners for user events
    socket.on('user:self', (data: { id: string }) => {
      setUserId(data.id);
    });
    
    socket.on('users:update', (data: { users: User[], hostId: string }) => {
      setUsers(data.users);
      setHostId(data.hostId);
    });
    
    socket.on('room:host', (data: { hostId: string }) => {
      setHostId(data.hostId);
    });
    
    // Cleanup listeners
    return () => {
      socket.off('user:self');
      socket.off('users:update');
      socket.off('room:host');
    };
  }, [socket]);
  
  // Handle room joining/state
  useEffect(() => {
    if (!socket) return;
    
    const handleRoomJoined = (data) => {
      console.log('Joined room with data:', data);
      setHostId(data.hostId);
      setUsers(data.users);
      
      // Save playlist to state
      if (data.playlist && Array.isArray(data.playlist)) {
        console.log('Setting playlist from room data:', data.playlist);
        // Clear and add each item to playlist
        clearPlaylist();
        data.playlist.forEach(item => {
          addToPlaylist(item);
        });
      }
      
      // Set current video if one is playing
      if (data.currentVideo) {
        console.log('Setting current video from room state:', data.currentVideo);
        setCurrentVideo(data.currentVideo.id, data.currentVideo.title);
        
        // Set playing state based on room state
        setLocalIsPlaying(data.isPlaying);
        setPlaying(data.isPlaying);
        
        // Request current timestamp to sync playback
        setTimeout(() => {
          console.log('Requesting timestamp to sync playback');
          socket.emit('video:requestTimestamp', { roomId });
        }, 1000);
      }
    };
    
    socket.on('room:joined', handleRoomJoined);
    
    // Listen for playlist updates
    socket.on('playlist:update', ({ playlist }) => {
      console.log('Received playlist update:', playlist);
      // Clear and add each item to playlist
      clearPlaylist();
      if (Array.isArray(playlist)) {
        playlist.forEach(item => {
          addToPlaylist(item);
        });
      }
    });
    
    // Clean up
    return () => {
      socket.off('room:joined', handleRoomJoined);
      socket.off('playlist:update');
    };
  }, [socket, roomId, setCurrentVideo, setPlaying, setLocalIsPlaying, addToPlaylist, clearPlaylist]);
  
  // Handle YouTube video selection
  const handleVideoSelect = (videoId: string, title: string) => {
    if (!socket) return;
    
    console.log(`Selected video: ${videoId} - ${title}`);
    
    // Add to playlist first
    if (typeof addToPlaylist === 'function') {
      console.log('Adding to playlist:', { id: videoId, title });
      addToPlaylist({ id: videoId, title });
    } else {
      console.error('addToPlaylist function is not available');
    }
    
    // Then play it
    socket.emit('video:play', {
      roomId, 
      videoId, 
      title
    });
    
    // Also update local state
    if (typeof setCurrentVideo === 'function') {
      console.log('Setting current video');
      setCurrentVideo(videoId, title);
    } else {
      console.error('setCurrentVideo function is not available');
    }
    
    if (typeof setPlaying === 'function') {
      console.log('Setting playing state to true');
      setPlaying(true);
    } else {
      console.error('setPlaying function is not available');
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen max-h-screen overflow-hidden bg-pink-100/80 relative">
      {/* Mobile header (visible only on small screens) */}
      <div className="md:hidden p-4 border-b border-pink-medium/20 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-pink-dark">
            MelodyVerse
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("music")}
              className={`p-2 rounded-full ${activeTab === "music" ? "bg-pink-light text-pink-dark" : "text-pink-dark/60"}`}
            >
              <FaMusic />
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`p-2 rounded-full ${activeTab === "chat" ? "bg-pink-light text-pink-dark" : "text-pink-dark/60"}`}
            >
              <FaComments />
            </button>
            <button
              onClick={() => setShowUserList(!showUserList)}
              className={`p-2 rounded-full ${showUserList ? "bg-pink-light text-pink-dark" : "text-pink-dark/60"}`}
            >
              <FaUsers />
            </button>
          </div>
        </div>
      </div>
      
      {/* Room info header */}
      <div className="hidden md:flex w-full md:h-14 items-center justify-between px-4 py-2 border-b border-pink-medium/20 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-pink-dark flex items-center justify-center">
            <FaMusic className="text-sm text-white" />
          </div>
          <h2 className="text-lg font-semibold text-pink-dark">{roomName || `Room ${roomId}`}</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-md bg-white hover:bg-pink-light/30 transition-colors text-pink-dark text-sm border border-pink-medium/20"
          >
            <FaUsers className="text-sm" /> Users ({users.length})
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 h-full max-h-[calc(100vh-3.5rem)] md:max-h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Music player section - Show/hide based on activeTab on mobile */}
        <div className={`w-full md:w-3/5 lg:w-2/3 h-full ${activeTab === "music" || activeTab === null ? "flex" : "hidden md:flex"} flex-col`}>
          <YouTubePlayer
            socket={socket}
            roomId={roomId}
            isHost={isHost}
            onVideoSelect={handleVideoSelect}
            currentVideoId={currentVideoId}
            isPlaying={localIsPlaying}
            setIsPlaying={setLocalIsPlaying}
          />
        </div>
        
        {/* Chat section - Show/hide based on activeTab on mobile */}
        <div className={`w-full md:w-2/5 lg:w-1/3 h-full ${activeTab === "chat" || activeTab === null ? "flex" : "hidden md:flex"} flex-col border-l border-pink-medium/20`}>
          <Chat
            socket={socket}
            username={username}
          />
        </div>
      </div>
      
      {/* User list overlay */}
      <AnimatePresence>
        {showUserList && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md"
          >
            <UserList
              users={users}
              currentUserId={socket?.id || ""}
              hostId={hostId}
              onClose={() => setShowUserList(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomContainer; 