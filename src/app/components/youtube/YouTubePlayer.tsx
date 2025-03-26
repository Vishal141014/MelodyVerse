"use client";
import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { FaPlay, FaPause, FaSync, FaVolumeMute, FaVolumeUp, FaMusic } from 'react-icons/fa';
import PlayerControls from './PlayerControls';
import Playlist from '../Playlist';

// Let TypeScript know we're going to reference the YT object from the YouTube API
// This is now defined in src/types/youtube.d.ts so we can remove the declaration here
// declare global {
//   interface Window {
//     YT: {
//       Player: any;
//       PlayerState: {
//         PLAYING: number;
//         PAUSED: number;
//         ENDED: number;
//         BUFFERING: number;
//         CUED: number;
//       };
//     };
//     onYouTubeIframeAPIReady: () => void;
//   }
// }

interface YouTubePlayerProps {
  socket: Socket | null;
  roomId: string;
  currentVideoId: string | null;
  isHost: boolean;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  onVideoSelect?: (videoId: string, videoTitle: string) => void;
}

// Hidden YouTube player for audio only
let youtubePlayer: YT.Player | null = null;

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  socket, 
  roomId,
  currentVideoId,
  isHost,
  isPlaying,
  setIsPlaying,
  onVideoSelect 
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('No track selected');
  const [currentThumbnail, setCurrentThumbnail] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Load the YouTube API - create a hidden player for audio only
  useEffect(() => {
    console.log("INITIALIZING: YouTube player component mounted");
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Not in browser environment, skipping YouTube API initialization");
      return;
    }
    
    // Function to create and initialize the YouTube player
    const createYouTubePlayer = () => {
      // Load YouTube API if not already loaded
      if (!window.YT) {
        console.log("Loading YouTube API script");
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        if (document.getElementsByTagName('script')[0] && document.getElementsByTagName('script')[0].parentNode) {
          document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, document.getElementsByTagName('script')[0]);
        } else {
          document.head.appendChild(tag);
        }
        
        // Define callback that YouTube will call when API is ready
        window.onYouTubeIframeAPIReady = () => {
          console.log("YouTube API ready callback fired");
          initializePlayer();
        };
      } else {
        console.log("YouTube API already loaded, initializing player directly");
        initializePlayer();
      }
    };
    
    // Start the initialization process
    createYouTubePlayer();
    
    // Set up a safety check to confirm player is initialized after a delay
    const safetyTimeout = setTimeout(() => {
      if (!youtubePlayer) {
        console.log("Player initialization timeout reached, retrying...");
        createYouTubePlayer();
      }
    }, 5000);
    
    // Clean up on unmount
    return () => {
      clearTimeout(safetyTimeout);
      console.log("Cleaning up YouTube player component");
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      
      if (youtubePlayer) {
        console.log("Destroying YouTube player instance");
        try {
          youtubePlayer.destroy();
        } catch (error) {
          console.error("Error destroying player:", error);
        }
        youtubePlayer = null;
      }
    };
  }, []); // Empty dependency array to ensure this only runs once on mount
  
  // Initialize or update the YouTube player (hidden, audio only)
  const initializePlayer = () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.log("Not in browser environment, skipping YouTube player initialization");
        return;
      }

      console.log("Attempting to initialize hidden YouTube player");
      
      // Only initialize if YouTube API is available
      if (!window.YT || !window.YT.Player) {
        console.log("YouTube API not ready yet, waiting...");
        
        // Load the API if not already loading
        if (!document.getElementById('youtube-iframe-api')) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
          
          // Define callback for when API is ready
          window.onYouTubeIframeAPIReady = () => {
            console.log("YouTube API loaded via callback");
            setTimeout(initializePlayer, 500); // Give it a moment before continuing
          };
        }
        
        setTimeout(initializePlayer, 1000);
        return;
      }
      
      // Create hidden container for YouTube player if it doesn't exist
      let hiddenPlayerContainer = document.getElementById('hidden-youtube-player');
      
      if (!hiddenPlayerContainer) {
        hiddenPlayerContainer = document.createElement('div');
        hiddenPlayerContainer.id = 'hidden-youtube-player';
        // Make container truly hidden - no debugging view
        hiddenPlayerContainer.style.position = 'fixed';
        hiddenPlayerContainer.style.bottom = '0';
        hiddenPlayerContainer.style.right = '0';
        hiddenPlayerContainer.style.width = '1px';
        hiddenPlayerContainer.style.height = '1px';
        hiddenPlayerContainer.style.opacity = '0.01';
        hiddenPlayerContainer.style.visibility = 'hidden';
        hiddenPlayerContainer.style.pointerEvents = 'none';
        document.body.appendChild(hiddenPlayerContainer);
        console.log('Created hidden player container');
      }
      
      // If player already exists, destroy it first
      if (youtubePlayer) {
        console.log("Destroying existing player");
        try {
          youtubePlayer.destroy();
        } catch (e) {
          console.error("Error destroying player:", e);
        }
        youtubePlayer = null;
      }
      
      console.log("Creating truly hidden YouTube player with ID:", currentVideoId || '');
      
      // Create new player - completely hidden
      youtubePlayer = new window.YT.Player('hidden-youtube-player', {
        height: '1',
        width: '1',
        videoId: currentVideoId || '',
        playerVars: {
          autoplay: 0, // Start paused to avoid errors
          controls: 0, // No controls needed
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
          disablekb: 1
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
      
      console.log("Hidden YouTube player initialization requested");
      
      // Set a timeout to verify player was created successfully
      setTimeout(() => {
        if (youtubePlayer && typeof youtubePlayer.getPlayerState === 'function') {
          try {
            const state = youtubePlayer.getPlayerState();
            console.log("Player successfully verified, state:", state);
          } catch (e) {
            console.error("Player verification failed, recreating:", e);
            youtubePlayer = null;
            initializePlayer(); // Try again
          }
        }
      }, 3000);
      
    } catch (error) {
      console.error("Error initializing player:", error);
      setErrorMessage("Failed to initialize player: " + (error.message || error));
      setTimeout(() => setErrorMessage(null), 3000);
      
      // Try again after a short delay
      setTimeout(initializePlayer, 2000);
    }
  };
  
  const onPlayerReady = (event: YT.PlayerEvent) => {
    setPlayerReady(true);
    console.log("Player ready");
    
    // Start playing if needed and seek to correct position if there's a current video
    if (isPlaying && youtubePlayer) {
      youtubePlayer.playVideo();
      
      // If joining a room with a video already playing, request current timestamp
      if (socket && currentVideoId) {
        socket.emit('video:requestTimestamp', { roomId });
      }
    }
    
    // Begin tracking progress
    startProgressTracking();
    
    // Get video details
    if (youtubePlayer) {
      try {
        setCurrentVideoTitle(youtubePlayer.getVideoData().title || 'Unknown Track');
        setDuration(youtubePlayer.getDuration() || 0);
      } catch (e) {
        console.error("Error getting video data:", e);
      }
    }
  };
  
  const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
    if (event.data === YT.PlayerState.PLAYING) {
      if (!isPlaying) setIsPlaying(true);
      startProgressTracking();
    } else if (event.data === YT.PlayerState.PAUSED) {
      if (isPlaying) setIsPlaying(false);
      stopProgressTracking();
    } else if (event.data === YT.PlayerState.ENDED) {
      setIsPlaying(false);
      stopProgressTracking();
      // Go to next track or handle end of video
      handleVideoEnded();
    }
  };
  
  const onPlayerError = (event: YT.OnErrorEvent) => {
    console.error("Player error:", event.data);
    setErrorMessage(`YouTube error: ${event.data}`);
  };
  
  // Start tracking progress for UI updates and time synchronization
  const startProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    progressInterval.current = setInterval(() => {
      if (youtubePlayer && youtubePlayer.getCurrentTime && youtubePlayer.getDuration) {
        try {
          const current = youtubePlayer.getCurrentTime() || 0;
          const total = youtubePlayer.getDuration() || 1;
          setCurrentTime(current);
          setDuration(total);
          setProgress((current / total) * 100);
          
          // Send time updates more frequently for better sync
          if (socket && roomId && current > 0) {
            // Every user sends time updates to help with sync
            socket.emit('video:updateTime', { 
              roomId, 
              currentTime: current,
              videoId: currentVideoId
            });
          }
        } catch (e) {
          console.error("Error updating progress:", e);
        }
      }
    }, 1000); // Update every second
  };
  
  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };
  
  // Handle video ended
  const handleVideoEnded = () => {
    // This function can be implemented to play the next track in the playlist
    // For now, just reset progress
    setProgress(0);
    setCurrentTime(0);
    
    // Notify other users
    if (socket && isHost) {
      socket.emit('video:ended', { roomId });
    }
  };
  
  // Format time (seconds) to MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Play a video
  const playVideo = (videoId: string, videoTitle: string) => {
    console.log(`Playing video: ${videoId} - ${videoTitle}`);
    
    // Update state immediately for UI responsiveness
    setCurrentVideoTitle(videoTitle || 'Unknown Track');
    setCurrentThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setErrorMessage(null);
    setIsPlaying(true);
    
    // Emit play event to server FIRST - this ensures other clients get notified quickly
    if (socket) {
      console.log(`Emitting video:play event for ${videoId}`);
      socket.emit('video:play', {
        roomId,
        videoId,
        title: videoTitle
      });
    }
    
    // Now handle the local player
    if (youtubePlayer) {
      try {
        // Load the video
        console.log(`Loading video in player: ${videoId}`);
        youtubePlayer.loadVideoById({
          videoId: videoId,
          startSeconds: 0
        });
        
        // Start tracking progress
        startProgressTracking();
        
        console.log(`Video ${videoId} loaded successfully`);
      } catch (error) {
        console.error("Error playing video:", error);
        
        // Try to reinitialize and play
        setTimeout(() => {
          initializePlayer();
          setTimeout(() => {
            if (youtubePlayer) {
              try {
                youtubePlayer.loadVideoById(videoId);
              } catch (e) {
                console.error("Recovery failed:", e);
              }
            }
          }, 1000);
        }, 500);
      }
    } else {
      console.warn("YouTube player not initialized, initializing now");
      
      // Initialize player with the video ready to play
      initializePlayer();
      
      // Set a timeout to check and play the video after initialization
      setTimeout(() => {
        if (youtubePlayer) {
          try {
            console.log(`Loading video after init: ${videoId}`);
            youtubePlayer.loadVideoById(videoId);
          } catch (e) {
            console.error("Error loading video after init:", e);
          }
        } else {
          console.error("Player still not available after initialization");
        }
      }, 2000);
    }
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (!currentVideoId) {
      console.log("Can't toggle play/pause: No video selected");
      setErrorMessage("No song selected");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    console.log(`Attempting to toggle play/pause from ${isPlaying ? 'playing to paused' : 'paused to playing'}`);
    
    // First update UI state for immediate feedback
    setIsPlaying(!isPlaying);
    
    // Emit socket events to sync all users regardless of host status
    if (socket) {
      if (isPlaying) {
        console.log(`Emitting pause event to room ${roomId}`);
        socket.emit('video:pause', { roomId });
      } else {
        console.log(`Emitting resume event to room ${roomId}`);
        socket.emit('video:resume', { roomId });
      }
    } else {
      console.warn("Socket not available, can't sync with other users");
      setErrorMessage("Network connection issue - refresh page");
      setTimeout(() => setErrorMessage(null), 3000);
    }
    
    // Try to control local player if available
    if (youtubePlayer) {
      try {
        // Verify player is ready before trying to control it
        const playerState = youtubePlayer.getPlayerState();
        console.log("Current player state before toggle:", playerState);
        
        if (isPlaying) {
          youtubePlayer.pauseVideo();
          stopProgressTracking();
        } else {
          youtubePlayer.playVideo();
          startProgressTracking();
        }
      } catch (error) {
        console.error("Error controlling YouTube player:", error);
        
        // Try to recover by reinitializing
        console.log("Attempting to recover player by reinitializing");
        initializePlayer();
        
        // Try again after player initialization
        setTimeout(() => {
          if (youtubePlayer) {
            try {
              console.log("Retrying playback control after reinitialization");
              if (isPlaying) {
                youtubePlayer.pauseVideo();
              } else {
                youtubePlayer.playVideo();
                startProgressTracking();
              }
            } catch (retryError) {
              console.error("Retry failed:", retryError);
              setErrorMessage("Player control failed - try refreshing");
              setTimeout(() => setErrorMessage(null), 3000);
            }
          }
        }, 2000);
      }
    } else {
      console.log("YouTube player not initialized yet, initializing now");
      initializePlayer();
      
      // Queue up the play/pause action for after initialization
      setTimeout(() => {
        if (youtubePlayer) {
          try {
            console.log("Player initialized, applying queued playback state");
            if (!isPlaying) { // Remember we already toggled the state
              youtubePlayer.playVideo();
              startProgressTracking();
            } else {
              youtubePlayer.pauseVideo();
              stopProgressTracking();
            }
          } catch (e) {
            console.error("Failed to apply playback state after init:", e);
          }
        }
      }, 2000);
    }
  };
  
  // Update player when currentVideoId changes
  useEffect(() => {
    if (currentVideoId) {
      // Set thumbnail (movie poster)
      setCurrentThumbnail(`https://img.youtube.com/vi/${currentVideoId}/maxresdefault.jpg`);
      
      // If player exists, load the video
      if (youtubePlayer) {
        try {
          if (isPlaying) {
            youtubePlayer.loadVideoById(currentVideoId);
          } else {
            youtubePlayer.cueVideoById(currentVideoId);
          }
        } catch (error) {
          console.error("Error loading video:", error);
        }
      } else {
        // Initialize player
        initializePlayer();
      }
    }
  }, [currentVideoId]);
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim() || !socket) {
      return;
    }
    
    console.log("Searching for:", searchQuery);
    setIsSearching(true);
    setSearchResults([]);
    setErrorMessage(null);
    
    // Send search request to server
    socket.emit('video:search', { query: searchQuery });
  };
  
  // Handle selecting a video from search results
  const handleSelectVideo = (videoId: string, videoTitle: string) => {
    console.log(`Selecting video: ${videoId} - ${videoTitle}`);
    
    // Clear search results
    setSearchResults([]);
    setSearchQuery('');
    
    // Play the video
    playVideo(videoId, videoTitle);
    
    // Call parent handler if provided
    if (onVideoSelect) {
      console.log('Calling parent onVideoSelect handler');
      onVideoSelect(videoId, videoTitle);
    } else {
      console.error('No onVideoSelect handler provided');
    }
  };
  
  // Listen for search results from socket
  useEffect(() => {
    if (!socket) return;
    
    const handleSearchResults = (data: { results: any[], error?: string }) => {
      setIsSearching(false);
      
      if (data.error) {
        console.error("Search error:", data.error);
        setErrorMessage(data.error);
        return;
      }
      
      setSearchResults(data.results || []);
      console.log("Received search results:", data.results);
    };
    
    socket.on('video:searchResults', handleSearchResults);
    
    return () => {
      socket.off('video:searchResults', handleSearchResults);
    };
  }, [socket]);
  
  // Handle clicking on progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHost || !youtubePlayer || !currentVideoId) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const seekTime = duration * percentage;
    
    try {
      youtubePlayer.seekTo(seekTime, true);
      setCurrentTime(seekTime);
      setProgress(percentage * 100);
      
      // Emit seek event to socket
    if (socket) {
      socket.emit('seek-video', { roomId, seekTime });
      }
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };
  
  // Listen for socket events for playback control and sync
  useEffect(() => {
    if (!socket) return;
    
    console.log("Setting up socket event listeners for video playback");
    
    // Handle play event (when host plays a video)
    const handlePlay = (data: { videoId: string, title: string }) => {
      console.log(`PLAY EVENT: Received play event for video: ${data.videoId} - ${data.title}`);
      
      // Update local state immediately
      setIsPlaying(true);
      
      // Set current video title and thumbnail
      setCurrentVideoTitle(data.title || 'Unknown Track');
      setCurrentThumbnail(`https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg`);
      
      // Force load the video for all users, not just dependent on the host
      if (!youtubePlayer) {
        initializePlayer();
        
        // Add a delay to ensure player is initialized
        const loadDelay = setTimeout(() => {
          if (youtubePlayer) {
            try {
              console.log(`Delayed loading of video ${data.videoId}`);
              youtubePlayer.loadVideoById(data.videoId);
              startProgressTracking();
            } catch (error) {
              console.error("Error in delayed loading:", error);
            }
          } else {
            console.error("Player still not initialized after delay");
          }
        }, 2000);
        
        return () => clearTimeout(loadDelay);
      }
      
      // If we have the player, load the video directly
      try {
        console.log(`Loading video ${data.videoId} directly`);
        youtubePlayer.loadVideoById(data.videoId);
        startProgressTracking();
      } catch (error) {
        console.error("Error playing received video:", error);
        // Re-try after a delay
        setTimeout(() => {
          try {
            youtubePlayer?.loadVideoById(data.videoId);
          } catch (e) {
            console.error("Retry failed:", e);
          }
        }, 1000);
      }
    };
    
    // Handle pause event
    const handlePause = () => {
      console.log('PAUSE EVENT: Received pause event');
      
      // Update local state immediately for UI feedback
      setIsPlaying(false);
      
      // Pause the YouTube player if available
      if (youtubePlayer) {
        try {
          console.log("Pausing YouTube player");
          youtubePlayer.pauseVideo();
          stopProgressTracking();
        } catch (error) {
          console.error("Error pausing video:", error);
        }
      } else {
        console.warn("Cannot pause: YouTube player not initialized");
      }
    };
    
    // Handle resume event
    const handleResume = () => {
      console.log('RESUME EVENT: Received resume event');
      
      // Update local state immediately for UI feedback
      setIsPlaying(true);
      
      // Resume the YouTube player if available
      if (youtubePlayer) {
        try {
          console.log("Resuming YouTube player");
          youtubePlayer.playVideo();
          startProgressTracking();
        } catch (error) {
          console.error("Error resuming video:", error);
          
          // Try again after a short delay
          setTimeout(() => {
            try {
              youtubePlayer?.playVideo();
            } catch (e) {
              console.error("Retry failed:", e);
            }
          }, 1000);
        }
      } else {
        console.warn("Cannot resume: YouTube player not initialized");
        // Try to initialize the player
        initializePlayer();
      }
    };
    
    // Handle seeking
    const handleSeek = (data: { seekTime: number }) => {
      console.log(`SEEK EVENT: Received seek event to ${data.seekTime}s`);
      
      if (youtubePlayer) {
        try {
          youtubePlayer.seekTo(data.seekTime, true);
          setCurrentTime(data.seekTime);
          setProgress((data.seekTime / duration) * 100);
        } catch (error) {
          console.error("Error seeking from socket event:", error);
        }
      }
    };
    
    // Handle timestamp request (for late joiners)
    const handleTimestampRequest = () => {
      console.log("TIMESTAMP REQUEST: Received request for current timestamp");
      
      if (isHost && youtubePlayer && currentVideoId) {
        try {
          const currentTime = youtubePlayer.getCurrentTime();
          console.log(`Sending timestamp: ${currentTime}s for video ${currentVideoId}`);
          socket.emit('video:timestamp', { 
            roomId, 
            videoId: currentVideoId, 
            time: currentTime,
            isPlaying
          });
        } catch (error) {
          console.error("Error sending timestamp:", error);
        }
      } else {
        console.log(`Not sending timestamp: isHost=${isHost}, player=${!!youtubePlayer}, videoId=${currentVideoId}`);
      }
    };
    
    // Handle timestamp response
    const handleTimestamp = (data: { videoId: string, time: number, isPlaying: boolean }) => {
      console.log(`TIMESTAMP RESPONSE: Received timestamp: ${data.time}s for video ${data.videoId}, isPlaying: ${data.isPlaying}`);
      
      // Validate incoming timestamp data
      if (!data.videoId) {
        console.error("Invalid timestamp received: missing videoId");
        setErrorMessage("Invalid sync data received");
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
      
      // If we don't have a player yet, initialize it
      if (!youtubePlayer) {
        console.log("Player not ready for timestamp sync, initializing and retrying...");
        
        initializePlayer();
        
        // Set a delay to apply the timestamp after the player is ready
        setTimeout(() => {
          if (youtubePlayer) {
            console.log("Player initialized, applying delayed timestamp sync");
            applyTimestampSync(data);
          } else {
            console.error("Failed to initialize player for timestamp sync");
            // Try one more time after a longer delay
            setTimeout(() => {
              if (youtubePlayer) {
                console.log("Player finally initialized, applying timestamp sync");
                applyTimestampSync(data);
              } else {
                console.error("Could not initialize player after multiple attempts");
                setErrorMessage("Failed to sync: Player initialization failed");
                setTimeout(() => setErrorMessage(null), 3000);
              }
            }, 5000);
          }
        }, 2000);
        return;
      }
      
      // If we do have a player, apply the sync immediately
      applyTimestampSync(data);
    };
    
    // Helper function to apply timestamp sync - now more robust
    const applyTimestampSync = (data: { videoId: string, time: number, isPlaying: boolean }) => {
      try {
        if (!youtubePlayer) {
          console.error("Cannot apply timestamp: player not initialized");
          return;
        }
        
        // Validate YouTube video ID format (should be 11 characters)
        if (!data.videoId || data.videoId.length !== 11) {
          console.error(`Invalid YouTube video ID: ${data.videoId}`);
          setErrorMessage("Invalid video ID received during sync");
          setTimeout(() => setErrorMessage(null), 3000);
          return;
        }
        
        console.log(`Applying timestamp: ${data.time}s, isPlaying: ${data.isPlaying}, videoId: ${data.videoId}`);
        
        // First update shared state variables
        setCurrentTime(data.time);
        setIsPlaying(data.isPlaying);
        
        // Check if we need to load a different video
        const needsNewVideo = currentVideoId !== data.videoId;
        
        if (needsNewVideo) {
          console.log(`Loading different video from sync: ${data.videoId} (current: ${currentVideoId || 'none'})`);
          
          // Update state first
          setCurrentVideoId(data.videoId);
          setCurrentThumbnail(`https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg`);
          setCurrentVideoTitle('Loading...');
          
          // Verify the player state before loading video
          if (youtubePlayer.getPlayerState) {
            try {
              // Check if player is actually ready
              const playerState = youtubePlayer.getPlayerState();
              console.log(`Current player state: ${playerState}`);
              
              // Load the new video with the correct timestamp
              youtubePlayer.loadVideoById({
                videoId: data.videoId,
                startSeconds: Math.max(0, data.time) // Ensure time is not negative
              });
              
              // After video loads, try to get its title
              setTimeout(() => {
                if (youtubePlayer) {
                  try {
                    const title = youtubePlayer.getVideoData().title;
                    if (title) setCurrentVideoTitle(title);
                  } catch (e) {
                    console.error("Could not get video title:", e);
                  }
                }
              }, 1000);
            } catch (playerError) {
              console.error("Player not in ready state for loadVideoById:", playerError);
              
              // Recreate the player
              initializePlayer();
              
              // Set a timeout to try loading the video after reinitialization
              setTimeout(() => {
                if (youtubePlayer) {
                  try {
                    youtubePlayer.loadVideoById({
                      videoId: data.videoId,
                      startSeconds: Math.max(0, data.time)
                    });
                  } catch (retryError) {
                    console.error("Failed to load video after player reinit:", retryError);
                    setErrorMessage("Sync failed: Could not load video");
                    setTimeout(() => setErrorMessage(null), 3000);
                  }
                }
              }, 2000);
            }
          }
        } else {
          // Just seek to the right position in the current video
          console.log(`Seeking to ${data.time}s in current video ${data.videoId}`);
          try {
            youtubePlayer.seekTo(Math.max(0, data.time), true);
          } catch (seekError) {
            console.error("Error seeking:", seekError);
          }
        }
        
        // Set playback state
        try {
          if (data.isPlaying) {
            console.log("Setting player to play based on timestamp");
            youtubePlayer.playVideo();
            startProgressTracking();
          } else {
            console.log("Setting player to pause based on timestamp");
            youtubePlayer.pauseVideo();
            stopProgressTracking();
          }
        } catch (playStateError) {
          console.error("Error setting play state:", playStateError);
        }
        
        // Update UI progress
        if (duration > 0) {
          setProgress((Math.max(0, data.time) / duration) * 100);
        } else {
          // If we don't have duration yet, try to get it
          try {
            const newDuration = youtubePlayer.getDuration();
            if (newDuration > 0) {
              setDuration(newDuration);
              setProgress((Math.max(0, data.time) / newDuration) * 100);
            }
          } catch (e) {
            console.error("Could not get duration:", e);
          }
        }
      } catch (error) {
        console.error("Error applying timestamp:", error);
        setErrorMessage("Sync failed: " + (error.message || "Unknown error"));
        setTimeout(() => setErrorMessage(null), 3000);
        
        // Try to recover if possible
        if (error.toString().includes("not ready") || error.toString().includes("undefined")) {
          console.log("Player not ready error, trying to recover...");
          setTimeout(() => {
            initializePlayer();
          }, 1000);
        }
      }
    };
    
    // Handle timestamp request from anyone
    const handleTimestampRequestFromAnyone = ({ requesterId }: { requesterId: string }) => {
      console.log(`Received timestamp request from anyone for user ${requesterId}`);
      
      if (youtubePlayer && currentVideoId) {
        try {
          const currentTime = youtubePlayer.getCurrentTime();
          console.log(`Providing timestamp: ${currentTime}s for video ${currentVideoId}`);
          
          // Set the requesterId in socket data to send it back to the right client
          if (socket) {
            socket.data = { ...socket.data, requesterId };
            
            socket.emit('video:timestamp', { 
              roomId, 
              videoId: currentVideoId, 
              time: currentTime,
              isPlaying
            });
          }
        } catch (error) {
          console.error("Error providing timestamp:", error);
        }
      } else {
        console.log("Cannot provide timestamp: No video playing or player not initialized");
      }
    };
    
    // Set up event listeners
    socket.on('video:play', handlePlay);
    socket.on('video:pause', handlePause);
    socket.on('video:resume', handleResume);
    socket.on('seek-video', handleSeek);
    socket.on('video:requestTimestamp', handleTimestampRequest);
    socket.on('video:requestTimestampFromAnyone', handleTimestampRequestFromAnyone);
    socket.on('video:timestamp', handleTimestamp);
    
    // Clean up event listeners
    return () => {
      socket.off('video:play', handlePlay);
      socket.off('video:pause', handlePause);
      socket.off('video:resume', handleResume);
      socket.off('seek-video', handleSeek);
      socket.off('video:requestTimestamp', handleTimestampRequest);
      socket.off('video:requestTimestampFromAnyone', handleTimestampRequestFromAnyone);
      socket.off('video:timestamp', handleTimestamp);
    };
  }, [socket, duration, currentVideoId, isHost, isPlaying]);

  // Set volume when it changes
  const setPlayerVolume = (volume: number) => {
    if (youtubePlayer) {
      try {
        youtubePlayer.setVolume(volume);
        console.log(`Set player volume to ${volume}`);
      } catch (error) {
        console.error("Error setting volume:", error);
      }
    }
  };
  
  // Force sync with other users
  const forceSync = () => {
    if (!socket || !roomId) return;
    
    console.log("Forcing sync with room");
    
    // Check if there's a video before attempting to sync
    if (!currentVideoId) {
      console.log("Cannot sync: No video selected");
      setErrorMessage("Cannot sync: No video selected");
      // Clear error after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    try {
      // If player isn't initialized, initialize it first
      if (!youtubePlayer) {
        console.log("Player not initialized, initializing before sync");
        initializePlayer();
        
        // Wait a bit for initialization before requesting timestamp
        setTimeout(() => {
          socket.emit('video:requestTimestamp', { roomId });
        }, 1000);
      } else {
        // Player exists, request timestamp directly
        socket.emit('video:requestTimestamp', { roomId });
      }
    } catch (error) {
      console.error("Error during sync:", error);
      setErrorMessage("Sync failed: " + (error.message || "Unknown error"));
      
      // Clear error after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col w-full bg-white/10 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm border border-pink-medium/20">
        {/* Search bar - always enabled */}
        <div className="p-4 bg-gradient-to-r from-pink-500/10 to-pink-dark/10 border-b border-pink-medium/20">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                console.log("Input changed:", e.target.value);
                setSearchQuery(e.target.value);
              }}
              placeholder="Search for music..."
              className="flex-1 rounded-full px-4 py-2 border border-pink-medium/30"
            />
            <button
              type="submit"
              className="rounded-full px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-dark text-white"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
        
        {/* Movie poster area (no video) */}
        <div className="relative">
          {/* Movie poster */}
          <div className="aspect-video w-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center overflow-hidden">
            {currentVideoId ? (
              <div className="relative w-full h-full">
                {/* Movie poster image */}
                <img 
                  src={currentThumbnail} 
                  alt={currentVideoTitle}
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient overlay for better contrast with controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Play/Pause overlay button - works for all users now */}
                <motion.button 
                  onClick={togglePlayPause}
                  className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer z-10"
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div 
                    className="w-20 h-20 rounded-full bg-pink-500/80 hover:bg-pink-600/90 text-white flex items-center justify-center shadow-lg"
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: isPlaying ? 0.3 : 0.9, scale: isPlaying ? 0.8 : 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isPlaying ? (
                      <FaPause className="text-3xl" />
                    ) : (
                      <FaPlay className="text-3xl ml-1" />
                    )}
                  </motion.div>
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-pink-dark">
                <div className="w-20 h-20 rounded-full bg-pink-light flex items-center justify-center mb-4">
                  <FaMusic className="text-4xl" />
                </div>
                <p className="text-xl font-medium">No track selected</p>
                <p className="text-sm mt-2">Use the search bar above to find music</p>
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          {currentVideoId && (
            <div className="px-4 py-3 bg-white/70">
          <div 
                className="h-2 bg-pink-light/50 rounded-full cursor-pointer overflow-hidden"
            onClick={handleProgressClick}
                style={{ cursor: 'pointer' }}
              >
                <motion.div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${progress}%`, 
                    background: 'linear-gradient(90deg, rgba(236, 64, 122, 0.8) 0%, rgba(194, 24, 91, 1) 100%)' 
                  }}
                  transition={{ type: 'tween' }}
                ></motion.div>
          </div>
              <div className="flex justify-between mt-1 text-xs text-pink-dark/70">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
            </div>
          )}
        </div>
        
        {/* Video title and controls */}
        <div className="p-4 bg-white/80">
          <h3 className="text-lg font-medium text-pink-dark mb-3 truncate">
            {currentVideoTitle}
          </h3>
          
          <div className="flex justify-between items-center mb-3">
            <PlayerControls
              socket={socket}
              roomId={roomId}
              currentVideoId={currentVideoId}
              isHost={isHost}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              onReinitializePlayer={initializePlayer}
              onForcePlay={(videoId) => {
                if (videoId && youtubePlayer) {
                  youtubePlayer.loadVideoById(videoId);
                  setIsPlaying(true);
                }
              }}
              onVolumeChange={setPlayerVolume}
            />
            
            {/* Sync button for all users */}
              <motion.button
              onClick={forceSync}
              className="px-4 py-2 bg-pink-light/40 hover:bg-pink-light/60 text-pink-dark rounded-full text-sm"
                whileTap={{ scale: 0.95 }}
              title="Sync with room"
              >
              Sync
              </motion.button>
          </div>
        </div>
        
        {/* Search results */}
        {searchResults.length > 0 && (
          <motion.div 
            className="border-t border-pink-medium/20 max-h-64 overflow-y-auto bg-white"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
          >
            <div className="py-2 px-4 bg-pink-light/20 border-b border-pink-medium/20">
              <h4 className="font-medium text-sm text-pink-dark">Search Results</h4>
              </div>
            
            <div className="p-2">
              {searchResults.map((result) => (
                <div 
                  key={result.id}
                  className="flex items-center gap-3 p-2 hover:bg-pink-light/10 rounded cursor-pointer transition-colors"
                  onClick={() => handleSelectVideo(result.id, result.title)}
                >
                  {result.thumbnail && (
                    <img 
                      src={result.thumbnail} 
                      alt={result.title} 
                      className="w-16 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-pink-dark truncate">{result.title}</p>
                    {result.duration && (
                      <p className="text-xs text-pink-dark/60">{result.duration}</p>
                    )}
                  </div>
                    </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Error message if any */}
        {errorMessage && (
          <div className="p-2 bg-red-50 text-red-500 text-sm text-center border-t border-red-200">
            {errorMessage}
          </div>
        )}
      </div>
      
      {/* Playlist component */}
      {socket && (
        <Playlist 
          socket={socket} 
          roomId={roomId} 
          currentVideoId={currentVideoId}
          isHost={isHost}
          onSelectVideo={handleSelectVideo}
        />
      )}
    </div>
  );
};

export default YouTubePlayer; 