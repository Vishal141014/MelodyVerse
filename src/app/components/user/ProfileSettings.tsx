"use client";
import React, { useState, useEffect } from "react";
import { FaUser, FaCheck, FaTimes } from "react-icons/fa";
import { useStore } from "@/app/store";
import { motion } from "framer-motion";

interface ProfileSettingsProps {
  onClose: () => void;
}

// Color picker options
const COLOR_OPTIONS = [
  '#ffb6c1', // light pink
  '#ff69b4', // hot pink
  '#c71585', // medium violet red
  '#db7093', // pale violet red
  '#f08080', // light coral
  '#e6e6fa', // lavender
];

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const { username, setUsername } = useStore();
  
  const [editUsername, setEditUsername] = useState(username || '');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  
  // Load saved color on mount
  useEffect(() => {
    // Load username from localStorage if available
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setEditUsername(savedUsername);
    }
    
    // Load color from localStorage if available
    const savedColor = localStorage.getItem('avatarColor');
    if (savedColor && COLOR_OPTIONS.includes(savedColor)) {
      setSelectedColor(savedColor);
    }
  }, []);
  
  // Handle save settings
  const handleSave = () => {
    if (editUsername.trim()) {
      setUsername(editUsername);
      localStorage.setItem('username', editUsername);
      localStorage.setItem('avatarColor', selectedColor);
      onClose();
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      backgroundColor: 'rgba(194, 24, 91, 0.2)',
      backdropFilter: 'blur(4px)',
      padding: '1rem'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.4 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '28rem',
          width: '100%',
          boxShadow: '0 4px 10px rgba(194, 24, 91, 0.15)',
          border: '1px solid rgba(255, 183, 202, 0.3)'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#C2185B'
          }}>Profile Settings</h2>
          <button 
            onClick={onClose} 
            style={{
              color: 'rgba(194, 24, 91, 0.6)',
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0.625rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#C2185B';
              e.currentTarget.style.backgroundColor = 'rgba(255, 209, 220, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'rgba(194, 24, 91, 0.6)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            disabled={!username}
            aria-label="Close profile settings"
          >
            <FaTimes />
          </button>
        </div>
        
        <div style={{
          marginBottom: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div 
            style={{
              width: '6rem',
              height: '6rem',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
              color: 'white',
              fontSize: '1.5rem',
              backgroundColor: selectedColor,
              boxShadow: '0 2px 5px rgba(194, 24, 91, 0.1)'
            }}
          >
            <FaUser />
          </div>
          <p style={{
            color: 'rgba(194, 24, 91, 0.7)',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>Choose your avatar color</p>
        </div>
        
        <div style={{
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem'
        }}>
          {COLOR_OPTIONS.map(color => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '9999px',
                backgroundColor: color,
                border: selectedColor === color ? '2px solid #C2185B' : 'none',
                transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                boxShadow: selectedColor === color ? '0 0 0 2px white' : 'none'
              }}
              aria-label={`Select ${color} as avatar color`}
            />
          ))}
        </div>
        
        <div style={{
          marginBottom: '1.75rem'
        }}>
          <label 
            htmlFor="username" 
            style={{
              display: 'block',
              color: '#C2185B',
              marginBottom: '0.625rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            placeholder="Enter your username"
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: 'white',
              border: '1px solid rgba(255, 183, 202, 0.3)',
              borderRadius: '0.5rem',
              color: '#C2185B',
              boxShadow: '0 2px 5px rgba(194, 24, 91, 0.1)',
              transition: 'all 0.2s'
            }}
            autoFocus
          />
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleSave}
            disabled={!editUsername.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#C2185B',
              background: 'linear-gradient(to right, #EC407A, #C2185B)',
              color: 'white',
              borderRadius: '0.5rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              border: 'none',
              cursor: editUsername.trim() ? 'pointer' : 'not-allowed',
              opacity: editUsername.trim() ? 1 : 0.5,
              boxShadow: '0 2px 5px rgba(194, 24, 91, 0.1)'
            }}
            onMouseOver={(e) => {
              if (editUsername.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(194, 24, 91, 0.15)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(194, 24, 91, 0.1)';
            }}
          >
            <FaCheck /> Save Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSettings; 