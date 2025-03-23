"use client";
import React from 'react';
import { FaTimes, FaCrown, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface User {
  id: string;
  username: string;
}

interface UserListProps {
  users: User[];
  currentUserId: string;
  hostId: string;
  onClose: () => void;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  currentUserId, 
  hostId, 
  onClose 
}) => {
  return (
    <motion.div 
      className="h-full w-72 bg-white/80 border-l border-pink-medium/30 flex flex-col overflow-hidden"
      style={{ 
        backdropFilter: 'blur(10px)',
        boxShadow: '-5px 0 20px rgba(194, 24, 91, 0.1)'
      }}
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-pink-medium/30" 
           style={{
             background: 'linear-gradient(to right, rgba(255, 209, 220, 0.7), rgba(255, 183, 202, 0.7))'
           }}>
        <h3 className="text-pink-dark font-semibold">Room Users ({users.length})</h3>
        <button 
          onClick={onClose}
          className="text-pink-dark/70 hover:text-pink-dark bg-transparent border-none p-2 rounded-full hover:bg-white/40 transition-colors"
          aria-label="Close user list"
        >
          <FaTimes />
        </button>
      </div>
      
      {/* User list */}
      <div className="flex-1 overflow-y-auto py-2"
           style={{
             background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 241, 245, 0.8))'
           }}>
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-pink-dark/60">
            <p className="font-medium">No users in this room</p>
          </div>
        ) : (
          <ul className="divide-y divide-pink-medium/20">
            {users.map(user => (
              <li 
                key={user.id} 
                className={`flex items-center gap-3.5 px-4 py-3.5 ${user.id === currentUserId ? 'bg-pink-light/40' : 'hover:bg-pink-light/20'} transition-colors`}
              >
                {/* Avatar */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: user.id === currentUserId 
                    ? 'linear-gradient(to right, #C2185B, #E91E63)' 
                    : 'rgba(255, 209, 220, 0.7)',
                  color: user.id === currentUserId ? 'white' : '#C2185B',
                  boxShadow: user.id === currentUserId 
                    ? '0 3px 6px rgba(194, 24, 91, 0.2)' 
                    : '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}>
                  <FaUser />
                </div>
                
                {/* Username */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <p className={`truncate font-medium ${user.id === currentUserId ? 'text-pink-dark' : 'text-pink-dark/80'}`}>
                      {user.username}
                      {user.id === currentUserId && ' (You)'}
                    </p>
                    {user.id === hostId && (
                      <FaCrown className="text-yellow-500 text-sm flex-shrink-0" title="Host" />
                    )}
                  </div>
                  
                  {/* Status indicator */}
                  {(user.id === hostId || user.id === currentUserId) && (
                    <p className="text-xs mt-1 text-pink-dark/50">
                      {user.id === hostId ? 'Room Host' : 'Member'}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

export default UserList; 