import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rapatApi, departemenApi } from '../services/api';
import MeetingDetailPanel from '../components/MeetingDetailPanel';
import * as XLSX from 'xlsx';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const CariRapat = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Export State
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const [exportMonth, setExportMonth] = useState(currentMonthStr);
  const [exportLoading, setExportLoading] = useState(false);

  // Filters
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [filterDept, setFilterDept] = useState('all');
  const [filterCari, setFilterCari] = useState('');

  const fetchDepts = async () => {
    try {
      const data = await departemenApi.getAll();
      setDepts(data);
    } catch (err) { console.error(err); }
  };

  const fetchMeetings = async (params = {}) => {
    setLoading(true);
    try {
      const data = await rapatApi.getAll({
        tanggal: filterTanggal,
        departemen: filterDept !== 'all' ? filterDept : '',
        cari: filterCari,
        ...params
      });
      const sortedData = (data || []).sort((a, b) => {
        if (a.status_computed === 'selesai' && b.status_computed !== 'selesai') return 1;
        if (a.status_computed !== 'selesai' && b.status_computed === 'selesai') return -1;
        return 0;
      });
      setMeetings(sortedData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDepts();
    fetchMeetings();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMeetings();
  };

  const openDetail = (meeting) => {
    setSelectedMeeting(meeting);
    setIsPanelOpen(true);
  };

  const closeDetail = () => {
    setIsPanelOpen(false);
    // Add small delay before nullifying to allow exit animation
    setTimeout(() => setSelectedMeeting(null), 300);
  };

  const handleExport = async (type) => {
    setExportLoading(true);
    try {
      // Ambil seluruh data rapat tanpa filter (agar bisa difilter per bulan atau semua)
      const allData = await rapatApi.getAll();
      
      let dataToExport = allData;
      let filename = 'Data_Rapat_Semua.xlsx';
      
      if (type === 'bulan') {
        if (!exportMonth) {
          alert('Pilih bulan terlebih dahulu.');
          setExportLoading(false);
          return;
        }

        const [selectedYear, selectedMonth] = exportMonth.split('-');
        
        dataToExport = allData.filter(m => {
          const date = new Date(m.tanggal);
          return date.getMonth() === (parseInt(selectedMonth) - 1) && date.getFullYear() === parseInt(selectedYear);
        });
        
        const dateObj = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
        const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        filename = `Data_Rapat_${monthName.replace(' ', '_')}.xlsx`;
      }
      
      if (dataToExport.length === 0) {
        alert('Tidak ada data rapat untuk bulan/kriteria tersebut.');
        setExportLoading(false);
        return;
      }

      // Format data untuk Excel
      const formattedData = dataToExport.map((m, index) => ({
        'No': index + 1,
        'Tanggal': formatTgl(m.tanggal),
        'Waktu': `${formatJam(m.jam_mulai)} - ${formatJam(m.jam_selesai)} WIB`,
        'Topik Rapat': m.topik,
        'Penyelenggara': m.penyelenggara,
        'Jenis': m.jenis,
        'Lokasi / ID': m.jenis === 'Online' ? (m.id_meeting || '-') : (m.ruangan || '-'),
        'Sandi': m.sandi || '-',
        'Link Rapat': m.link_rapat || '-',
        'Status': m.status_computed === 'berlangsung' ? 'Berlangsung' : (m.status_computed === 'selesai' ? 'Selesai' : 'Akan Datang'),
        'Pembuat': m.created_by_nama || 'Sistem'
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      
      // Mengatur lebar kolom agar rapi
      ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 20 }, // Tanggal
        { wch: 18 }, // Waktu
        { wch: 40 }, // Topik Rapat
        { wch: 25 }, // Penyelenggara
        { wch: 10 }, // Jenis
        { wch: 30 }, // Lokasi / ID
        { wch: 15 }, // Sandi
        { wch: 35 }, // Link Rapat
        { wch: 15 }, // Status
        { wch: 20 }, // Pembuat
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Jadwal Rapat");
      XLSX.writeFile(wb, filename);

    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor data.');
    } finally {
      setExportLoading(false);
    }
  };

  const formatJam = (t) => t ? t.substring(0, 5) : '';
  const formatTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <main className={`flex-1 min-h-0 flex flex-col relative min-w-0 transition-all duration-300 ${isPanelOpen ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
          {/* Header & Filter */}
          <motion.section 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border-subtle rounded-xl p-5 md:p-6 shadow-sm"
          >
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-[13px] font-bold text-on-surface-variant mb-1.5" htmlFor="date-select">Tanggal Rapat</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">calendar_month</span>
                  <input 
                    className="w-full pl-14 pr-4 py-2 border border-border-subtle rounded-lg text-[14px] focus:ring-2 focus:ring-primary outline-none transition-all" 
                    type="date" 
                    value={filterTanggal}
                    onChange={e => setFilterTanggal(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-[13px] font-bold text-on-surface-variant mb-1.5" htmlFor="dept-filter">Departemen</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">domain</span>
                  <select 
                    className="w-full pl-14 pr-8 py-2 border border-border-subtle rounded-lg text-[14px] focus:ring-2 focus:ring-primary outline-none transition-all appearance-none bg-white" 
                    value={filterDept}
                    onChange={e => setFilterDept(e.target.value)}
                  >
                    <option value="all">Semua Departemen</option>
                    {depts.map(d => <option key={d.id_departemen} value={d.id_departemen}>{d.nama_departemen}</option>)}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px] pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-[13px] font-bold text-on-surface-variant mb-1.5">Kata Kunci</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
                  <input 
                    className="w-full pl-14 pr-4 py-2 border border-border-subtle rounded-lg text-[14px] focus:ring-2 focus:ring-primary outline-none transition-all" 
                    type="text" 
                    placeholder="Topik rapat..."
                    value={filterCari}
                    onChange={e => setFilterCari(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="w-full md:w-auto bg-primary text-white font-bold text-[14px] h-[38px] px-6 rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                Cari
              </button>
            </form>
          </motion.section>

          {/* Results Area */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 flex flex-col bg-white border border-border-subtle rounded-xl overflow-hidden shadow-sm"
          >
            <div className="p-5 border-b border-border-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-surface-container-lowest">
              <div>
                <h3 className="text-[16px] font-bold text-on-surface">Hasil Pencarian</h3>
                <span className="text-[13px] font-semibold text-on-surface-variant">{filterTanggal ? formatTgl(filterTanggal) : 'Semua Tanggal'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 mr-2">
                  <label className="text-[12px] font-bold text-on-surface-variant">Bulan:</label>
                  <input 
                    type="month" 
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="px-3 py-1.5 border border-border-subtle rounded-lg text-[13px] font-semibold text-on-surface bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
                <button 
                  onClick={() => handleExport('bulan')}
                  disabled={exportLoading}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-4 py-2 rounded-lg font-bold text-[13px] transition-colors disabled:opacity-50"
                  title="Ekspor rapat di bulan yang terpilih"
                >
                  <span className="material-symbols-outlined text-[16px]">{exportLoading ? 'hourglass_empty' : 'table_view'}</span>
                  Bulan Terpilih
                </button>
                <button 
                  onClick={() => handleExport('semua')}
                  disabled={exportLoading}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg font-bold text-[13px] transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">{exportLoading ? 'hourglass_empty' : 'download'}</span>
                  Semua Data
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-surface-bg/50">
              {loading && (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {!loading && meetings.length === 0 && (
                <div className="text-center py-10 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] opacity-50 mb-3">event_busy</span>
                  <p className="font-semibold">Tidak ada rapat ditemukan</p>
                </div>
              )}

              <AnimatePresence>
                {!loading && meetings.map((meeting, idx) => {
                  const status = meeting.status_computed;
                  const getStatusColor = () => {
                    if (status === 'berlangsung') return 'bg-orange-50 text-orange-700 border-orange-200';
                    if (status === 'selesai') return 'bg-gray-100 text-gray-600 border-gray-300';
                    return 'bg-blue-50 text-blue-700 border-blue-200';
                  };
                  const getStatusText = () => {
                    if (status === 'berlangsung') return 'Berlangsung';
                    if (status === 'selesai') return 'Selesai';
                    return 'Akan Datang';
                  };
                  const statusColorCode = status === 'berlangsung' ? '#F5A623' : status === 'selesai' ? '#9CA3AF' : '#0072C6';

                  return (
                    <motion.div 
                      key={meeting.id_rapat}
                      variants={item}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      onClick={() => openDetail(meeting)} 
                      className={`group relative flex flex-col md:flex-row gap-4 p-5 border border-border-subtle rounded-lg hover:shadow-md transition-all bg-white cursor-pointer ${status === 'selesai' ? 'opacity-70' : ''}`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg" style={{ backgroundColor: statusColorCode }}></div>
                      
                      <div className="flex-none w-28 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border-subtle pb-3 md:pb-0 md:pr-4 pl-3">
                        <span className={`text-[20px] font-bold ${status === 'selesai' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                          {formatJam(meeting.jam_mulai)}
                        </span>
                        <span className="text-[12px] font-semibold text-on-surface-variant">{formatJam(meeting.jam_selesai)} WIB</span>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${getStatusColor()}`}>
                            {status === 'berlangsung' && <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse"></span>}
                            {getStatusText()}
                          </span>
                          <span className="text-[12px] font-semibold text-on-surface-variant flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded">
                            {meeting.jenis === 'Online' ? <span className="material-symbols-outlined text-[14px]">videocam</span> : <span className="material-symbols-outlined text-[14px]">location_on</span>}
                            {meeting.jenis === 'Online' ? 'Online Meeting' : meeting.ruangan || '-'}
                          </span>
                        </div>
                        <h4 className="text-[16px] font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">{meeting.topik}</h4>
                        <p className="text-[13px] font-medium text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">domain</span>
                          {meeting.penyelenggara}
                        </p>
                      </div>
                      
                      <div className="flex-none flex items-center justify-end md:justify-center pt-3 md:pt-0 border-t md:border-t-0 border-border-subtle">
                        <button className="text-primary group-hover:bg-primary/10 px-4 py-2 rounded-lg text-[13px] font-bold transition-colors border border-primary/30 flex items-center gap-2">
                          Detail
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

            </div>
          </motion.section>
        </div>
      </main>

      <MeetingDetailPanel isOpen={isPanelOpen} onClose={closeDetail} meeting={selectedMeeting} onUpdate={fetchMeetings} />
    </>
  );
};

export default CariRapat;
