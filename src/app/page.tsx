"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaMusic, FaUsers, FaRandom, FaPlusCircle, FaPlay, FaPlus, FaUser, FaDoorOpen, FaArrowRight, FaComments } from "react-icons/fa";
import ProfileSettings from "./components/user/ProfileSettings";
import { useStore } from "./store";

const generateRoomId = (): string => {
  // Generate a readable room ID with 3 parts (word-word-digits)
  const adjectives = [
    "happy", "sunny", "cosmic", "funky", "jazzy", "electric", "mellow", "vibrant", "smooth", "dreamy"
  ];
  
  const nouns = [
    "note", "beat", "rhythm", "melody", "tune", "harmony", "groove", "vibe", "song", "sound"
  ];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  
  return `${adj}-${noun}-${number}`;
};

const Home = () => {
  const router = useRouter();
  const { username, setUsername } = useStore();
  
  const [roomId, setRoomId] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [joinMode, setJoinMode] = useState<'join' | 'create'>('join');
  const [error, setError] = useState('');
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  
  // Check if username is set, if not, show profile settings
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      setShowProfileSettings(true);
    }
  }, [setUsername]);
  
  // Handle create room
  const handleCreateRoom = async () => {
    if (!username) {
      setShowProfileSettings(true);
      return;
    }
    
    setIsCreatingRoom(true);
    setError('');
    
    try {
      // Direct socket.io connection approach
      const socketIo = await import('socket.io-client');
      const socket = socketIo.default('http://localhost:3001', {
        transports: ['websocket', 'polling'], // Add polling as a fallback
        timeout: 20000, // Increase timeout to 20 seconds
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => {
          console.log('Connected to socket server');
          resolve();
        });
        
        socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(new Error(`Connection error: ${error.message}`));
        });
        
        // Set a timeout in case the connection hangs
        setTimeout(() => reject(new Error('Connection timeout after 8 seconds')), 8000);
      });
      
      // Once connected, emit room creation request
      let roomCreated = false;
      
      console.log('Emitting create-room event');
      socket.emit('create-room');
      
      socket.on('room:created', (data) => {
        console.log('Room created:', data.roomId);
        roomCreated = true;
        socket.disconnect();
        router.push(`/room/${data.roomId}`);
      });
      
      // Set a timeout for room creation response
      setTimeout(() => {
        if (!roomCreated) {
          console.error('Room creation timed out');
          socket.disconnect();
          setError('Room creation timed out. Please check if the server is running at http://localhost:3001');
          setIsCreatingRoom(false);
        }
      }, 10000);
      
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Server connection failed. Please try again later.');
      setIsCreatingRoom(false);
    }
  };
  
  // Handle join room
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      setShowProfileSettings(true);
      return;
    }
    
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    setIsJoiningRoom(true);
    router.push(`/room/${roomId.trim()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (joinMode === 'join') {
        if (!roomId.trim()) {
          setError('Please enter a room ID');
          setIsLoading(false);
          return;
        }
        
        // Store username in localStorage and navigate to room
        localStorage.setItem('username', username);
        router.push(`/room/${roomId}`);
      } else {
        // Create a new room
        // For now, we'll just redirect to a random ID
        // In a real app, you would create the room on the server first
        localStorage.setItem('username', username);
        router.push(`/create-room?username=${encodeURIComponent(username)}`);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const closeProfileSettings = () => {
    // Only close if username is set
    if (username) {
      setShowProfileSettings(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 relative overflow-hidden bg-pink-light">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 rounded-full filter blur-3xl opacity-20 animate-pulse" 
             style={{ backgroundColor: '#FFB7CA', animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 rounded-full filter blur-3xl opacity-20 animate-pulse" 
             style={{ backgroundColor: '#FFB7CA', animationDuration: '10s' }}></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/60 backdrop-blur-md rounded-xl max-w-md w-full p-6 shadow relative border border-pink-medium/40"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-md"
               style={{ background: 'linear-gradient(to right, #EC407A, #C2185B)' }}>
            <FaMusic className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-pink-dark mb-2 text-center">
            MelodyVerse
          </h1>
          <p className="text-pink-dark/70 text-center">
            Sync music and chat with friends in real-time
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-600 text-sm text-center">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          {/* Create room button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateRoom}
            disabled={isCreatingRoom}
            className="w-full flex items-center justify-center gap-2 rounded-lg p-3.5 font-medium shadow-sm border-none cursor-pointer relative overflow-hidden text-white"
            style={{ background: 'linear-gradient(to right, #EC407A, #C2185B)' }}
          >
            {isCreatingRoom ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white/90 animate-spin mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <FaPlus className="text-white" /> Create a Room
              </>
            )}
          </motion.button>
          
          <div className="flex items-center gap-4 py-2">
            <div className="flex-grow h-px bg-pink-medium/30"></div>
            <p className="text-pink-dark/50 text-sm font-medium">or</p>
            <div className="flex-grow h-px bg-pink-medium/30"></div>
          </div>
          
          {/* Join room form */}
          <form onSubmit={handleJoinRoom} className="flex flex-col gap-5">
            <div>
              <label htmlFor="roomId" className="block text-pink-dark text-sm font-medium mb-2.5">
                Join an existing room
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="w-full p-3.5 bg-white border border-pink-medium/30 rounded-lg text-pink-dark outline-none shadow-sm transition-all focus:border-pink-dark/50 focus:shadow-md"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isJoiningRoom}
              className="w-full flex items-center justify-center gap-2 bg-white text-pink-dark rounded-lg p-3.5 font-medium shadow-sm border border-pink-medium/20 cursor-pointer"
            >
              {isJoiningRoom ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-pink-dark/30 border-t-pink-dark/90 animate-spin mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  Join Room <FaArrowRight className="ml-1 text-pink-dark" />
                </>
              )}
            </motion.button>
          </form>
        </div>
        
        {/* Features */}
        <div className="mt-10 pt-6 border-t border-pink-medium/20">
          <h3 className="text-pink-dark text-sm font-medium mb-4">Features:</h3>
          <ul className="grid gap-4 text-sm">
            <li className="flex items-center gap-3 text-pink-dark/70">
              <div className="w-9 h-9 rounded-full bg-pink-light flex items-center justify-center shadow-sm flex-shrink-0">
                <FaMusic className="text-pink-dark text-sm" />
              </div>
              <span>Synchronize YouTube music with friends</span>
            </li>
            <li className="flex items-center gap-3 text-pink-dark/70">
              <div className="w-9 h-9 rounded-full bg-pink-light flex items-center justify-center shadow-sm flex-shrink-0">
                <FaComments className="text-pink-dark text-sm" />
              </div>
              <span>Chat in real-time while enjoying music</span>
            </li>
          </ul>
        </div>
      </motion.div>
      
      {/* Profile settings modal */}
      {showProfileSettings && (
        <ProfileSettings onClose={closeProfileSettings} />
      )}
      
      {/* Footer */}
      <div className="absolute bottom-4 text-pink-dark/40 text-xs">
        &copy; {new Date().getFullYear()} MelodyVerse
      </div>
    </main>
  );
};

export default Home; 