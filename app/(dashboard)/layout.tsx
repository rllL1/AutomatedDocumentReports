'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b-2 border-blue-600 h-16 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between h-full px-6">
          <h1 className="text-xl font-bold text-blue-600">DocVal</h1>
          <div className="flex items-center gap-4">
            <div className="text-gray-700">
              Hello, <span className="font-semibold">{user?.full_name || 'User'}</span>
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
              >
                <User size={20} className="text-blue-600" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <User size={18} className="text-gray-600" />
                    <span className="text-gray-700">Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <LogOut size={18} className="text-gray-600" />
                    <span className="text-gray-700">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16 min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-white">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
