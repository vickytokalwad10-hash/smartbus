import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = (url = 'http://localhost:5000') => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(url, { transports: ['websocket'] });
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [url]);

  return socketRef;
};

export default useSocket;
