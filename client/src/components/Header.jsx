import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { notifikasiApi } from '../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res = await notifikasiApi.getAll();
      setNotifs(res);
      setUnreadCount(res.filter(n => !n.is_read).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 60000); // Polling setiap 1 menit
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRead = async (id, link, isDynamic) => {
    if (!isDynamic) {
      try {
        await notifikasiApi.markAsRead(id);
        fetchNotifs();
      } catch(err) { console.error(err); }
    }
    setIsNotifOpen(false);
    if (link) navigate(link);
  };

  const handleReadAll = async () => {
    try {
      await notifikasiApi.markAllAsRead();
      fetchNotifs();
    } catch(err) { console.error(err); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-surface-container-lowest border-b border-border-subtle flex justify-between items-center h-16 px-lg w-full sticky top-0 z-50">
      <div className="flex items-center gap-sm md:hidden">
        <button onClick={onMenuClick} className="p-sm rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-150 text-on-surface-variant">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
      <div className="font-headline-md text-headline-md font-bold text-primary truncate">
        Jadwal Rapat BRI RO 5
      </div>
      <div className="flex items-center gap-sm">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`p-sm rounded-full transition-colors active:scale-95 duration-150 relative ${isNotifOpen ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] flex items-center justify-center bg-status-active text-white text-[10px] font-bold rounded-full px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-border-subtle overflow-hidden z-50 origin-top-right flex flex-col max-h-[400px]"
              >
                <div className="p-3 border-b border-border-subtle bg-surface-container-lowest flex justify-between items-center">
                  <h3 className="font-bold text-[14px] text-on-surface">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleReadAll}
                      className="text-[12px] text-primary font-semibold hover:underline"
                    >
                      Tandai sudah dibaca
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                  {notifs.length === 0 ? (
                    <div className="p-6 text-center text-on-surface-variant text-[13px]">
                      Belum ada notifikasi
                    </div>
                  ) : (
                    notifs.map(n => (
                      <div 
                        key={n.id_notifikasi}
                        onClick={() => handleRead(n.id_notifikasi, n.link, n.is_dynamic)}
                        className={`p-3 border-b border-border-subtle hover:bg-surface-container-lowest cursor-pointer transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex gap-2">
                          {!n.is_read && (
                            <div className="w-2 h-2 rounded-full bg-status-active mt-1.5 flex-shrink-0"></div>
                          )}
                          <div className={n.is_read ? 'pl-4' : ''}>
                            <p className="text-[13px] font-bold text-on-surface">{n.judul}</p>
                            <p className="text-[12px] text-on-surface-variant mt-0.5 line-clamp-2">{n.pesan}</p>
                            <p className="text-[11px] text-primary/70 mt-1">{n.is_dynamic ? 'Pengingat' : dayjs(n.created_at).fromNow()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20 ml-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all select-none"
          >
            {getInitials(user?.nama)}
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border border-border-subtle overflow-hidden z-50 origin-top-right"
              >
                <div className="p-4 border-b border-border-subtle bg-surface-container-lowest">
                  <p className="font-bold text-on-surface text-[14px] truncate">{user?.nama || 'User'}</p>
                  <p className="text-[12px] text-on-surface-variant capitalize mt-0.5">{user?.role || 'User'}</p>
                </div>
                <div className="p-2 border-b border-border-subtle">
                  <motion.button 
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/profil');
                    }}
                    className="w-full text-left px-3 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    Profil Saya
                  </motion.button>
                </div>
                <div className="p-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Keluar Aplikasi
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
