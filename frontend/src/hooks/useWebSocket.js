import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const useWebSocket = (projectId) => {
  const [output, setOutput] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      setConnected(true);
      if (projectId) {
        socketRef.current.emit('joinProject', projectId);
      }
    });
    
    socketRef.current.on('executionOutput', (data) => {
      setOutput(prev => [...prev, data]);
    });
    
    socketRef.current.on('fileChanged', (data) => {
      console.log('File changed:', data);
    });
    
    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });
    
    return () => {
      socketRef.current.disconnect();
    };
  }, [projectId]);
  
  return { socket: socketRef.current, output, connected };
};

export default useWebSocket;
