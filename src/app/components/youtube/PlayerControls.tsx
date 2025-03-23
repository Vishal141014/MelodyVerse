"use client";
import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeDown, FaVolumeMute, FaRedo } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface PlayerControlsProps {
  socket: Socket | null;
  roomId: string;
  currentVideoId: string | null;
  isHost: boolean;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  onReinitializePlayer?: () => void;
  onForcePlay?: (videoId: string) => void;
  onVolumeChange?: (volume: number) => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  socket,
  roomId,
  currentVideoId,
  isHost,
  isPlaying,
  setIsPlaying,
  onReinitializePlayer,
  onForcePlay,
  onVolumeChange
}) => {
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playClickTimer, setPlayClickTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Detect touch devices
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  // Apply volume changes
  useEffect(() => {
    if (onVolumeChange) {
      onVolumeChange(isMuted ? 0 : volume);
    }
  }, [volume, isMuted, onVolumeChange]);
  
  // Handle play/pause button click
  const handlePlayPause = () => {
    if (!socket || !currentVideoId) return;
    
    console.log(`PlayerControls: handlePlayPause, current state: ${isPlaying ? 'playing' : 'paused'}`);
    
    // Update UI immediately for better user experience
    setIsPlaying(!isPlaying);
    
    // Prevent duplicate clicks
    if (playClickTimer) {
      clearTimeout(playClickTimer);
    }
    
    // Set a timeout to emit the socket event to prevent multiple rapid clicks
    const timer = setTimeout(() => {
      if (isPlaying) {
        // Currently playing, so pause
        socket.emit('video:pause', { roomId });
        console.log("PlayerControls: Emitted pause event");
      } else {
        // Currently paused, so play
        if (currentVideoId) {
          socket.emit('video:resume', { roomId });
          console.log("PlayerControls: Emitted resume event");
          
          // Try to force play if we have the callback
          if (onForcePlay && currentVideoId) {
            setTimeout(() => {
              onForcePlay(currentVideoId);
            }, 500);
          }
        }
      }
    }, 100);
    
    setPlayClickTimer(timer);
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Handle reinitialize player (for error recovery)
  const handleReinitialize = () => {
    if (onReinitializePlayer) {
      console.log("PlayerControls: Reinitializing player");
      onReinitializePlayer();
    }
  };
  
  return (
    <div className="flex flex-col w-full">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-pink-light/10 rounded-lg shadow-sm">
        {/* Play/Pause Button */}
        <motion.button
          onClick={handlePlayPause}
          disabled={!currentVideoId}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full 
            ${currentVideoId 
              ? 'bg-pink-medium hover:bg-pink-dark text-white cursor-pointer' 
              : 'bg-pink-light/50 text-white/50 cursor-not-allowed'}
            transition-all
          `}
          whileHover={currentVideoId ? { scale: 1.05 } : {}}
          whileTap={currentVideoId ? { scale: 0.95 } : {}}
        >
          {isPlaying ? (
            <FaPause className="text-lg" />
          ) : (
            <FaPlay className="text-lg ml-0.5" />
          )}
        </motion.button>
        
        {/* Song Title */}
        <div className="flex-1 px-2 text-pink-dark truncate text-center md:text-left">
          {currentVideoId 
            ? <span className="font-medium">Now Playing</span>
            : <span className="text-pink-dark/60">No song selected</span>}
        </div>
        
        {/* Volume Controls - larger on mobile */}
        <div className={`flex items-center ${isTouchDevice ? 'gap-4' : 'gap-2'}`}>
          <motion.button 
            onClick={toggleMute}
            whileTap={{ scale: 0.9 }}
            className={`text-pink-dark ${isTouchDevice ? 'p-2' : ''}`}
          >
            {isMuted || volume === 0 ? (
              <FaVolumeMute className={isTouchDevice ? 'text-xl' : ''} />
            ) : (
              <FaVolumeUp className={isTouchDevice ? 'text-xl' : ''} />
            )}
          </motion.button>
          
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className={`accent-pink-dark ${isTouchDevice ? 'w-32 h-2' : 'w-20'}`}
          />
        </div>
        
        {/* Reinitialize button (only show when needed) */}
        {onReinitializePlayer && (
          <motion.button
            onClick={handleReinitialize}
            className="text-pink-dark/70 hover:text-pink-dark transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Reinitialize player (if playback fails)"
          >
            <FaRedo className="text-lg" />
          </motion.button>
        )}
      </div>
      
      {/* Debug controls for hosts */}
      {isHost && isDebugMode && (
        <div className="mt-4 p-4 border border-pink-medium/20 rounded-lg bg-pink-light/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-pink-dark">Host Controls (Debug)</h3>
            <button
              onClick={() => setIsDebugMode(false)}
              className="text-pink-dark/70 text-sm"
            >
              Hide
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {onReinitializePlayer && (
              <button
                onClick={handleReinitialize}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded"
              >
                Reinitialize Player
              </button>
            )}
            
            {onForcePlay && currentVideoId && (
              <button
                onClick={() => onForcePlay(currentVideoId)}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded"
              >
                Force Play Current
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Current Video ID: <span className="font-mono">{currentVideoId || 'none'}</span></div>
            <div>Playing: {isPlaying ? '✓' : '✗'}</div>
            <div>Volume: {volume}%</div>
            <div>Muted: {isMuted ? '✓' : '✗'}</div>
            <div>Touch Device: {isTouchDevice ? '✓' : '✗'}</div>
          </div>
        </div>
      )}
      
      {/* Debug toggle for hosts */}
      {isHost && !isDebugMode && (
        <button
          onClick={() => setIsDebugMode(true)}
          className="mt-1 text-pink-dark/50 text-xs hover:text-pink-dark/70 self-end"
        >
          Debug
        </button>
      )}
    </div>
  );
};

export default PlayerControls; 