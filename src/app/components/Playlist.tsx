"use client";
import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { FaTrash, FaPlay, FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaylistItem {
  id: string;
  title: string;
}

interface PlaylistProps {
  socket: Socket | null;
  roomId: string;
  currentVideoId: string | null;
  isHost: boolean;
  onSelectVideo: (videoId: string, title: string) => void;
}

const Playlist: React.FC<PlaylistProps> = ({
  socket,
  roomId,
  currentVideoId,
  isHost,
  onSelectVideo
}) => {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  // Listen for playlist updates from server
  useEffect(() => {
    if (!socket) return;

    const handlePlaylistUpdate = (data: { playlist: PlaylistItem[] }) => {
      console.log('Playlist updated:', data.playlist);
      setPlaylist(data.playlist || []);
    };

    socket.on('playlist:update', handlePlaylistUpdate);

    // Request current playlist on mount
    socket.emit('playlist:request', { roomId });

    return () => {
      socket.off('playlist:update', handlePlaylistUpdate);
    };
  }, [socket, roomId]);

  // Play a track from playlist
  const playTrack = (videoId: string, title: string) => {
    if (!socket) return;
    
    onSelectVideo(videoId, title);
  };

  // Remove a track from playlist
  const removeTrack = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!socket) return;
    
    socket.emit('playlist:remove', { roomId, videoId });
  };

  // Clear entire playlist
  const clearPlaylist = () => {
    if (!socket) return;
    
    socket.emit('playlist:clear', { roomId });
  };

  // Toggle playlist visibility
  const togglePlaylist = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-pink-medium/20 rounded-xl shadow-lg overflow-hidden">
      {/* Header with toggle */}
      <motion.button 
        onClick={togglePlaylist}
        className="w-full p-3 bg-gradient-to-r from-pink-500/20 to-pink-dark/20 flex items-center justify-between text-pink-dark font-medium"
        whileHover={{ backgroundColor: 'rgba(236, 64, 122, 0.15)' }}
      >
        <div className="flex items-center">
          <FaPlus className={`mr-2 transition-transform ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
          Playlist ({playlist.length})
        </div>
        
        {isOpen && playlist.length > 0 && isHost && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              clearPlaylist();
            }}
            className="text-xs text-pink-dark/70 hover:text-pink-dark"
          >
            Clear All
          </button>
        )}
      </motion.button>
      
      {/* Playlist items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-y-auto max-h-64"
          >
            {playlist.length === 0 ? (
              <div className="p-4 text-center text-pink-dark/70 italic">
                No songs in playlist. Search for songs to add them.
              </div>
            ) : (
              <ul className="divide-y divide-pink-medium/10">
                {playlist.map((item) => (
                  <motion.li 
                    key={item.id}
                    className={`p-3 flex items-center gap-3 hover:bg-pink-light/10 cursor-pointer
                      ${currentVideoId === item.id ? 'bg-pink-light/20 border-l-4 border-pink-medium' : ''}
                    `}
                    onClick={() => playTrack(item.id, item.title)}
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="w-8 h-8 flex-shrink-0">
                      {currentVideoId === item.id ? (
                        <div className="w-full h-full rounded-full bg-pink-medium/20 flex items-center justify-center">
                          <FaPlay className="text-pink-medium ml-0.5" />
                        </div>
                      ) : (
                        <img 
                          src={`https://img.youtube.com/vi/${item.id}/default.jpg`} 
                          alt="" 
                          className="w-full h-full object-cover rounded" 
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 truncate text-pink-dark">
                      {item.title}
                    </div>
                    
                    {isHost && (
                      <button 
                        onClick={(e) => removeTrack(item.id, e)}
                        className="text-pink-dark/50 hover:text-pink-dark"
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Playlist; 