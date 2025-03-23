"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '../store';

export default function CreateRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get('username');
  const [isCreating, setIsCreating] = useState(true);
  const { setUsername } = useStore();

  useEffect(() => {
    const createRoom = async () => {
      if (!username) {
        router.push('/');
        return;
      }
      
      try {
        // Set username in store
        setUsername(username);
        
        // Generate a room ID or use the server to create a room
        const adjectives = ['happy', 'sunny', 'cosmic', 'funky', 'jazzy', 'electric', 'mellow', 'vibrant', 'smooth', 'dreamy'];
        const nouns = ['note', 'beat', 'rhythm', 'melody', 'tune', 'harmony', 'groove', 'vibe', 'song', 'sound'];
        
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNum = Math.floor(Math.random() * 1000);
        
        const roomId = `${randomAdjective}-${randomNoun}-${randomNum}`;
        
        // Redirect to the room
        router.push(`/room/${roomId}`);
      } catch (err) {
        console.error('Error creating room:', err);
        router.push('/');
      }
    };
    
    createRoom();
  }, [router, username, setUsername]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'rgb(17, 17, 34)'
    }}>
      <div style={{
        textAlign: 'center',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>Creating your music room...</h1>
        
        <div style={{
          width: '40px',
          height: '40px',
          margin: '0 auto',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTop: '3px solid rgb(133, 76, 230)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
} 