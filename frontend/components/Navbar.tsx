'use client';
import { useRouter } from 'next/navigation';
import { Calendar, LogOut } from 'lucide-react';
import { logout } from '@/lib/auth';
import NotificationBell from './NotificationBell';
import { User } from '../types/index';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
  try {
    await logout();
    
    // Disconnect socket if using socket context
    // if (socket) socket.disconnect();
    
    // Clear any remaining data
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    router.push('/login');
    router.refresh(); // Refresh router state
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //     router.push('/login');
  //   } catch (error) {
  //     console.error('Logout failed:', error);
  //   }
  // };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">HealthCare</span>
            <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {user?.role === 'doctor' ? 'Doctor' : 'Patient'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">{user?.name}</span>
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}