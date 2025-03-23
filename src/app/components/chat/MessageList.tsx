"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeart, FaThumbsUp, FaSmile, FaAngry, FaSadTear } from "react-icons/fa";

// Message reactions
const REACTIONS = [
  { emoji: "❤️", icon: <FaHeart className="text-red-500" /> },
  { emoji: "👍", icon: <FaThumbsUp className="text-blue-500" /> },
  { emoji: "😊", icon: <FaSmile className="text-yellow-500" /> },
  { emoji: "😢", icon: <FaSadTear className="text-blue-400" /> },
  { emoji: "😠", icon: <FaAngry className="text-red-400" /> },
];

interface Message {
  senderId: string;
  message: string;
  timestamp: string;
  type: 'text' | 'gif' | 'sticker' | 'image';
  content?: string | null;
  reactions?: { 
    [emoji: string]: string[] 
  }
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  typingUsers: string[];
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  currentUser,
  typingUsers 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-white/50">
          <p>No messages yet</p>
          <p className="text-sm">Start the conversation!</p>
        </div>
      )}
      
      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === currentUser;
        
        return (
          <div 
            key={index}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`max-w-[80%] rounded-lg p-3 ${
                isCurrentUser 
                  ? 'bg-primary/20 rounded-tr-none' 
                  : 'bg-white/10 rounded-tl-none'
              }`}
            >
              {!isCurrentUser && (
                <div className="text-xs text-white/60 mb-1 font-medium">
                  {message.senderId}
                </div>
              )}
              
              {/* Message content based on type */}
              {message.type === 'text' && (
                <p className="break-words">{message.message}</p>
              )}
              
              {message.type === 'gif' && message.content && (
                <div className="rounded-md overflow-hidden">
                  <img 
                    src={message.content} 
                    alt="GIF" 
                    className="max-w-full max-h-60 object-contain"
                  />
                </div>
              )}
              
              {message.type === 'sticker' && message.content && (
                <div className="flex justify-center">
                  <img 
                    src={message.content} 
                    alt="Sticker" 
                    className="max-w-[150px] max-h-[150px] object-contain"
                  />
                </div>
              )}
              
              {message.type === 'image' && message.content && (
                <div className="rounded-md overflow-hidden">
                  <img 
                    src={message.content} 
                    alt="Image" 
                    className="max-w-full max-h-60 object-contain"
                  />
                </div>
              )}
              
              {/* Message timestamp */}
              <div className={`text-xs mt-1 text-white/40 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                {formatTime(message.timestamp)}
              </div>
              
              {/* Reactions - placeholder, would integrate with backend in real implementation */}
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className={`flex gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  {Object.entries(message.reactions).map(([emoji, users]) => (
                    <div 
                      key={emoji}
                      className="bg-white/10 rounded-full px-2 py-0.5 flex items-center text-xs gap-1"
                    >
                      <span>{emoji}</span>
                      <span className="text-white/70">{users.length}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        );
      })}
      
      {/* Typing indicators */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center"
          >
            <div className="bg-white/10 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center gap-1">
                <div className="flex">
                  <div className="w-2 h-2 bg-white/60 rounded-full mx-0.5 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full mx-0.5 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full mx-0.5 animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
                <span className="text-sm text-white/60">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]} is typing...` 
                    : `${typingUsers.length} people are typing...`
                  }
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Invisible div to scroll to when new messages appear */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 