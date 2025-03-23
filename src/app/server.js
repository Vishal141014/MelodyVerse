const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const ytsr = require('ytsr');

// Use port 3001 to avoid conflict with Next.js
const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Add a test route to verify the server is running
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Basic search route for testing without socket.io
app.get('/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({ error: 'No query provided' });
  }
  
  try {
    const searchOptions = {
      limit: 10,
      gl: 'US',
      hl: 'en',
      safeSearch: false,
    };
    
    const searchResults = await ytsr(query, searchOptions);
    
    const formattedResults = searchResults.items
      .filter(item => item.type === 'video')
      .map(item => ({
        id: item.id,
        title: item.title,
        thumbnail: item.bestThumbnail?.url || item.thumbnails[0]?.url || '',
        duration: item.duration || ''
      }));
    
    res.json({ results: formattedResults });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle YouTube video search
  socket.on('video:search', async ({ query }) => {
    console.log(`Search request from ${socket.id} for: "${query}"`);
    
    if (!query) {
      socket.emit('video:searchResults', { 
        results: [], 
        error: 'No search query provided' 
      });
      return;
    }
    
    try {
      const searchOptions = {
        limit: 10,
        gl: 'US',
        hl: 'en',
        safeSearch: false,
      };
      
      console.log('Performing search with ytsr...');
      const searchResults = await ytsr(query, searchOptions);
      console.log(`Found ${searchResults.items.length} results`);
      
      // Filter and format results
      const formattedResults = searchResults.items
        .filter(item => item.type === 'video')
        .map(item => ({
          id: item.id,
          title: item.title,
          thumbnail: item.bestThumbnail?.url || item.thumbnails[0]?.url || '',
          duration: item.duration || ''
        }));
      
      console.log(`Sending ${formattedResults.length} formatted results`);
      
      // Send results back to client
      socket.emit('video:searchResults', { 
        results: formattedResults 
      });
      
    } catch (error) {
      console.error('Search error:', error);
      socket.emit('video:searchResults', { 
        results: [], 
        error: error.message || 'Failed to search videos' 
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
}); 