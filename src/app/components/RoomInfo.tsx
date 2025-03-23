"use client";
import React, { useState } from 'react';
import { FaCopy, FaCheck, FaUserAlt, FaCrown } from 'react-icons/fa';
import { Socket } from 'socket.io-client';
import { useStore } from '../store';

interface RoomInfoProps {
  roomId: string;
  isHost: boolean;
  socket: Socket | null;
}

const RoomInfo: React.FC<RoomInfoProps> = ({ roomId, isHost, socket }) => {
  const [copied, setCopied] = useState(false);
  const { username } = useStore();

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 700,
          background: 'linear-gradient(90deg, rgb(133, 76, 230) 0%, rgb(76, 153, 230) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 10px rgba(133, 76, 230, 0.3)'
        }}>
          MelodyVerse
        </h1>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: 'rgba(133, 76, 230, 0.1)',
            border: '1px solid rgba(133, 76, 230, 0.2)',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            <FaUserAlt size={12} style={{ color: 'rgba(133, 76, 230, 0.9)' }} />
            <span>
              {username || 'Anonymous'}
              {isHost && (
                <span style={{
                  marginLeft: '0.25rem',
                  color: 'rgb(230, 76, 153)'
                }}>
                  <FaCrown size={11} style={{ display: 'inline', marginRight: '0.15rem' }} />
                  Host
                </span>
              )}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.9)',
          cursor: 'pointer'
        }}
        onClick={copyRoomId}
        >
          <span>Room ID: {roomId}</span>
          {copied ? (
            <FaCheck size={14} style={{ color: 'rgb(76, 230, 153)' }} />
          ) : (
            <FaCopy size={14} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomInfo; 