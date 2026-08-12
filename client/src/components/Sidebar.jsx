import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItemClass = ({ isActive }) => 
    `block px-5 py-2.5 rounded-r-lg rounded-l-[4px] transition-all duration-200 font-semibold text-[14px] ml-4 mr-4 ${
      isActive 
        ? 'bg-[#004b87] text-white border-l-4 border-[#F5A623]' 
        : 'text-[#89B4DB] hover:bg-[#003b6e] hover:text-white border-l-4 border-transparent'
    }`;



  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm"
          onClick={onClose}
        ></div>
      )}

      <nav className={`fixed left-0 top-0 h-full w-64 bg-[#002B49] border-r border-[#001f36] flex flex-col z-[70] md:z-40 shadow-sm transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand */}
      <div className="p-6 border-b border-[#00406c]">
        <h1 className="font-bold text-[22px] text-[#F5A623] tracking-tight leading-tight">Timeline Rapat</h1>
        <p className="text-[13px] text-[#89B4DB] font-medium mt-1">Dept. ITE — Kanwil BRI</p>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 py-6 overflow-y-auto custom-scrollbar flex flex-col gap-1">
        <NavLink to="/dashboard" onClick={onClose} className={navItemClass}>
          Dashboard
        </NavLink>
        <NavLink to="/cari-rapat" onClick={onClose} className={navItemClass}>
          Jadwal Rapat
        </NavLink>
        <NavLink to="/tambah" onClick={onClose} className={navItemClass}>
          Tambah Jadwal
        </NavLink>
        <NavLink to="/departemen" onClick={onClose} className={navItemClass}>
          Departemen
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <NavLink to="/user" onClick={onClose} className={navItemClass}>
              Kelola User
            </NavLink>
            <NavLink to="/log" onClick={onClose} className={navItemClass}>
              Log Aktivitas
            </NavLink>
            <NavLink to="/backup" onClick={onClose} className={navItemClass}>
              Backup Database
            </NavLink>
            <NavLink to="/reset-password" onClick={onClose} className={navItemClass}>
              Reset Password
            </NavLink>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[#001f36] bg-[#002B49] flex flex-col gap-4">
        <a 
          href="/tv" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[#89B4DB] hover:text-white font-semibold text-[14px] transition-colors"
        >
          Tampilan TV &rarr;
        </a>
      </div>
    </nav>
    </>
  );
};

export default Sidebar;
