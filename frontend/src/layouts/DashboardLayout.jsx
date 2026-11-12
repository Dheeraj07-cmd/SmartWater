import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FileText, Settings, LogOut, Menu, X, Droplets, Users, Activity, Sun, Moon, Leaf, Bell, LifeBuoy, AlertTriangle, Home, User as UserIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import WaterVideoBackground from '../components/WaterVideoBackground';

export default function DashboardLayout({ role }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const rawName = localStorage.getItem('user_name');
  const userName = rawName && rawName !== 'null' && rawName !== 'undefined' ? rawName : 'User';

  const rawPhoto = localStorage.getItem('user_photo');
  const userPhoto = rawPhoto && rawPhoto !== 'null' && rawPhoto !== 'undefined' ? rawPhoto : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    localStorage.clear();
    navigate('/login');
  };

  const navLinks = role === 'ROLE_ADMIN' ? [
    { name: 'Overview', path: '/admin/dashboard', icon: Activity },
    { name: 'Households', path: '/admin/households', icon: Home },
    { name: 'Data Ingestion', path: '/admin/data-ingestion', icon: Users },
    { name: 'Billing & Tariffs', path: '/admin/billing', icon: FileText },
    { name: 'Leak Center', path: '/admin/leaks', icon: AlertTriangle },
    { name: 'Support', path: '/admin/support', icon: LifeBuoy },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
  ] : [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Invoices', path: '/invoices', icon: FileText },
    { name: 'Conservation', path: '/conservation', icon: Leaf },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Support', path: '/support', icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-500 flex font-sans overflow-hidden relative">

      {/* Dynamic Video Background (Blue waves for Admin, Rain splashes for Resident) */}
      <WaterVideoBackground role={role} isTeal={role !== 'ROLE_ADMIN'} />

      {/* Sidebar */}
      <motion.aside
        initial={false} animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl border-r border-white/30 dark:border-gray-800 shadow-lg flex flex-col relative z-30 transition-colors"
      >
        <div className="h-20 flex items-center justify-between px-5 border-b border-gray-100/60 dark:border-gray-800">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 overflow-hidden whitespace-nowrap">
            <Droplets size={32} className="shrink-0" />
            {isSidebarOpen && <span className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">SmartWater</span>}
          </div>
        </div>

        <nav className="flex-1 py-8 flex flex-col gap-3 px-4 overflow-hidden">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;

            return (
              <Link key={link.name} to={link.path}>
                <motion.div
                  whileHover={{ x: 5, backgroundColor: isActive ? "" : "rgba(59, 130, 246, 0.08)" }} whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative overflow-hidden ${isActive ? 'text-blue-700 dark:text-blue-300 font-bold shadow-sm' : 'text-gray-700 dark:text-gray-300'
                    }`}
                >
                  {isActive && (
                    <motion.div layoutId="activeNav" className="absolute inset-0 bg-blue-100/90 dark:bg-blue-900/50 -z-10 rounded-2xl" />
                  )}
                  <Icon size={24} className="shrink-0" />
                  {isSidebarOpen && <span className="whitespace-nowrap">{link.name}</span>}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-gray-100/60 dark:border-gray-800">
          <motion.button
            whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-2xl text-red-500 hover:bg-red-50/80 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={24} className="shrink-0" />
            {isSidebarOpen && <span className="font-bold whitespace-nowrap">Sign Out</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen relative z-10">

        {/* Topbar */}
        <header className="h-20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-b border-white/30 dark:border-gray-800/50 flex items-center justify-between px-8 relative z-40">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>

          <div className="flex items-center gap-6 relative">
            <motion.button whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }} onClick={toggleTheme} className="p-2.5 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 py-1.5 px-1.5 pr-4 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700/80 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-inner overflow-hidden">
                  {userPhoto ? (
                    <img src={userPhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{userName}</span>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-2 z-50 pointer-events-auto"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate(role === 'ROLE_ADMIN' ? '/admin/settings' : '/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-left"
                    >
                      {role === 'ROLE_ADMIN' ? <><Settings size={18} /> System Settings</> : <><UserIcon size={18} /> My Profile</>}
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 sm:p-12 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeOut" }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
}