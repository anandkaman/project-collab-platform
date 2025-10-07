import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const useWebSocket = (projectId) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    // Use environment variable or fallback to localhost
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      newSocket.emit('joinProject', projectId);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [projectId]);

  return { socket, connected };
};

export default useWebSocket;
