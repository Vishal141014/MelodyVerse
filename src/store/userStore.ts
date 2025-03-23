import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  username: string;
  avatarColor: string;
  isDarkMode: boolean;
  setUsername: (username: string) => void;
  setAvatarColor: (color: string) => void;
  setDarkMode: (isDark: boolean) => void;
}

// Generate a random avatar color
const generateRandomColor = (): string => {
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33F5',
    '#F5FF33', '#33FFF5', '#F533FF', '#FF8C33',
    '#8C33FF', '#33FFAA', '#FF33AA', '#AA33FF',
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      username: '',
      avatarColor: generateRandomColor(),
      isDarkMode: true,
      setUsername: (username) => set({ username }),
      setAvatarColor: (avatarColor) => set({ avatarColor }),
      setDarkMode: (isDarkMode) => set({ isDarkMode }),
    }),
    {
      name: 'melodyverse-user',
    }
  )
);

export default useUserStore; 