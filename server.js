// Load environment variables if .env file exists
try {
  require('dotenv').config();
} catch (err) {
  console.log('dotenv not installed, skipping .env load');
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Environment variables with fallbacks
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Store active rooms with their data
const rooms = {};

// User typing indicators
const typingUsers = {};

// Use shorter, more user-friendly room IDs (6 characters)
function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Configure CORS
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? [CLIENT_URL, /\.vercel\.app$/] // Allow Vercel deployments
    : '*', // Allow all in development
  methods: ['GET', 'POST'],
  credentials: true
};

const app = express();

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Send the user their own ID
  socket.emit('user:self', { id: socket.id });

  // Handle room creation
  socket.on('create-room', () => {
    const roomId = generateRoomId();
    
    // Initialize room data
    rooms[roomId] = {
      id: roomId,
      hostId: socket.id,
        users: [],
      playlist: [],
        currentVideo: null,
      isPlaying: false,
      currentTime: 0 // Track current playback position
    };
    
    socket.emit('room:created', { roomId });
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });

  // Handle joining a room
  socket.on('join-room', ({ roomId, username }) => {
    console.log(`User ${socket.id} (${username}) is joining room ${roomId}`);
    
    // Store room ID in socket data for later reference (disconnection)
    socket.data.roomId = roomId;
    
    // Check if room exists
    if (!rooms[roomId]) {
      console.log(`Creating new room: ${roomId}`);
      // Create new room with this user as host
      rooms[roomId] = {
        id: roomId,
        hostId: socket.id,
        users: [],
        playlist: [],
        messages: [],
        currentVideo: null,
        isPlaying: false,
        currentTime: 0
      };
    }
    
    // Add user to room if not already in
    const existingUser = rooms[roomId].users.find(user => user.id === socket.id);
    if (!existingUser) {
      rooms[roomId].users.push({
        id: socket.id,
        username: username
      });
      
      // Join the socket.io room
      socket.join(roomId);
      
      // Send a system message that user joined
      io.to(roomId).emit('chat:message', {
        id: generateId(),
        type: 'system',
        content: `${username} has joined the room`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Initialize typing for this room if needed
    if (!typingUsers[roomId]) {
      typingUsers[roomId] = {};
    }
    
    // Send current room state to the user
    socket.emit('room:joined', {
      roomId,
      hostId: rooms[roomId].hostId,
      users: rooms[roomId].users,
      playlist: rooms[roomId].playlist,
      currentVideo: rooms[roomId].currentVideo,
      isPlaying: rooms[roomId].isPlaying
    });
    
    // Notify others that user joined
    socket.to(roomId).emit('user:joined', { user: existingUser || { id: socket.id, username } });
    
    // Update all clients with the new user list
    io.to(roomId).emit('users:update', {
      users: rooms[roomId].users,
      hostId: rooms[roomId].hostId
    });
    
    // Store the roomId in the socket for reference on disconnect
    socket.data.username = username;
    
    console.log(`User ${username} joined room ${roomId}`);
  });
  
  // Handle chat messages
  socket.on('chat:message', ({ roomId, text }) => {
    const username = socket.data.username || 'Anonymous';
    
    if (!rooms[roomId]) return;
    
    // Create message object with unique ID
    const message = {
      id: Date.now().toString(),
      userId: socket.id,
      username,
      text,
      timestamp: new Date().toISOString()
    };
    
    // Reset typing indicator for this user
    if (typingUsers[roomId] && typingUsers[roomId][socket.id]) {
      delete typingUsers[roomId][socket.id];
      io.to(roomId).emit('chat:typing', { users: Object.values(typingUsers[roomId]) });
    }
    
    // Broadcast to everyone in the room including sender
    io.to(roomId).emit('chat:message', message);
  });
  
  // Handle typing indicator
  socket.on('chat:typing', ({ roomId, isTyping }) => {
    if (!rooms[roomId] || !socket.data.username) return;
    
    if (!typingUsers[roomId]) {
      typingUsers[roomId] = {};
    }
    
    if (isTyping) {
      typingUsers[roomId][socket.id] = socket.data.username;
    } else if (typingUsers[roomId][socket.id]) {
      delete typingUsers[roomId][socket.id];
    }
    
    // Broadcast typing users to everyone except the sender
    socket.to(roomId).emit('chat:typing', {
      users: Object.values(typingUsers[roomId])
    });
  });
  
  // Handle video playback
  socket.on('video:play', ({ roomId, videoId, title }) => {
    if (!rooms[roomId]) {
      console.error(`Cannot play video: Room ${roomId} not found`);
      return;
    }
    
    console.log(`Playing video in room ${roomId}: ${videoId} - ${title || 'Untitled'}`);
    
    // Update room state comprehensively
    rooms[roomId].currentVideo = { id: videoId, title: title || 'Untitled' };
    rooms[roomId].isPlaying = true;
    rooms[roomId].currentTime = 0; // Reset time when a new video starts
    
    // Add to playlist if not already there
    const videoExists = rooms[roomId].playlist.some(item => item.id === videoId);
    if (!videoExists) {
      console.log(`Adding ${videoId} to playlist in room ${roomId}`);
      rooms[roomId].playlist.push({ id: videoId, title: title || 'Untitled' });
    }
    
    // Broadcast to everyone in the room
    io.to(roomId).emit('video:play', { videoId, title: title || 'Untitled' });
    
    // Also broadcast updated playlist to ensure everyone has the same list
    io.to(roomId).emit('playlist:update', { playlist: rooms[roomId].playlist });
    
    // After a short delay, send the timestamp to ensure everyone syncs properly
    setTimeout(() => {
      io.to(roomId).emit('video:timestamp', {
        videoId,
        time: 0, // Start from beginning
        isPlaying: true
      });
      console.log(`Sent initial timestamp sync for ${videoId} to all users in room ${roomId}`);
    }, 2000);
  });
  
  // Handle video pause
  socket.on('video:pause', ({ roomId }) => {
    if (!rooms[roomId]) {
      console.error(`Cannot pause: Room ${roomId} not found`);
      return;
    }
    
    console.log(`Pausing video in room ${roomId} by user ${socket.id}`);
    
    // Update room state
    rooms[roomId].isPlaying = false;
    
    // Broadcast to everyone in the room
    io.to(roomId).emit('video:pause');
  });
  
  // Handle video resume
  socket.on('video:resume', ({ roomId }) => {
    if (!rooms[roomId]) {
      console.error(`Cannot resume: Room ${roomId} not found`);
      return;
    }
    
    console.log(`Resuming video in room ${roomId} by user ${socket.id}`);
    
    // Update room state
    rooms[roomId].isPlaying = true;
    
    // Broadcast to everyone in the room
    io.to(roomId).emit('video:resume');
  });
  
  // Handle seeking
  socket.on('seek-video', ({ roomId, seekTime }) => {
    if (!rooms[roomId]) return;
    
    console.log(`User ${socket.id} seeking to ${seekTime}s in room ${roomId}`);
    
    // Update room state
    if (rooms[roomId].currentTime !== undefined) {
      rooms[roomId].currentTime = seekTime;
    }
    
    // Broadcast to everyone in the room
    io.to(roomId).emit('seek-video', { seekTime });
  });
  
  // Update current playback time from clients
  socket.on('video:updateTime', ({ roomId, currentTime, videoId }) => {
    if (!rooms[roomId]) return;
    
    // Only update if the current video ID matches
    if (videoId && rooms[roomId]?.currentVideo?.id === videoId) {
      // Store the time for sync purposes
      rooms[roomId].currentTime = currentTime;
      
      // Broadcast sync periodically to keep everyone in sync
      // This happens rarely to avoid overwhelming the network
      if (Math.random() < 0.05) { // 5% chance to broadcast sync
        io.to(roomId).emit('video:timestamp', {
          videoId,
          time: currentTime,
          isPlaying: rooms[roomId].isPlaying
        });
      }
    }
  });
  
  // Handle timestamp request (for late joiners to sync)
  socket.on('video:requestTimestamp', ({ roomId }) => {
    if (!rooms[roomId]) {
      console.error(`Cannot get timestamp: Room ${roomId} not found`);
      return;
    }
    
    console.log(`User ${socket.id} requesting current timestamp in room ${roomId}`);
    
    // If there's a current video and timestamp stored in the room
    if (rooms[roomId].currentVideo && rooms[roomId].currentTime !== undefined) {
      // Send timestamp directly to requesting client
      socket.emit('video:timestamp', {
        videoId: rooms[roomId].currentVideo.id,
        time: rooms[roomId].currentTime,
        isPlaying: rooms[roomId].isPlaying
      });
      
      console.log(`Sent timestamp ${rooms[roomId].currentTime}s for ${rooms[roomId].currentVideo.id} to ${socket.id}`);
    } else {
      // If no timestamp stored, try to get it from any client
      io.to(roomId).emit('video:requestTimestampFromAnyone', { requesterId: socket.id });
      console.log(`No timestamp stored, asking any client to provide timestamp for ${socket.id}`);
    }
  });
  
  // Handle video ended
  socket.on('video:ended', ({ roomId }) => {
    if (!rooms[roomId]) return;
    
    console.log(`Video ended in room ${roomId}`);
    
    // Update room state
    rooms[roomId].isPlaying = false;
    if (rooms[roomId].currentTime !== undefined) {
      rooms[roomId].currentTime = 0;
    }
    
    // Broadcast to everyone in the room
    io.to(roomId).emit('video:ended');
  });

  // Search YouTube for videos with enhanced error handling
  const searchYouTube = async (query) => {
    try {
      console.log(`Searching YouTube for: ${query}`);
      
      // Add a timeout to prevent hanging searches
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Search timeout")), 10000)
      );
      
      // Try ytsr with timeout
      const searchResultsPromise = ytsr(query, { limit: 20 });
      const searchResults = await Promise.race([searchResultsPromise, timeoutPromise]);
      
      // Filter to only show videos, not channels or playlists
      const formattedResults = searchResults.items
        .filter(item => item.type === 'video')
        .map(video => ({
          id: video.id,
          title: video.title,
          thumbnail: video.bestThumbnail?.url || video.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
          duration: video.duration || ''
        }))
        .filter(item => item.id && item.title); // Ensure we have at least ID and title
        
      console.log(`Found ${searchResults.items.length} raw results, returning ${formattedResults.length} formatted results`);
      
      // If no results found, use fallback
      if (formattedResults.length === 0) {
        throw new Error("No results found");
      }
      
      return formattedResults;
    } catch (error) {
      console.error("YouTube search error:", error.message);
      // If ytsr fails, use fallback search
      return fallbackSearch(query);
    }
  };

  // Fallback search function with popular songs
  const fallbackSearch = async (query) => {
    try {
      console.log("Using fallback search method for query:", query);
      
      // Hardcoded popular songs as fallback when search fails
      const fallbackResults = [
        // Bollywood songs
        {
          id: 'swC9xzv1kXE',
          title: 'Main Agar Saamne Aa Bhi Jaaya Karo | Raaz | Dino, Bipasha Basu | Abhijeet, Alka Yagnik',
          thumbnail: 'https://img.youtube.com/vi/swC9xzv1kXE/maxresdefault.jpg',
          duration: '5:40'
        },
        {
          id: 'hoNb6HuNmU0',
          title: 'Kya Mujhe Pyar Hai Full Video - Woh Lamhe|Shiny Ahuja,Kangna Ranaut|KK|Pritam',
          thumbnail: 'https://img.youtube.com/vi/hoNb6HuNmU0/maxresdefault.jpg',
          duration: '5:08'
        },
        {
          id: 'hejXc_FSYb8',
          title: 'Rozana - Naam Shabana | Akshay Kumar, Taapsee Pannu | Shreya Ghoshal |Rochak Kohli |Manoj Muntashir',
          thumbnail: 'https://img.youtube.com/vi/hejXc_FSYb8/maxresdefault.jpg',
          duration: '3:42'
        },
        // International songs
        {
          id: 'JGwWNGJdvx8',
          title: 'Ed Sheeran - Shape of You (Official Music Video)',
          thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg',
          duration: '4:24'
        },
        {
          id: 'kJQP7kiw5Fk',
          title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
          thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
          duration: '4:41'
        },
        {
          id: 'xpVfcZ0ZcFM',
          title: 'Drake - God\'s Plan',
          thumbnail: 'https://img.youtube.com/vi/xpVfcZ0ZcFM/maxresdefault.jpg',
          duration: '5:57'
        },
        {
          id: '2Vv-BfVoq4g',
          title: 'Billie Eilish - bad guy',
          thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/maxresdefault.jpg',
          duration: '3:25'
        },
        {
          id: 'fHI8X4OXluQ',
          title: 'The Weeknd - Blinding Lights (Official Video)',
          thumbnail: 'https://img.youtube.com/vi/fHI8X4OXluQ/maxresdefault.jpg',
          duration: '4:22'
        }
      ];
      
      // Convert query and titles to lowercase for better matching
      const lowercaseQuery = query.toLowerCase();
      
      // Filter based on query to show relevant results
      const filtered = fallbackResults.filter(item => 
        item.title.toLowerCase().includes(lowercaseQuery)
      );
      
      console.log(`Fallback search found ${filtered.length} matches for "${query}"`);
      
      // Return matched results, or at least a few if nothing matches
      return filtered.length > 0 ? filtered : fallbackResults.slice(0, 5);
    } catch (error) {
      console.error("Fallback search error:", error);
      // Last resort - return at least 3 songs
      return [
        {
          id: 'swC9xzv1kXE',
          title: 'Main Agar Saamne - Raaz',
          thumbnail: 'https://img.youtube.com/vi/swC9xzv1kXE/maxresdefault.jpg',
          duration: '5:40'
        },
        {
          id: 'JGwWNGJdvx8',
          title: 'Ed Sheeran - Shape of You',
          thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg',
          duration: '4:24'
        },
        {
          id: 'kJQP7kiw5Fk',
          title: 'Luis Fonsi - Despacito',
          thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
          duration: '4:41'
        }
      ];
    }
  };

  // Handle all possible search event names
  socket.on('search', handleSearch);
  socket.on('video:search', handleSearch);
  
  // Unified search handler function
  async function handleSearch({ query }) {
    console.log(`Received search request for: "${query}" from ${socket.id}`);
    
    if (!query || typeof query !== 'string') {
      console.error('Invalid search query:', query);
      socket.emit('search-results', []);
      socket.emit('video:searchResults', { results: [], error: 'Invalid search query' });
      return;
    }
    
    try {
      console.log("Starting YouTube search with query:", query);
      const searchResults = await searchYouTube(query);
      console.log(`Found ${searchResults.length} results for "${query}"`);
      
      // Send results using both possible event names to ensure compatibility
      socket.emit('search-results', searchResults);
      socket.emit('video:searchResults', { 
        results: searchResults,
        query: query 
      });
    } catch (error) {
      console.error("Search completely failed:", error.message);
      // Send empty results with an error message
      socket.emit('search-results', []);
      socket.emit('video:searchResults', { 
        results: [], 
        error: 'Error searching YouTube. Please try again.' 
      });
    }
  }
  
  // Handle playlist add
  socket.on('playlist:add', ({ roomId, videoId, title }) => {
    if (!rooms[roomId]) return;
    
    // Check if item already exists in playlist
    const videoExists = rooms[roomId].playlist.some(item => item.id === videoId);
    if (!videoExists) {
      // Add to playlist
      rooms[roomId].playlist.push({ id: videoId, title: title || 'Untitled' });
      console.log(`Added ${videoId} to playlist in room ${roomId}`);
      
      // Broadcast updated playlist to all clients in the room
      io.to(roomId).emit('playlist:update', { playlist: rooms[roomId].playlist });
    }
  });
  
  // Handle playlist remove
  socket.on('playlist:remove', ({ roomId, videoId }) => {
    if (!rooms[roomId]) return;
    
    // Remove from playlist
    rooms[roomId].playlist = rooms[roomId].playlist.filter(item => item.id !== videoId);
    console.log(`Removed ${videoId} from playlist in room ${roomId}`);
    
    // Broadcast updated playlist to all clients in the room
    io.to(roomId).emit('playlist:update', { playlist: rooms[roomId].playlist });
  });
  
  // Handle playlist clear
  socket.on('playlist:clear', ({ roomId }) => {
    if (!rooms[roomId]) return;
    
    // Clear playlist
    rooms[roomId].playlist = [];
    console.log(`Cleared playlist in room ${roomId}`);
    
    // Broadcast updated playlist to all clients in the room
    io.to(roomId).emit('playlist:update', { playlist: [] });
  });
  
  // Handle playlist request
  socket.on('playlist:request', ({ roomId }) => {
    if (!rooms[roomId]) return;
    
    console.log(`User ${socket.id} requesting playlist for room ${roomId}`);
    
    // Send current playlist to the requesting client
    socket.emit('playlist:update', { 
      playlist: rooms[roomId].playlist || [] 
    });
  });
  
  // Handle timestamp response from any client
  socket.on('video:timestamp', ({ roomId, videoId, time, isPlaying }) => {
    if (!rooms[roomId]) return;
    
    console.log(`User ${socket.id} sending timestamp: ${time}s for video ${videoId} in room ${roomId}`);
    
    // Update room state
    rooms[roomId].currentTime = time;
    
    // If the video ID is different than what's stored, update it
    if (videoId && (!rooms[roomId].currentVideo || rooms[roomId].currentVideo.id !== videoId)) {
      console.log(`Updating room current video to ${videoId}`);
      rooms[roomId].currentVideo = { 
        id: videoId, 
        title: rooms[roomId].currentVideo?.title || 'Unknown Track'
      };
    }
    
    // Update playing state
    rooms[roomId].isPlaying = isPlaying;
    
    // Send to the specific requesting client if specified, otherwise broadcast to everyone
    const requesterId = socket.data.requesterId;
    if (requesterId) {
      // Send to specific requester
      io.to(requesterId).emit('video:timestamp', { videoId, time, isPlaying });
      console.log(`Sent timestamp to requester ${requesterId}`);
    } else {
      // Broadcast to everyone in the room
      io.to(roomId).emit('video:timestamp', { videoId, time, isPlaying });
      console.log(`Broadcast timestamp to all users in room ${roomId}`);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Get user's room and username
    const userRoomId = Object.keys(rooms).find(roomId => 
      rooms[roomId]?.users?.find(user => user.id === socket.id)
    );
    
    if (userRoomId && rooms[userRoomId]) {
      // Find user to get their username before removing
      const disconnectedUser = rooms[userRoomId].users.find(user => user.id === socket.id);
      const username = disconnectedUser?.username || 'Someone';
      
      // Remove user from room
      rooms[userRoomId].users = rooms[userRoomId].users.filter(user => user.id !== socket.id);
      
      // Check if room is empty
      if (rooms[userRoomId].users.length === 0) {
        console.log(`Room ${userRoomId} is empty, removing`);
        delete rooms[userRoomId];
      } else {
        // If not empty, check if host left
        if (socket.id === rooms[userRoomId].hostId) {
          // Assign a new host
          const newHost = rooms[userRoomId].users[0];
          rooms[userRoomId].hostId = newHost.id;
          console.log(`New host for room ${userRoomId}: ${newHost.username} (${newHost.id})`);
        }
        
        // Send updated user list to remaining users
        io.to(userRoomId).emit('users:update', { 
          users: rooms[userRoomId].users,
          hostId: rooms[userRoomId].hostId
        });
        
        // Send a system message that user left
        io.to(userRoomId).emit('chat:message', {
          id: generateId(),
          type: 'system',
          content: `${username} has left the room`,
          timestamp: new Date().toISOString()
        });
      }
    }
  });
});

// Start server and listen for connections
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
  console.log(`Accepting connections from: ${NODE_ENV === 'production' ? [CLIENT_URL, '*.vercel.app'] : '*'}`);
  console.log(`Environment: ${NODE_ENV}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Helper function to generate unique IDs for messages
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}; 