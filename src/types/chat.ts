export interface Message {
  id?: string;
  sender: string;
  content: string;
  type: string; // 'text', 'image', 'gif', 'sticker', 'system'
  timestamp: string;
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  senderColor?: string;
}

export interface Room {
  id: string;
  name?: string;
  users: RoomUser[];
  messages: Message[];
  currentVideo?: {
    videoId: string;
    title: string;
  };
  playlist: PlaylistItem[];
}

export interface RoomUser {
  id: string;
  username: string;
  avatarColor: string;
  isHost: boolean;
}

export interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  addedBy: string;
  duration?: string;
} 