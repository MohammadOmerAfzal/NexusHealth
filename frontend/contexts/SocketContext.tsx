'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Unified notification interface
export interface AppNotification {
  id: string;
  _id?: string; // MongoDB ID (optional)
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  appointmentId?: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  clearAll: () => {},
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from localStorage or cookies
    const getUserIdFromStorage = () => {
      try {
        // Try localStorage first
        const userStr = localStorage.getItem('user');
        
        if (userStr) {
          const user = JSON.parse(userStr);
          const userId = user.id || user._id || user.userId;
          
          if (userId) {
            console.log('✅ Found userId in localStorage:', userId);
            return userId;
          }
        }

        // Fallback: try cookies (JWT token)
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.userId || payload.id || payload.sub;
            
            if (userId) {
              console.log('✅ Found userId in token:', userId);
              return userId;
            }
          } catch (e) {
            console.error('Failed to decode token:', e);
          }
        }

        console.log('❌ No authentication found');
        return null;
      } catch (error) {
        console.error('❌ Failed to get userId:', error);
        return null;
      }
    };

    const userId = getUserIdFromStorage();
    
    // Clear notifications if user changed
    if (userId !== currentUserId) {
      console.log('User changed, clearing notifications');
      setNotifications([]);
      setCurrentUserId(userId);
    }
    
    if (!userId) {
      console.log('❌ No user ID available for socket connection');
      return;
    }

    console.log('🔌 Connecting socket for user:', userId);

    const socketUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
    console.log('🌐 Socket URL:', socketUrl);

    // Connect to notification service
    const socketInstance = io(socketUrl, {
      query: { userId },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setConnected(true);
      
      // Send join event with userId
      socketInstance.emit('join', userId);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔁 Socket reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      socketInstance.emit('join', userId);
    });

    // Listen for new notifications
    socketInstance.on('notification', (notification: AppNotification) => {
      console.log('🔔 New notification received:', notification);
      
      // Only add if it's for current user
      if (notification.userId === userId) {
        console.log('✅ Adding notification to state');
        setNotifications(prev => [notification, ...prev]);
        
        // Show browser notification if permitted
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
            });
          }
        }
      } else {
        console.log('⏭️  Notification for different user, ignoring');
      }
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (socketInstance && socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, [currentUserId]);

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('🔔 Notification permission:', permission);
        });
      }
    }
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => {
        const notifId = n._id || n.id;
        return (notifId === id || n.id === id) ? { ...n, read: true } : n;
      })
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        unreadCount,
        markAsRead,
        clearAll,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}