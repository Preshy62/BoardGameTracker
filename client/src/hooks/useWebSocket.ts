import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage, WebSocketMessageType } from '@shared/schema';
import { getWebSocketUrl } from '@/lib/utils';

type MessageHandler = (data: any) => void;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<Map<WebSocketMessageType, MessageHandler[]>>(new Map());

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setIsConnecting(true);
    const wsUrl = getWebSocketUrl();
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    socket.onerror = (event) => {
      setError(new Error('WebSocket error'));
      setIsConnecting(false);
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const handlers = messageHandlersRef.current.get(message.type) || [];
        handlers.forEach(handler => handler(message.payload));
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socketRef.current = socket;

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((type: WebSocketMessageType, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, payload };
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Add message event handler
  const addMessageHandler = useCallback((type: WebSocketMessageType, handler: MessageHandler) => {
    const handlers = messageHandlersRef.current.get(type) || [];
    handlers.push(handler);
    messageHandlersRef.current.set(type, handlers);

    return () => {
      const updatedHandlers = messageHandlersRef.current.get(type)?.filter(h => h !== handler) || [];
      messageHandlersRef.current.set(type, updatedHandlers);
    };
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    addMessageHandler
  };
}
