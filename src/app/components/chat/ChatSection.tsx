"use client";
import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { FaPaperPlane } from 'react-icons/fa';

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

interface ChatSectionProps {
  socket: Socket;
  roomId: string;
  username: string;
}

const ChatSection: React.FC<ChatSectionProps> = ({ socket, roomId, username }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<Array<{id: string, username: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Handle incoming chat messages
    const handleChatMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };
    
    // Handle typing indicators from other users
    const handleTypingIndicator = (data: { users: string[] }) => {
      setTypingUsers(data.users.filter(user => user !== username));
    };
    
    // Handle user updates
    const handleUsersUpdate = (data: { users: Array<{id: string, username: string}> }) => {
      setUsers(data.users);
    };
    
    // Register event listeners
    socket.on('chat:message', handleChatMessage);
    socket.on('chat:typing', handleTypingIndicator);
    socket.on('users:update', handleUsersUpdate);
    
    // Get any existing messages if available
    socket.emit('chat:history', { roomId });
    
    return () => {
      socket.off('chat:message', handleChatMessage);
      socket.off('chat:typing', handleTypingIndicator);
      socket.off('users:update', handleUsersUpdate);
    };
  }, [socket, roomId, username]);
  
  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('chat:typing', { roomId, isTyping: true });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('chat:typing', { roomId, isTyping: false });
    }, 3000);
  };
  
  // Send message
  const sendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!messageInput.trim()) return;
    
    socket.emit('chat:message', {
      roomId,
      text: messageInput.trim()
    });
    
    setMessageInput('');
    
    // Clear typing indicator
    if (isTyping) {
      setIsTyping(false);
      socket.emit('chat:typing', { roomId, isTyping: false });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-pink-medium/10 bg-pink-light/10">
        <h2 className="font-semibold text-pink-dark">Chat Room</h2>
        <p className="text-xs text-pink-dark/70">{users.length} user{users.length !== 1 ? 's' : ''} online</p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-pink-dark/50">
            <p>No messages yet</p>
            <p className="text-xs mt-1">Be the first to say hello!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.username === username ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.username === username
                      ? 'bg-gradient-to-r from-pink-500 to-pink-dark text-white rounded-tr-none'
                      : 'bg-pink-light/20 text-pink-dark rounded-tl-none'
                  }`}
                >
                  {message.username !== username && (
                    <div className="text-xs font-medium mb-1">
                      {message.username}
                    </div>
                  )}
                  <div className="break-words">{message.text}</div>
                  <div className="text-right text-xs mt-1 opacity-70">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-pink-dark/70">
          {typingUsers.length === 1 
            ? `${typingUsers[0]} is typing...` 
            : `${typingUsers.length} people are typing...`}
        </div>
      )}
      
      {/* Input area */}
      <form onSubmit={sendMessage} className="p-3 border-t border-pink-medium/10 bg-pink-light/5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
            className="flex-1 p-3 bg-white border border-pink-medium/20 rounded-lg text-pink-dark focus:outline-none focus:border-pink-medium/50"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-pink-500 to-pink-dark text-white rounded-full disabled:opacity-50"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatSection; 