'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface AppNotification {
  id: string;
  _id?: string;
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
    // Get user ID from localStorage
    const getUserIdFromStorage = () => {
      try {
        // First, try to get from localStorage (where your auth stores it)
        const userStr = localStorage.getItem('user');
        
        if (userStr) {
          const user = JSON.parse(userStr);
          const userId = user.id || user._id || user.userId;
          
          if (userId) {
            console.log('✅ Found userId in localStorage:', userId);
            return userId;
          } else {
            console.error('❌ User object found but no id field:', user);
            return null;
          }
        }

        console.log('❌ No user found in localStorage');
        
        // Fallback: try to get from cookies (JWT token)
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (token) {
          console.log('✅ Token found in cookies, decoding...');
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('📋 Decoded JWT payload:', payload);
          const userId = payload.userId || payload.id || payload.sub || payload.user?.id;
          
          if (userId) {
            console.log('✅ Found userId in token:', userId);
            return userId;
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
      console.log('💡 Make sure you are logged in');
      return;
    }

    console.log('🔌 Attempting to connect socket for user:', userId);

    const socketUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
    console.log('🌐 Connecting to:', socketUrl);

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
      console.log('🔗 Socket transport:', socketInstance.io.engine.transport.name);
      setConnected(true);
      
      // Send join event with userId
      console.log('📤 Sending join event for user:', userId);
      socketInstance.emit('join', userId);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('Full error:', error);
      setConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔁 Socket reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      socketInstance.emit('join', userId);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt', attemptNumber);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error.message);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
    });

    // Listen for new notifications
    socketInstance.on('notification', (notification: AppNotification) => {
      console.log('🔔 New notification received:', notification);
      console.log('Current user ID:', userId);
      console.log('Notification user ID:', notification.userId);
      
      // Only add notification if it's for the current user
      if (notification.userId === userId) {
        console.log('✅ Notification is for current user, adding to state');
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
        console.log('⏭️  Notification is for different user, ignoring');
      }
    });

    // Test event to verify connection
    socketInstance.on('connect', () => {
      console.log('🧪 Testing connection - emitting test event');
      socketInstance.emit('test', { message: 'Hello from client' });
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (socketInstance && socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, [currentUserId]); // Re-run when currentUserId changes

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
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
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