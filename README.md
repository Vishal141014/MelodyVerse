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

3. Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
```

You'll need to get a YouTube Data API key from the [Google Cloud Console](https://console.cloud.google.com/apis/dashboard) to enable video search functionality.

### Running the Application

To run the application in development mode:

```bash
# Start the Socket.io server first
node server.js

# In a separate terminal, start the Next.js frontend
npx next dev
# or
npm run dev
# or
yarn dev

# Install dotenv if not already installed
npm install dotenv
```

This will start both the Next.js frontend on port 3000 and the Socket.io server on port 3001.

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

## Deploying to Vercel

### Frontend Deployment

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Create an account on [Vercel](https://vercel.com)
3. Click "Add New" → "Project"
4. Import your Git repository
5. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: (leave as default)
   - Environment Variables: Add your YouTube API key as `NEXT_PUBLIC_YOUTUBE_API_KEY`
6. Click "Deploy"

### Server Deployment

Since this application has a separate Socket.IO server (server.js), you need to deploy it separately:

#### Option 1: Deploy to Render.com
1. Create an account on [Render](https://render.com)
2. Click "New" → "Web Service"
3. Connect your repository
4. Configure the service:
   - Name: melodyverse-socket-server
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment Variables: Add your configuration if needed
5. Click "Create Web Service"

#### Option 2: Deploy to Railway
1. Create an account on [Railway](https://railway.app)
2. Create a new project
3. Add your GitHub repository
4. Configure the service:
   - Start Command: `node server.js`
   - Add environment variables if needed
5. Deploy

### Connecting Frontend to Server

After deploying both services, update your frontend environment variables:

1. Go to your Vercel project settings
2. Add `NEXT_PUBLIC_SOCKET_URL` with the URL of your deployed Socket.IO server
3. Redeploy the frontend if necessary

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

## License

This project is licensed under the MIT License - see the LICENSE file for details. 