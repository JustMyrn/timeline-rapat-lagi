import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { logApi } from '../services/api';

const aksiLabels = {
  'LOGIN': 'Login', 'TAMBAH_RAPAT': 'Tambah Jadwal', 'EDIT_RAPAT': 'Edit Jadwal', 'HAPUS_RAPAT': 'Hapus Jadwal',
  'TAMBAH_DEPARTEMEN': 'Tambah Departemen', 'EDIT_DEPARTEMEN': 'Edit Departemen', 'HAPUS_DEPARTEMEN': 'Hapus Departemen',
  'TAMBAH_USER': 'Tambah User', 'EDIT_USER': 'Edit User', 'HAPUS_USER': 'Hapus User', 'IMPORT_JADWAL': 'Import Excel'
};

const getBadgeStyle = (aksi) => {
  if (aksi === 'LOGIN') return 'bg-purple-50 text-purple-700 border-purple-200';
  if (aksi.startsWith('TAMBAH') || aksi.startsWith('EDIT') || aksi === 'IMPORT_JADWAL') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (aksi.startsWith('HAPUS')) return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-surface-container-high text-on-surface-variant border-border-subtle';
};

const LogAktivitas = () => {
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterAksi, setFilterAksi] = useState('');
  const [filterCari, setFilterCari] = useState('');
  const [halaman, setHalaman] = useState(1);
  const [logs, setLogs] = useState([]);
  const [daftarAksi, setDaftarAksi] = useState([]);
  const [pagination, setPagination] = useState({ totalData: 0, totalHalaman: 1 });
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (params = {}) => {
    setLoading(true);
    try {
      const data = await logApi.getAll({ halaman, tanggal: filterTanggal, aksi: filterAksi, cari: filterCari, ...params });
      setLogs(data.data);
      setPagination(data.pagination);
      setDaftarAksi(data.daftarAksi || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [halaman]);

  const handleFilter = (e) => { e.preventDefault(); setHalaman(1); fetchLogs({ halaman: 1 }); };
  const handleReset = () => { setFilterTanggal(''); setFilterAksi(''); setFilterCari(''); setHalaman(1); fetchLogs({ halaman: 1, tanggal: '', aksi: '', cari: '' }); };

  const formatDate = (dt) => {
    const d = new Date(dt);
    return { 
      date: d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' }), 
      time: d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')
    };
  };

  return (
    <main className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 bg-surface-bg text-on-surface">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
          <h2 className="text-[24px] font-bold text-primary tracking-tight">Log Aktivitas</h2>
          <div className="text-[14px] text-on-surface-variant mt-1">Riwayat semua aktivitas pengguna ({pagination.totalData.toLocaleString('id-ID')} catatan)</div>
        </motion.div>

        {/* Filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-4 rounded-xl shadow-sm border border-border-subtle">
          <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 min-w-[150px]"><label className="block text-[12px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Tanggal</label><input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="w-full border border-border-subtle rounded-lg px-3 py-2 text-[14px] focus:ring-2 focus:ring-primary outline-none transition-all" /></div>
            <div className="flex-1 min-w-[200px]"><label className="block text-[12px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Jenis Aksi</label><select value={filterAksi} onChange={(e) => setFilterAksi(e.target.value)} className="w-full border border-border-subtle rounded-lg px-3 py-2 text-[14px] focus:ring-2 focus:ring-primary outline-none transition-all"><option value="">Semua Aksi</option>{daftarAksi.map(a => <option key={a} value={a}>{aksiLabels[a] || a}</option>)}</select></div>
            <div className="flex-[2] min-w-[200px]"><label className="block text-[12px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Cari</label><input type="text" value={filterCari} onChange={(e) => setFilterCari(e.target.value)} placeholder="Nama user / detail..." className="w-full border border-border-subtle rounded-lg px-3 py-2 text-[14px] focus:ring-2 focus:ring-primary outline-none transition-all" /></div>
            <div className="flex gap-2 w-full md:w-auto">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-bold text-[14px] transition-colors shadow-sm flex-1 md:flex-none">Filter</button>
              <button type="button" onClick={handleReset} className="bg-white border border-border-subtle hover:bg-surface-container-lowest text-on-surface-variant px-5 py-2 rounded-lg font-bold text-[14px] transition-colors shadow-sm flex-1 md:flex-none">Reset</button>
            </div>
          </form>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-surface-container-lowest border-b border-border-subtle text-[12px] uppercase tracking-wider text-on-surface-variant"><th className="px-5 py-3.5 font-bold w-[150px]">Waktu</th><th className="px-5 py-3.5 font-bold w-[200px]">Pengguna</th><th className="px-5 py-3.5 font-bold w-[180px]">Aksi</th><th className="px-5 py-3.5 font-bold">Detail</th><th className="px-5 py-3.5 font-bold w-[140px]">Alamat IP</th></tr></thead>
              <tbody className="divide-y divide-border-subtle">
                {logs.map((log) => {
                  const { date, time } = formatDate(log.waktu_iso || log.waktu);
                  return (
                    <tr key={log.id_log} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap"><div className="text-[13px] font-semibold text-on-surface">{date}</div><div className="text-[12px] text-on-surface-variant">{time}</div></td>
                      <td className="px-5 py-3 whitespace-nowrap">{log.nama_user ? <><div className="text-[14px] font-bold text-on-surface">{log.nama_user}</div><div className="text-[12px] text-on-surface-variant">@{log.username}</div></> : <div className="text-[13px] italic text-on-surface-variant/70">User terhapus</div>}</td>
                      <td className="px-5 py-3 whitespace-nowrap"><span className={`inline-flex px-2 py-1 rounded text-[11px] font-bold tracking-wider uppercase border ${getBadgeStyle(log.aksi)}`}>{aksiLabels[log.aksi] || log.aksi}</span></td>
                      <td className="px-5 py-3 text-[14px] text-on-surface">{log.detail || '-'}</td>
                      <td className="px-5 py-3 whitespace-nowrap"><span className="font-mono text-[13px] bg-surface-container-high px-2 py-1 rounded text-on-surface-variant">{log.ip || '-'}</span></td>
                    </tr>
                  );
                })}
                {!loading && logs.length === 0 && <tr><td colSpan="5" className="px-5 py-8 text-center text-on-surface-variant text-[14px]">Tidak ada log</td></tr>}
                {loading && <tr><td colSpan="5" className="px-5 py-8 text-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>}
              </tbody>
            </table>
          </div>

          {pagination.totalHalaman > 1 && (
            <div className="p-4 border-t border-border-subtle bg-surface-container-lowest flex justify-center gap-1">
              {Array.from({ length: pagination.totalHalaman }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setHalaman(p)} className={`w-8 h-8 flex items-center justify-center rounded font-bold text-[13px] transition-colors ${p === halaman ? 'bg-primary text-white shadow-sm' : 'bg-white border border-border-subtle text-on-surface-variant hover:bg-surface-container-high'}`}>{p}</button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
};

export default LogAktivitas;
