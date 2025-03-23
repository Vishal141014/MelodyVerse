"use client";
import React from "react";
import { motion } from "framer-motion";
import { FaPlay, FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa";

export interface PlaylistItemProps {
  videoId: string;
  title: string;
  isCurrentlyPlaying: boolean;
  isHost: boolean;
  position: number;
  totalItems: number;
  onPlay: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
  videoId,
  title,
  isCurrentlyPlaying,
  isHost,
  position,
  totalItems,
  onPlay,
  onRemove,
  onMoveUp,
  onMoveDown,
}) => {
  // Generate a thumbnail URL from YouTube video ID
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <motion.div
      className={`flex items-center p-2 rounded-md gap-2 ${
        isCurrentlyPlaying
          ? "bg-primary/20 border border-primary/40"
          : "hover:bg-white/5"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      layout
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-12 flex-shrink-0">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover rounded"
        />
        {isCurrentlyPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex-grow truncate text-sm">
        <p className="truncate" title={title}>
          {title}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1">
        <button
          onClick={onPlay}
          className={`p-1.5 rounded-full text-xs ${
            isCurrentlyPlaying
              ? "text-primary"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          aria-label="Play"
          title="Play"
        >
          <FaPlay size={12} />
        </button>

        {isHost && (
          <>
            <button
              onClick={onMoveUp}
              disabled={position === 0}
              className={`p-1.5 rounded-full text-xs ${
                position === 0
                  ? "text-white/30 cursor-not-allowed"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              aria-label="Move up"
              title="Move up"
            >
              <FaArrowUp size={12} />
            </button>

            <button
              onClick={onMoveDown}
              disabled={position === totalItems - 1}
              className={`p-1.5 rounded-full text-xs ${
                position === totalItems - 1
                  ? "text-white/30 cursor-not-allowed"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              aria-label="Move down"
              title="Move down"
            >
              <FaArrowDown size={12} />
            </button>

            <button
              onClick={onRemove}
              className="p-1.5 rounded-full text-white/70 hover:text-red-400 hover:bg-red-400/10 text-xs"
              aria-label="Remove from playlist"
              title="Remove from playlist"
            >
              <FaTrash size={12} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default PlaylistItem; 