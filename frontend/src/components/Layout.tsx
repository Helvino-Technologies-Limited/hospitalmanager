import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useNotificationStore } from '../store/notificationStore';
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope, Pill, FlaskConical, Scan,
  CreditCard, Shield, BedDouble, UserCog, BarChart3, Bell, LogOut, Menu, X, Settings, Heart, ClipboardList
} from 'lucide-react';

const baseNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/appointments', label: 'Appointments', icon: CalendarDays },
  { path: '/visits', label: 'Consultations', icon: Stethoscope },
  { path: '/pharmacy', label: 'Pharmacy', icon: Pill },
  { path: '/lab', label: 'Laboratory', icon: FlaskConical },
  { path: '/imaging', label: 'Imaging', icon: Scan },
  { path: '/billing', label: 'Billing', icon: CreditCard },
  { path: '/insurance', label: 'Insurance', icon: Shield },
  { path: '/wards', label: 'Wards & Beds', icon: BedDouble },
  { path: '/users', label: 'Staff', icon: UserCog },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { fullName, role, userId, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount(userId);
    const interval = setInterval(() => fetchUnreadCount(userId), 30000);
    return () => clearInterval(interval);
  }, [userId, fetchUnreadCount]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const showQueue = role === 'DOCTOR' || role === 'NURSE';
  const navItems = showQueue
    ? [baseNavItems[0], { path: '/my-queue', label: 'My Queue', icon: ClipboardList }, ...baseNavItems.slice(1)]
    : baseNavItems;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 -ml-64'} lg:w-64 lg:ml-0 fixed lg:static inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Heart className="w-8 h-8 text-primary-600" fill="currentColor" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Helvino HMS</h1>
            <p className="text-xs text-gray-500">Hospital Management</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {fullName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
              <p className="text-xs text-gray-500">{role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 w-full px-2 py-1.5 rounded transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={toggleSidebar} />}
    </div>
  );
}
