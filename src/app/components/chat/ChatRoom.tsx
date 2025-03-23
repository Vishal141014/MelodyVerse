"use client";
import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/app/store";
import YouTubePlayer from "../youtube/YouTubePlayer";
import SearchModal from "../youtube/SearchModal";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import RoomHeader from "./RoomHeader";
import ProfileSettings from "../user/ProfileSettings";
import { FaSearch, FaMusic, FaTimes, FaPaperPlane, FaSmile } from "react-icons/fa";

interface ChatRoomProps {
  roomId: string;
}

interface Message {
  id?: string;
  roomId: string;
  message: string;
  senderId: string;
  senderName?: string;
  type: 'text' | 'system';
  content: any;
  timestamp: number;
}

interface TypingUser {
  [username: string]: boolean;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId }) => {
  // References
  const socket = useRef<Socket | null>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const messageSentSound = useRef<HTMLAudioElement | null>(null);
  
  // Local state
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [quickSearchResults, setQuickSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Global state
  const { 
    username, 
    currentVideoId,
    setCurrentVideo,
    setPlaying,
    addToPlaylist
  } = useStore();
  
  // Initialize sound effects
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      // Create notification sound for incoming messages
      notificationSound.current = new Audio('/sounds/message-received.mp3');
      notificationSound.current.volume = 0.5;
      
      // Create sound for sent messages
      messageSentSound.current = new Audio('/sounds/message-sent.mp3');
      messageSentSound.current.volume = 0.3;
    }
    
    return () => {
      // Clean up sounds
      if (notificationSound.current) {
        notificationSound.current.pause();
        notificationSound.current = null;
      }
      if (messageSentSound.current) {
        messageSentSound.current.pause();
        messageSentSound.current = null;
      }
    };
  }, []);
  
  // Initialize Socket.io connection
  useEffect(() => {
    // Get WebSocket URL from environment variable
    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    console.log(`Connecting chat to socket server at: ${wsUrl}`);
    
    // Initialize socket
    socket.current = io(wsUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
    
    // Socket connection events
    socket.current.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
      
      // Join room
      if (username && roomId) {
        socket.current?.emit("join-room", { roomId, username });
      }
    });
    
    socket.current.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });
    
    socket.current.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
    });
    
    // Clean up on unmount
    return () => {
      console.log("Cleaning up socket connection");
      socket.current?.disconnect();
    };
  }, [roomId, username]);
  
  // Handle room-specific events
  useEffect(() => {
    if (!socket.current) return;
    
    // Update users list and check if current user is host
    socket.current.on("room-users", (users) => {
      setUsers(users);
      // Check if current user is host
      const currentUser = users.find((user: any) => user.username === username);
      setIsHost(currentUser?.isHost || false);
    });
    
    // Receive video state updates
    socket.current.on("video-state-update", ({ videoId, videoTitle, isPlaying }) => {
      if (videoId) {
        setCurrentVideo(videoId, videoTitle);
      }
      setPlaying(isPlaying);
    });
    
    // Previous messages when joining room
    socket.current.on("message-history", (messages) => {
      setChatMessages(messages);
    });
    
    // New message received
    socket.current.on("receive-message", (message) => {
      console.log("Received message:", message);
      
      // Play notification sound for messages from others
      if (message.senderId !== username && notificationSound.current) {
        notificationSound.current.play().catch(err => {
          console.error("Error playing notification:", err);
        });
      }
      
      setChatMessages(prevMessages => [...prevMessages, message]);
    });
    
    // Typing indicators
    socket.current.on("typing-indicator", ({ username: typingUser, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [typingUser]: isTyping
      }));
    });
    
    // Clean up event listeners
    return () => {
      if (socket.current) {
        socket.current.off("room-users");
        socket.current.off("video-state-update");
        socket.current.off("message-history");
        socket.current.off("receive-message");
        socket.current.off("typing-indicator");
      }
    };
  }, [roomId, username, setCurrentVideo, setPlaying]);
  
  // Handle sending messages
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !socket.current) return;
    
    const messageData = {
      roomId,
      message: message.trim(),
      senderId: username,
      type: 'text' as const,
      content: null,
      timestamp: Date.now()
    };
    
    socket.current.emit("send-message", messageData);
    
    // Play sent message sound
    if (messageSentSound.current) {
      messageSentSound.current.play().catch(err => {
        console.error("Error playing sent sound:", err);
      });
    }
    
    // Add to local state (optimistic update)
    setChatMessages(prevMessages => [...prevMessages, messageData]);
    setMessage('');
  };
  
  // Handle typing indicator
  const handleTyping = (isTyping: boolean) => {
    if (!socket.current || !username) return;
    
    socket.current.emit("typing", { roomId, username, isTyping });
  };
  
  // Handle video selection
  const handleVideoSelect = (videoId: string, videoTitle: string) => {
    if (!socket.current) return;
    
    // Emit play event
    socket.current.emit("play-video", { roomId, videoId, videoTitle });
    
    // Add to playlist
    addToPlaylist({
      id: videoId,
      title: videoTitle,
    });
    
    // Close search
    setShowSearchModal(false);
    setShowQuickSearch(false);
  };
  
  // Quick search for YouTube videos
  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quickSearchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          quickSearchQuery
        )}&type=video&maxResults=5&key=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      
      const data = await response.json();
      
      // Format results
      const formattedResults = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
      }));
      
      setQuickSearchResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search videos. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col h-full">
      <RoomHeader 
        roomId={roomId} 
        users={users}
        isHost={isHost}
        onProfileClick={() => setShowProfileModal(true)}
      />
      
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
        {/* Video player area */}
        <div className="w-full md:w-2/3 h-1/2 md:h-auto">
          <YouTubePlayer 
            socket={socket.current}
            roomId={roomId}
            isHost={isHost}
            onVideoSelect={handleVideoSelect}
            currentVideoId={currentVideoId}
            isPlaying={true}
            setIsPlaying={setPlaying}
          />
        </div>
        
        {/* Chat area */}
        <div className="w-full md:w-1/3 h-1/2 md:h-auto flex flex-col border-t md:border-t-0 md:border-l border-gray-200">
          {/* Messages list */}
          <div className="flex-grow overflow-y-auto p-4 space-y-2">
            {chatMessages.map((msg, index) => (
              <div 
                key={msg.id || `${msg.timestamp}-${index}`}
                className={`max-w-[85%] ${msg.senderId === username ? 'ml-auto bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg p-3`}
              >
                {msg.senderId !== username && (
                  <div className="font-bold text-xs mb-1">{msg.senderId}</div>
                )}
                <div>{msg.message}</div>
                <div className="text-xs opacity-70 mt-1 text-right">
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
            ))}
            
            {/* Typing indicators */}
            {Object.entries(typingUsers)
              .filter(([user, isTyping]) => user !== username && isTyping)
              .map(([user]) => (
                <div key={`typing-${user}`} className="text-gray-500 text-sm">
                  {user} is typing...
                </div>
              ))}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input */}
          <div className="border-t border-gray-200 p-3">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping(!!e.target.value.trim());
                }}
                placeholder="Type a message..."
                className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="bg-blue-500 text-white rounded-full p-2 transition hover:bg-blue-600 disabled:opacity-50"
              >
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Search modal */}
      {showSearchModal && (
        <SearchModal 
          onClose={() => setShowSearchModal(false)} 
          onVideoSelect={handleVideoSelect}
          socket={socket.current}
          roomId={roomId}
        />
      )}
      
      {/* Profile settings modal */}
      {showProfileModal && (
        <ProfileSettings onClose={() => setShowProfileModal(false)} />
      )}
      
      {/* Quick search overlay */}
      <AnimatePresence>
        {showQuickSearch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute left-0 right-0 bottom-0 p-4 bg-white border-t border-gray-200 shadow-lg z-10"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Quick Search</h3>
              <button
                onClick={() => setShowQuickSearch(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleQuickSearch} className="flex gap-2 mb-3">
              <input
                type="text"
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                placeholder="Search YouTube..."
                className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isSearching || !quickSearchQuery.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg transition hover:bg-blue-600 disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>
            
            {searchError && (
              <div className="text-red-500 mb-3">{searchError}</div>
            )}
            
            {quickSearchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {quickSearchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleVideoSelect(result.id, result.title)}
                    className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <img
                      src={result.thumbnailUrl}
                      alt={result.title}
                      className="w-16 h-12 object-cover rounded mr-3"
                    />
                    <div>
                      <div className="font-medium text-sm line-clamp-2">{result.title}</div>
                      <div className="text-xs text-gray-500">{result.channelTitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatRoom; 