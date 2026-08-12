import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import MeetingDetailPanel from '../components/MeetingDetailPanel';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const CountUp = ({ end, duration = 1500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId = null;
    
    if (end === 0) {
      setCount(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);
    
    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration]);

  return <>{count}</>;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const isCurrentMonth = selectedMonth === currentMonthStr;

  const [stats, setStats] = useState({ total_hari_ini: 0, berlangsung: 0, akan_datang: 0, total_bulan_ini: 0, total_selesai: 0, total_dibatalkan: 0 });
  const [deptStats, setDeptStats] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsData, upcomingData, deptStatsData] = await Promise.all([
        dashboardApi.stats(selectedMonth),
        dashboardApi.upcoming(),
        dashboardApi.departmentStats(selectedMonth)
      ]);
      const sortedUpcoming = (upcomingData || []).sort((a, b) => {
        if (a.status_computed === 'selesai' && b.status_computed !== 'selesai') return 1;
        if (a.status_computed !== 'selesai' && b.status_computed === 'selesai') return -1;
        return 0;
      });
      
      setStats(statsData);
      setUpcoming(sortedUpcoming);
      setDeptStats(deptStatsData);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const generateMonthOptions = () => {
    const options = [];
    const d = new Date();
    for (let i = -12; i <= 12; i++) {
      const date = new Date(d.getFullYear(), d.getMonth() + i, 1);
      const val = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      options.push({ value: val, label });
    }
    return options;
  };
  const monthOptions = generateMonthOptions();

  const openDetail = (meeting) => {
    setSelectedMeeting(meeting);
    setIsPanelOpen(true);
  };

  const closeDetail = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedMeeting(null), 300);
  };

  const today = new Date();
  const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][today.getDay()];
  const tanggal = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatTime = (t) => {
    if (!t) return '';
    return t.substring(0, 5); // "08:00:00" -> "08:00"
  };

  return (
    <>
      <main className="flex-1 min-h-0 overflow-y-auto p-md lg:p-lg bg-surface-bg text-on-surface">
        <div className={`max-w-container-max mx-auto space-y-lg transition-all duration-300 ${isPanelOpen ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <div>
              <h2 className="text-[24px] font-bold text-primary tracking-tight">Dashboard</h2>
              <div className="text-[14px] text-on-surface-variant mt-1">
                {hari}, {tanggal} — Selamat datang, {user?.nama || 'Admin'}!
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3">
              <div className="relative">
                <select 
                  className="appearance-none bg-white border border-border-subtle rounded-lg px-4 py-2 pr-10 text-[14px] font-semibold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">calendar_month</span>
              </div>
              <Link to="/tambah" className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-semibold text-[14px] transition-colors flex items-center justify-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Tambah Jadwal
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className={`grid grid-cols-1 gap-4 ${isCurrentMonth ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-2'}`}
          >
            {isCurrentMonth ? (
              <>
                <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                  <div className="text-[40px] font-extrabold leading-none mb-2" style={{ color: '#ffc532' }}>
                    {loading ? '—' : <CountUp end={stats.total_hari_ini} />}
                  </div>
                  <div className="text-[14px] font-semibold text-on-surface-variant uppercase tracking-wide">Total Rapat Hari Ini</div>
                </motion.div>
                
                <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                  <div className="text-[40px] font-extrabold leading-none mb-2" style={{ color: '#f5a623' }}>
                    {loading ? '—' : <CountUp end={stats.berlangsung} />}
                  </div>
                  <div className="text-[14px] font-semibold text-on-surface-variant uppercase tracking-wide">Sedang Berlangsung</div>
                </motion.div>
                
                <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                  <div className="text-[40px] font-extrabold leading-none mb-2" style={{ color: '#0072c6' }}>
                    {loading ? '—' : <CountUp end={stats.akan_datang} />}
                  </div>
                  <div className="text-[14px] font-semibold text-on-surface-variant uppercase tracking-wide">Akan datang</div>
                </motion.div>
                
                <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                  <div className="text-[40px] font-extrabold leading-none mb-2" style={{ color: '#534ab7' }}>
                    {loading ? '—' : <CountUp end={stats.total_bulan_ini} />}
                  </div>
                  <div className="text-[14px] font-semibold text-on-surface-variant uppercase tracking-wide">Total bulan ini</div>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                  <div className="text-[40px] font-extrabold leading-none mb-2" style={{ color: '#ffc532' }}>
                    {loading ? '—' : <CountUp end={stats.total_selesai} />}
                  </div>
                  <div className="text-[14px] font-semibold text-on-surface-variant uppercase tracking-wide">Rapat Selesai</div>
                </motion.div>
                
                <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-border-subtle flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                  <div className="text-[40px] font-extrabold leading-none mb-2" style={{ color: '#534ab7' }}>
                    {loading ? '—' : <CountUp end={stats.total_bulan_ini} />}
                  </div>
                  <div className="text-[14px] font-semibold text-on-surface-variant uppercase tracking-wide">Total Rapat Bulan Ini</div>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Department Chart Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"
          >
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-border-subtle p-5 flex flex-col h-[400px]">
              <h3 className="text-[16px] font-bold text-on-surface mb-4 flex-none">Statistik Rapat per Departemen {isCurrentMonth ? '(Bulan Ini)' : `(${monthOptions.find(o => o.value === selectedMonth)?.label})`}</h3>
              <div className="flex-1 min-h-0 w-full relative">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : deptStats.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-[14px]">
                    Belum ada data rapat bulan ini
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="kode" 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f3f4f6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} maxBarSize={60}>
                        {deptStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#378add' : '#1d9e75'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border-subtle p-5 flex flex-col h-[400px]">
              <h3 className="text-[16px] font-bold text-on-surface mb-4 flex-none">Detail Departemen</h3>
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {loading ? (
                   <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : deptStats.length === 0 ? (
                   <div className="text-center text-on-surface-variant text-[13px] py-10">Tidak ada data</div>
                ) : (
                  deptStats.map((dept, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-border-subtle hover:bg-surface-container-lowest transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-white text-[12px] font-bold ${idx % 2 === 0 ? 'bg-[#378add]' : 'bg-[#1d9e75]'}`}>
                          #{idx + 1}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-bold text-on-surface truncate" title={`${dept.kode} - ${dept.nama}`}>
                            {dept.kode} - {dept.nama}
                          </span>
                        </div>
                      </div>
                      <span className="text-[14px] font-extrabold text-on-surface ml-3 flex-shrink-0">{dept.jumlah}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Rapat Berikutnya Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden mt-6"
          >
            <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-[18px] font-bold text-on-surface">Jadwal Rapat Hari Ini</h3>
              <Link to="/cari-rapat" className="text-[13px] font-semibold bg-surface-container-low text-primary hover:bg-surface-container-high px-4 py-1.5 rounded-md transition-colors border border-border-subtle">
                Lihat Semua
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-border-subtle text-[12px] uppercase tracking-wider text-on-surface-variant">
                    <th className="px-6 py-4 font-bold">Topik</th>
                    <th className="px-6 py-4 font-bold">Waktu</th>
                    <th className="px-6 py-4 font-bold">Jenis</th>
                    <th className="px-6 py-4 font-bold">Penyelenggara</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {upcoming.map((meeting, index) => (
                    <motion.tr 
                      key={meeting.id_rapat}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (index * 0.1) }}
                      className="hover:bg-surface-container-lowest transition-colors cursor-pointer group"
                      onClick={() => openDetail(meeting)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <strong className="text-on-surface font-semibold group-hover:text-primary transition-colors">{meeting.topik}</strong>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-primary">
                        {formatTime(meeting.jam_mulai)} - {formatTime(meeting.jam_selesai)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider ${
                          meeting.jenis === 'Online' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                          {meeting.jenis}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] text-on-surface-variant">
                        {meeting.penyelenggara}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider ${
                          meeting.status_computed === 'berlangsung' ? 'bg-green-100 text-green-700 border border-green-200' :
                          meeting.status_computed === 'akan_datang' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          meeting.status_computed === 'dibatalkan' ? 'bg-red-100 text-red-700 border border-red-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {meeting.status_computed === 'berlangsung' ? 'Sedang Berlangsung' : 
                           meeting.status_computed === 'akan_datang' ? 'Akan Datang' : 
                           meeting.status_computed === 'dibatalkan' ? 'Dibatalkan' : 'Selesai'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                  {!loading && upcoming.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant text-[14px]">
                        Tidak ada jadwal rapat hari ini
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant text-[14px]">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

        </div>
      </main>

      <MeetingDetailPanel isOpen={isPanelOpen} onClose={closeDetail} meeting={selectedMeeting} onUpdate={fetchData} />
    </>
  );
};

export default Dashboard;
