"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaPlus, FaSpinner } from 'react-icons/fa';
import { Socket } from 'socket.io-client';

interface SearchResult {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: string;
}

interface SearchModalProps {
  socket: Socket | null;
  roomId: string;
  onClose: () => void;
  onVideoSelect: (videoId: string, videoTitle: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ 
  socket, 
  roomId, 
  onClose, 
  onVideoSelect 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedVideos, setAddedVideos] = useState<string[]>([]);
  
  // Handle search submission
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim() || !socket) {
      return;
    }
    
    setError(null);
    setIsLoading(true);
    setSearchResults([]);
    console.log("Searching for:", searchQuery);
    
    // Register event handlers for both possible response formats
    const searchResultHandler = (data: { results: SearchResult[], error?: string }) => {
      setIsLoading(false);
      
      if (data.error) {
        console.error("Search error:", data.error);
        setError(data.error);
        return;
      }
      
      if (data.results && Array.isArray(data.results)) {
        console.log(`Received ${data.results.length} results from video:searchResults`);
        if (data.results.length === 0) {
          setError("No results found. Try different keywords.");
        } else {
          setSearchResults(data.results);
        }
      }
    };
    
    // Handler for direct array format (search-results event)
    const directResultsHandler = (results: SearchResult[]) => {
      setIsLoading(false);
      
      if (!results || !Array.isArray(results)) {
        console.error("Invalid search results format", results);
        return;
      }
      
      console.log(`Received ${results.length} results from search-results`);
      if (results.length === 0) {
        setError("No results found. Try different keywords.");
      } else {
        setSearchResults(results);
      }
    };
    
    // Listen for both search result event formats
    socket.once('video:searchResults', searchResultHandler);
    socket.once('search-results', directResultsHandler);
    
    // Send search request using both possible event names
    console.log("Sending search request for:", searchQuery);
    socket.emit('video:search', { query: searchQuery });
    socket.emit('search', { query: searchQuery });
    
    // Set timeout for search
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError("Search timed out. Please try again.");
        socket.off('video:searchResults', searchResultHandler);
        socket.off('search-results', directResultsHandler);
      }
    }, 15000); // Increase timeout to 15 seconds
  };
  
  // Handle video selection
  const handleVideoSelect = (result: SearchResult) => {
    if (!socket) return;
    
    // Add to playlist
    socket.emit('playlist:add', {
      videoId: result.id,
      title: result.title
    });
    
    // Mark as added
    setAddedVideos((prev) => [...prev, result.id]);
    
    // If it's the first video, also select it
    socket.emit('video:play', {
      roomId,
      videoId: result.id,
      title: result.title
    });
    
    // Also notify parent
    onVideoSelect(result.id, result.title);
    
    // Close modal if needed
    // onClose();
  };
  
  return (
    <motion.div
      className="fixed inset-0 bg-pink-dark/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white w-full max-w-xl rounded-xl shadow-lg overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pink-medium/20 bg-pink-light/20">
          <h2 className="text-xl font-semibold text-pink-dark">Search for Music</h2>
          <button 
            onClick={onClose}
            className="text-pink-dark/70 hover:text-pink-dark bg-transparent border-none p-2 rounded-full hover:bg-pink-light/20"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Search form */}
        <div className="p-4 border-b border-pink-medium/20">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for songs on YouTube..."
              className="flex-1 p-3.5 bg-white border border-pink-medium/30 rounded-lg text-pink-dark outline-none focus:border-pink-dark/50 shadow-sm"
              autoFocus
            />
            <button 
              type="submit" 
              className="bg-gradient-to-r from-pink-500 to-pink-dark text-white border-none rounded-lg w-[50px] h-[50px] flex items-center justify-center cursor-pointer transition-all hover:shadow-md"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
            </button>
          </form>
        </div>
        
        {/* Results */}
        <div className="flex-1 overflow-auto p-4 max-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-pink-dark/70">
              <div className="w-10 h-10 border-4 border-t-pink-dark border-pink-light/30 rounded-full animate-spin mb-4"></div>
              <p>Searching for "{searchQuery}"...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg text-center">
              {error}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid gap-3">
              {searchResults.map((result) => (
                <motion.div 
                  key={result.id}
                  className="flex items-center p-3 rounded-lg bg-white border border-pink-medium/20 hover:border-pink-medium/30 transition-all"
                  whileHover={{ 
                    backgroundColor: 'rgba(255, 209, 220, 0.1)',
                    y: -2, 
                    boxShadow: '0 3px 10px rgba(194, 24, 91, 0.1)'
                  }}
                >
                  {result.thumbnail && (
                    <div className="mr-3 flex-shrink-0">
                      <img 
                        src={result.thumbnail} 
                        alt={result.title} 
                        className="w-20 h-14 object-cover rounded-md shadow-sm"
                      />
                      {result.duration && (
                        <div className="mt-1 text-xs text-center text-pink-dark/70">
                          {result.duration}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1 overflow-hidden mr-3">
                    <p className="font-medium text-pink-dark mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      {result.title}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleVideoSelect(result)}
                    disabled={addedVideos.includes(result.id)}
                    className={`flex items-center justify-center rounded-full w-12 h-12 text-white transition-all ${
                      addedVideos.includes(result.id)
                        ? 'bg-green-500 cursor-default'
                        : 'bg-gradient-to-r from-pink-500 to-pink-dark hover:shadow-md hover:scale-105 cursor-pointer'
                    }`}
                  >
                    {addedVideos.includes(result.id) ? '✓' : <FaPlus />}
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-pink-light/10 rounded-lg p-6 text-center text-pink-dark/70">
              <p>Search for songs to play</p>
              <p className="text-sm mt-2">
                You can search by song title, artist name, or both
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SearchModal; 