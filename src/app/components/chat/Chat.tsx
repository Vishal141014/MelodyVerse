"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { FaPaperPlane, FaSmile, FaInfoCircle, FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

interface ChatProps {
  socket: Socket | null;
  username: string;
}

const Chat: React.FC<ChatProps> = ({ socket, username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [roomId, setRoomId] = useState<string>('');
  
  // Get roomId when component mounts
  useEffect(() => {
    if (socket) {
      // Try to get roomId from URL if it's not available directly from socket
      const path = window.location.pathname;
      const match = path.match(/\/room\/([^/]+)/);
      if (match && match[1]) {
        setRoomId(match[1]);
      }
      
      // Listen for roomId update from socket if available
      socket.on('room:joined', (data: { roomId: string }) => {
        setRoomId(data.roomId);
      });
      
      return () => {
        socket.off('room:joined');
      };
    }
  }, [socket]);
  
  // Subscribe to chat messages
  useEffect(() => {
    if (!socket) return;
    
    // Listen for new messages
    const handleNewMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      
      // Play sound if message is from someone else
      if (message.userId !== socket.id) {
        try {
          const audio = new Audio('/sounds/message.mp3');
          audio.volume = 0.3;
          audio.play().catch(err => console.error('Error playing sound:', err));
        } catch (error) {
          console.error('Error with sound playback:', error);
        }
      }
    };
    
    // Listen for typing indicators
    const handleTypingUpdate = ({ users }: { users: string[] }) => {
      setTypingUsers(users.filter(user => user !== username));
    };
    
    socket.on('chat:message', handleNewMessage);
    socket.on('chat:typing', handleTypingUpdate);
    
    // Join notification
    socket.on('user:joined', ({ user }) => {
      if (user.username !== username) {
        const joinMessage = {
          id: `join-${Date.now()}-${user.id}`,
          userId: '',
          username: '',
          text: `${user.username} joined the room`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, joinMessage]);
      }
    });
    
    // Leave notification
    socket.on('user:left', ({ userId, username: leftUsername }) => {
      const leaveMessage = {
        id: `leave-${Date.now()}-${userId}`,
        userId: '',
        username: '',
        text: `${leftUsername} left the room`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, leaveMessage]);
    });
    
    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:typing', handleTypingUpdate);
      socket.off('user:joined');
      socket.off('user:left');
    };
  }, [socket, username]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);
  
  // Check if scroll position is at the bottom
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 30;
    setAutoScroll(atBottom);
  };
  
  // Handle message typing
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    // Notify typing status
    if (socket && socket.connected && newValue && !isTyping) {
      setIsTyping(true);
      socket.emit('chat:typing', { roomId, isTyping: true });
    } else if (socket && socket.connected && !newValue && isTyping) {
      setIsTyping(false);
      socket.emit('chat:typing', { roomId, isTyping: false });
    }
    
    // Reset typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout
    if (newValue) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
        if (socket && socket.connected) {
          socket.emit('chat:typing', { roomId, isTyping: false });
        }
      }, 2000);
      setTypingTimeout(timeout as unknown as NodeJS.Timeout);
    }
  };
  
  // Send a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !socket || !roomId) return;
    
    // Emit the message
    socket.emit('chat:message', { roomId, text: message.trim() });
    
    // Clear the input
    setMessage('');
    
    // Focus the input for next message
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
    
    // Reset typing
    setIsTyping(false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white/70 rounded-lg shadow overflow-hidden" style={{boxShadow: '0 4px 15px rgba(194, 24, 91, 0.15)'}}>
      {/* Chat header */}
      <div className="p-4 border-b border-pink-medium/30" style={{background: 'linear-gradient(to right, rgba(255, 209, 220, 0.7), rgba(255, 183, 202, 0.7))'}}>
        <h3 className="text-pink-dark text-lg font-semibold">Chat</h3>
      </div>
      
      {/* Messages area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 241, 245, 0.8))',
          scrollbarWidth: 'thin',
          scrollbarColor: '#FFB7CA transparent'
        }}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-pink-dark/60">
            <FaInfoCircle className="text-3xl mb-3" style={{color: '#FFB7CA'}} />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="w-full mb-2 last:mb-0">
              {/* System message (joins, leaves) */}
              {!msg.userId && (
                <div className="py-1.5 px-4 bg-pink-light/40 rounded-md text-pink-dark/70 text-xs text-center mx-auto max-w-[85%]" style={{background: 'rgba(255, 209, 220, 0.4)'}}>
                  {msg.text}
                </div>
              )}
              
              {/* User message */}
              {msg.userId && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.userId === socket?.id ? 'justify-end' : 'justify-start'} w-full`}
                >
                  {/* Avatar for received messages */}
                  {msg.userId !== socket?.id && (
                    <div className="flex-shrink-0 mr-2 self-end mb-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{background: '#C2185B'}}>
                        {msg.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div 
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 chat-bubble ${msg.userId === socket?.id ? 'chat-bubble-sent' : 'chat-bubble-received'}`}
                    style={msg.userId === socket?.id 
                      ? {
                          background: 'linear-gradient(to bottom right, #C2185B, #E91E63)',
                          color: 'white',
                          borderBottomRightRadius: '4px'
                        } 
                      : {
                          background: 'white',
                          color: '#333',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          borderBottomLeftRadius: '4px'
                        }
                    }
                  >
                    {/* Username for received messages */}
                    {msg.userId !== socket?.id && (
                      <div className="text-xs font-bold mb-1" style={{color: '#C2185B'}}>
                        {msg.username}
                      </div>
                    )}
                    
                    {/* Message content */}
                    <div className="break-words">
                      {msg.text}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-xs mt-1 text-right" style={{
                      opacity: 0.7,
                      color: msg.userId === socket?.id ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)'
                    }}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ))
        )}
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="text-pink-dark/70 text-xs flex items-center mt-1">
            <div className="flex-shrink-0 mr-2 font-medium">
              {typingUsers.length === 1 ? typingUsers[0] : `${typingUsers.length} people`}
            </div>
            <div className="typing-indicator flex">
              <span className="w-1.5 h-1.5 bg-pink-dark/60 rounded-full mr-1 animate-bounce" style={{animationDelay: '0ms'}}></span>
              <span className="w-1.5 h-1.5 bg-pink-dark/60 rounded-full mr-1 animate-bounce" style={{animationDelay: '150ms'}}></span>
              <span className="w-1.5 h-1.5 bg-pink-dark/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="p-3 border-t border-pink-medium/30" style={{background: 'linear-gradient(to right, rgba(255, 209, 220, 0.7), rgba(255, 183, 202, 0.7))'}}>
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            ref={messageInputRef}
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder="Type a message..."
            className="flex-1 rounded-full px-4 py-2.5 text-pink-dark outline-none transition-all"
            style={{
              border: '1px solid rgba(255, 183, 202, 0.3)',
              boxShadow: '0 2px 5px rgba(194, 24, 91, 0.05)',
              background: 'white'
            }}
          />
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="rounded-full w-10 h-10 flex items-center justify-center transition-all"
            style={{
              background: message.trim() 
                ? 'linear-gradient(to right, #C2185B, #E91E63)' 
                : 'rgba(255, 209, 220, 0.5)',
              color: message.trim() ? 'white' : 'rgba(194, 24, 91, 0.3)',
              transform: message.trim() ? 'scale(1)' : 'scale(0.95)',
              boxShadow: message.trim() ? '0 2px 8px rgba(194, 24, 91, 0.3)' : 'none'
            }}
          >
            <FaPaperPlane className={message.trim() ? "text-lg" : "text-base"} />
          </button>
        </form>
      </div>
      
      {/* Scroll reminder */}
      <AnimatePresence>
        {!autoScroll && messages.length > 10 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 right-6 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5"
            style={{
              background: 'linear-gradient(to right, #C2185B, #E91E63)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(194, 24, 91, 0.3)'
            }}
            onClick={() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                setAutoScroll(true);
              }
            }}
          >
            New messages <span className="ml-0.5">↓</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat; 