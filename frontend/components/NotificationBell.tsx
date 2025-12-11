'use client';
import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { notificationApi } from '@/lib/api';
import { useSocket, AppNotification } from '@/contexts/SocketContext';
import React from 'react';

export default function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [persistedNotifications, setPersistedNotifications] = useState<AppNotification[]>([]);
  const { notifications: liveNotifications, markAsRead, connected } = useSocket();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id || user._id);
      }
    } catch (error) {
      console.error('Failed to get user ID:', error);
    }
  }, []);

  // Fetch persisted notifications on mount and when user changes
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.get<AppNotification[]>('/api/notifications/my');
      console.log('Fetched persisted notifications:', response.data);
      setPersistedNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Combine live and persisted notifications, removing duplicates
  const allNotifications = React.useMemo(() => {
    const combined = [...liveNotifications, ...persistedNotifications];
    const uniqueMap = new Map<string, AppNotification>();
    
    combined.forEach((notif: AppNotification) => {
      // Use _id or id as the unique identifier
      const uniqueId = notif._id || notif.id;
      if (uniqueId && !uniqueMap.has(uniqueId)) {
        // Normalize the notification object
        uniqueMap.set(uniqueId, {
          ...notif,
          id: uniqueId,
          _id: notif._id || notif.id,
        });
      }
    });
    
    // Filter by current user and sort by date
    return Array.from(uniqueMap.values())
      .filter(n => n.userId === currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [liveNotifications, persistedNotifications, currentUserId]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.patch(`/api/notifications/${id}/read`);
      markAsRead(id);
      fetchNotifications(); // Refresh persisted notifications
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const totalUnread = allNotifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Connection Status Indicator */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 hover:bg-gray-100 rounded-full transition"
        >
          <Bell className="h-6 w-6 text-gray-700" />
          {totalUnread > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
        {/* Socket connection indicator */}
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            connected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={connected ? 'Connected' : 'Disconnected'}
        />
      </div>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {connected ? '🟢 Live updates active' : '🔴 Disconnected'}
                </p>
              </div>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {allNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                allNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                      !notif.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-sm text-gray-900">
                        {notif.title}
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkAsRead(notif._id || notif.id)}
                          className="text-blue-600 hover:text-blue-700 ml-2"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {notif.message}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        {new Date(notif.createdAt).toLocaleString()}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          notif.type.includes('appointment')
                            ? 'bg-purple-100 text-purple-700'
                            : notif.type === 'reminder'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {notif.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {allNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button
                  onClick={fetchNotifications}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}