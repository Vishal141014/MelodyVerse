import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;
}

const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),
}));

export default useSocketStore; 