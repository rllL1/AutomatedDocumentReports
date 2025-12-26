'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/files', label: 'Files', icon: FileText },
  { href: '/utilities', label: 'Utilities', icon: Settings },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/profile', label: 'Profile', icon: User }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 min-h-screen flex flex-col fixed left-0 top-16 bottom-0 transition-all duration-300`}>
      {/* Toggle Button */}
      <div className="flex justify-end p-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} className="text-gray-600" /> : <ChevronLeft size={20} className="text-gray-600" />}
        </button>
      </div>

      {/* User Section */}
      {!isCollapsed && (
        <div className="p-6">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <User size={32} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-center">{user?.full_name || 'User Name'}</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              {user?.department && user?.division
                ? `${user.department} – ${user.division}`
                : user?.department || user?.division || 'Department – Division'}
            </p>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="p-4 flex justify-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={20} className="text-blue-600" />
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4">
        {/* Organization Logos */}
        <div className={`flex ${isCollapsed ? 'flex-col' : 'flex-row'} justify-center items-center gap-3 mb-4`}>
          <img src="/dict.png" alt="Logo" className="h-12 object-contain" />
          <img src="/pilipns.png" alt="Philippines" className="h-12 object-contain" />
        </div>
        
        <button
          onClick={handleLogout}
          className={`w-full bg-red-600 text-white ${isCollapsed ? 'px-2' : 'px-4'} py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center ${isCollapsed ? 'justify-center' : 'justify-center'}`}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          {isCollapsed ? 'OUT' : 'SIGN OUT'}
        </button>
      </div>
    </aside>
  );
}
