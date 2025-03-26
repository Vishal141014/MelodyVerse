# MelodyVerse

MelodyVerse is a real-time music sharing platform where users can join rooms, listen to music together in perfect sync, and chat with each other. 

## Features

- **Real-time Music Synchronization**: Listen to YouTube videos together in perfect sync across all connected users
- **Movie Poster Display**: Displays high-quality movie posters instead of YouTube videos for a more aesthetic experience
- **Live Chat**: Chat with friends while enjoying music with message reactions, emojis, and more
- **User-friendly Room IDs**: Easy to read and share room codes
- **Collaborative Playlists**: Create and manage playlists together with your friends
- **Customizable Profiles**: Personalize your username, avatar color, and theme preference
- **Robust Synchronization**: Play, pause, and seek functionality synced across all users in real-time

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Real-time Communication**: Socket.io
- **Styling**: Tailwind CSS with custom theme
- **Icons**: React Icons
- **Media Player**: YouTube iFrame API (hidden for audio-only experience)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- YouTube API key from Google Cloud Console

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/melodyverse.git
cd melodyverse
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Set up environment variables for local development:
   - Copy `.env.example` to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
   - Edit the `.env` file and add your YouTube API key:
   ```
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

   **IMPORTANT:** Never commit your actual API keys. The `.env` and `.env*.local` files are already in the .gitignore file to prevent accidentally committing your credentials.

### Running the Application Locally

The application consists of both a Next.js frontend and a Socket.io server. You can run both simultaneously with:

```bash
# Run both frontend and backend concurrently
npm run dev
```

Or run them separately:

```bash
# Start the Socket.io server
npm run dev:server

# In a separate terminal, start the Next.js frontend
npm run dev:client
```

The application will be available at:
- Frontend: http://localhost:3000
- Socket.io server: http://localhost:3002

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm run start
# or
yarn start
```

## Deploying to GitHub

When pushing to GitHub, make sure to:

1. **Never include real API keys** in your commits
2. Use environment variables on your deployment platform
3. If you need to test API functionality locally, always use `.env` (which is gitignored)
4. Consider using GitHub Secrets if setting up CI/CD workflows

## Project Structure

```
melodyverse/
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── components/       # React components
│   │   │   ├── chat/         # Chat-related components
│   │   │   ├── user/         # User-related components
│   │   │   └── youtube/      # YouTube player components
│   │   ├── room/[id]/        # Room page
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── store/                # Zustand state management
│   │   ├── userStore.ts      # User state
│   │   └── socketStore.ts    # Socket state
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
├── server.js                 # Socket.io server
└── package.json              # Project dependencies
```

## How It Works

1. **Creating/Joining a Room**: Users can create a new room or join an existing one using a room code
2. **User Profiles**: Upon joining, users can set their username and avatar color
3. **Music Playback**: Any user can control music playback, with all actions synced for all users in real-time
4. **Chat**: Users can send text messages, emojis, GIFs, and stickers in the chat
5. **Playlist Management**: Users can add, remove, and reorder videos in the playlist
6. **Late-Joining Sync**: Users who join a room late will automatically sync to the current playback position

## Troubleshooting

- **Search Not Working**: If you see errors related to YouTube search (ytsr errors), you may need to update the ytsr package or check your YouTube API key
- **Sync Issues**: Click the "Sync" button to manually synchronize with the room state if playback seems out of sync
- **Connection Issues**: If you experience connection issues, try refreshing the page or recreating the room

## Author
- VISHAL ( https://github.com/vishal141014/ )
- NIKITA ( https://github.com/nikita-1414/ )

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
