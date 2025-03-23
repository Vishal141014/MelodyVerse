"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPaperPlane, FaSmile, FaImage, FaGift, FaTimes } from "react-icons/fa";

// Emoji picker data - simplified for the example
const EMOJI_GROUPS = [
  { name: "Smileys", emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇"] },
  { name: "Love", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "❣️", "💕"] },
  { name: "Gestures", emojis: ["👍", "👎", "👌", "✌️", "🤞", "👋", "🤙", "👏", "🙌", "🤝"] },
  { name: "Faces", emojis: ["😍", "🥰", "😘", "😚", "😋", "😛", "😝", "😜", "🤪", "🤔"] },
];

// Mock GIF data - in a real app, use a GIF API like Giphy or Tenor
const MOCK_GIFS = [
  { id: "gif1", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExanFiZm9uMmN6MHRwc2hic2kwY3NscG9ncmdlNjlubWhvejVlZnA5aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Ju7l5y9osyymQ/giphy.gif" },
  { id: "gif2", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNnN1ZWk0NnRvcTF4eGVwMDVwazc0ZTV3YTl5NzgxMnhxenc1eGl5OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BlVnrxJgTGsUw/giphy.gif" },
  { id: "gif3", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExanEzdmllc2xwN2ZxdmEybWptOGcwdXc4MnZjaWsyb3ZjdWpnYWpqaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/S9i8jJxTvG8dd8NEwB/giphy.gif" },
  { id: "gif4", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGJoam96bHhkbHNrYzFtdmszdWNjY3J2OHlvOGkzaWtqNmM2MWc5aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7aCYDNm1kXgSUgXm/giphy.gif" },
];

// Sticker data - simplified for the example
const MOCK_STICKERS = [
  { id: "sticker1", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2M1ZGphY2ttN281NGh3dnJqZm13cGxqZnVpNml6ZzVjemJ2ZGozeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKGMnzuCXANSf1m/giphy.gif" },
  { id: "sticker2", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGIyYTg3aGQxOWdvcWN2czFtMGg2d2ptOHJ2MjF2dnYzdjV5eTQ0NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8FVh4teNYuyOdfeqVC/giphy.gif" },
  { id: "sticker3", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGRoaTZ1M3gzYzR0ejl0MTdlYXI3OGY0ZjNhNTAxcWk3cDR4aGp5NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4FGn9OV8UXq22vSw/giphy.gif" },
  { id: "sticker4", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2tuNmFheHUxNDN6YnMwNnd0M3c4a245dmN0bjg5amRsc3Jwc2FhciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPop32DDWnzYQlG/giphy.gif" },
];

interface MessageInputProps {
  onSendMessage: (message: string, type?: string, content?: string | null) => void;
  onTyping: (isTyping: boolean) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Emit typing event
    onTyping(true);
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator after 2 seconds
    const timeout = setTimeout(() => {
      onTyping(false);
    }, 2000);
    
    setTypingTimeout(timeout);
  };
  
  // Handle send message
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      
      // Stop typing indicator
      onTyping(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Focus the input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    
    // Focus the input after adding emoji
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle GIF selection
  const handleGifSelect = (gifUrl: string) => {
    onSendMessage("", "gif", gifUrl);
    setShowGifPicker(false);
  };
  
  // Handle sticker selection
  const handleStickerSelect = (stickerUrl: string) => {
    onSendMessage("", "sticker", stickerUrl);
    setShowStickerPicker(false);
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        showEmojiPicker || 
        showGifPicker || 
        showStickerPicker
      ) {
        if (!target.closest('.picker-container')) {
          setShowEmojiPicker(false);
          setShowGifPicker(false);
          setShowStickerPicker(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showGifPicker, showStickerPicker]);
  
  return (
    <div className="border-t border-white/10 p-3">
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/5"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowGifPicker(false);
              setShowStickerPicker(false);
            }}
          >
            <FaSmile />
          </motion.button>
          
          <motion.button
            type="button"
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/5"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
              setShowStickerPicker(false);
            }}
          >
            <FaImage />
          </motion.button>
          
          <motion.button
            type="button"
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/5"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowStickerPicker(!showStickerPicker);
              setShowEmojiPicker(false);
              setShowGifPicker(false);
            }}
          >
            <FaGift />
          </motion.button>
        </div>
        
        <input
          type="text"
          ref={inputRef}
          className="flex-grow p-2 bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:border-primary/50"
          placeholder="Type a message..."
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        
        <motion.button
          type="submit"
          className="p-2 text-white bg-primary rounded-full hover:bg-primary-dark"
          whileTap={{ scale: 0.9 }}
          disabled={!message.trim()}
        >
          <FaPaperPlane />
        </motion.button>
      </form>
      
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <motion.div 
          className="picker-container absolute bottom-20 left-4 w-64 max-h-64 glassmorphism rounded-lg p-2 overflow-hidden z-50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Emojis</h4>
            <button 
              className="text-white/70 hover:text-white" 
              onClick={() => setShowEmojiPicker(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="max-h-52 overflow-y-auto pr-1">
            {EMOJI_GROUPS.map((group, idx) => (
              <div key={idx} className="mb-3">
                <h5 className="text-xs text-white/50 mb-1">{group.name}</h5>
                <div className="grid grid-cols-8 gap-1">
                  {group.emojis.map((emoji, i) => (
                    <button
                      key={i}
                      className="w-7 h-7 text-lg flex items-center justify-center hover:bg-white/10 rounded-md"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* GIF Picker */}
      {showGifPicker && (
        <motion.div 
          className="picker-container absolute bottom-20 left-4 w-72 glassmorphism rounded-lg p-2 overflow-hidden z-50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">GIFs</h4>
            <button 
              className="text-white/70 hover:text-white" 
              onClick={() => setShowGifPicker(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {MOCK_GIFS.map((gif) => (
              <button
                key={gif.id}
                className="overflow-hidden rounded-md hover:opacity-90 transition-opacity"
                onClick={() => handleGifSelect(gif.url)}
              >
                <img 
                  src={gif.url} 
                  alt="GIF" 
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          
          <div className="mt-2 text-xs text-white/50 text-center">
            Powered by GIPHY
          </div>
        </motion.div>
      )}
      
      {/* Sticker Picker */}
      {showStickerPicker && (
        <motion.div 
          className="picker-container absolute bottom-20 left-4 w-72 glassmorphism rounded-lg p-2 overflow-hidden z-50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Stickers</h4>
            <button 
              className="text-white/70 hover:text-white" 
              onClick={() => setShowStickerPicker(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {MOCK_STICKERS.map((sticker) => (
              <button
                key={sticker.id}
                className="overflow-hidden rounded-md hover:opacity-90 transition-opacity bg-white/5 p-1"
                onClick={() => handleStickerSelect(sticker.url)}
              >
                <img 
                  src={sticker.url} 
                  alt="Sticker" 
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MessageInput; 