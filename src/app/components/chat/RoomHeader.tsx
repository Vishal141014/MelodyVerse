"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaCopy, FaUsers, FaUser, FaCheck } from "react-icons/fa";

interface RoomHeaderProps {
  roomId: string;
  users: any[];
  isHost: boolean;
  onProfileClick: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomId,
  users,
  isHost,
  onProfileClick
}) => {
  const [copied, setCopied] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  return (
    <header className="sticky top-0 z-20 glassmorphism border-b border-white/10 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold gradient-text">MelodyVerse</h1>
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg">
            <span className="text-sm text-white/70">Room:</span>
            <span className="text-sm font-medium">{roomId}</span>
            <motion.button 
              className="text-white/50 hover:text-white p-1 text-sm"
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyRoomId}
            >
              {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
            </motion.button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.button
              className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10"
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserList(!showUserList)}
            >
              <FaUsers className="text-white/70" />
              <span className="text-sm">{users.length}</span>
            </motion.button>
            
            {/* User list dropdown */}
            {showUserList && (
              <motion.div
                className="absolute right-0 mt-2 w-48 glassmorphism rounded-lg py-1 z-50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="px-3 py-2 border-b border-white/10">
                  <h4 className="text-sm font-semibold">Users in Room</h4>
                </div>
                <ul className="max-h-48 overflow-y-auto py-1">
                  {users.map((user, index) => (
                    <li key={index} className="px-3 py-1 flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: user.color || '#8b5cf6' }}
                      >
                        {user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm">{user.username}</span>
                      {user.isHost && (
                        <span className="text-xs text-primary ml-auto">Host</span>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
          
          <motion.button
            className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10"
            whileTap={{ scale: 0.95 }}
            onClick={onProfileClick}
          >
            <FaUser className="text-white/70" />
            <span className="text-sm hidden sm:inline">Profile</span>
          </motion.button>
          
          {isHost && (
            <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
              Host
            </span>
          )}
        </div>
      </div>
      
      {/* Mobile room ID */}
      <div className="sm:hidden px-4 py-2 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">Room ID:</span>
          <span className="text-xs font-medium">{roomId}</span>
        </div>
        <motion.button 
          className="text-white/50 hover:text-white p-1 text-xs"
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyRoomId}
        >
          {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
        </motion.button>
      </div>
    </header>
  );
};

export default RoomHeader; 