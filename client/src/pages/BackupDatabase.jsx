import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { backupApi } from '../services/api';

const BackupDatabase = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const data = await backupApi.getAll();
      setBackups(data);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat riwayat backup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleBackupNow = async () => {
    if (isBackingUp) return;
    try {
      setIsBackingUp(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await backupApi.create();
      setSuccessMsg(res.message || 'Backup berhasil dibuat');
      fetchBackups();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membuat backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const blob = await backupApi.download(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMsg(`Berhasil mengunduh ${filename}`);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengunduh file backup');
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Hapus file backup ${filename}?`)) return;
    try {
      const res = await backupApi.delete(filename);
      setSuccessMsg(res.message || 'Backup berhasil dihapus');
      fetchBackups();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus backup');
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('id-ID', { month: 'short' });
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const totalSize = Array.isArray(backups) ? backups.reduce((acc, curr) => acc + curr.ukuran_kb, 0) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto space-y-8 w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-[#002B49] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F5A623]"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>
            Backup Database
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola cadangan data — {Array.isArray(backups) ? backups.length : 0} file, total {(totalSize / 1024).toFixed(2)} MB
          </p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBackupNow}
          disabled={isBackingUp}
          className="bg-[#002B49] hover:bg-[#003b6e] text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2 cursor-pointer"
        >
          {isBackingUp ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Memproses Backup...
            </>
          ) : (
            'Backup Sekarang'
          )}
        </motion.button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm">
          {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 text-sm">
          {successMsg}
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start"
      >
        {/* Riwayat Backup */}
        <motion.div variants={itemVariants} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Riwayat Backup</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Nama File</th>
                  <th className="px-6 py-3 font-medium">Dibuat</th>
                  <th className="px-6 py-3 font-medium">Ukuran</th>
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : !Array.isArray(backups) || backups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Belum ada backup. Klik "Backup Sekarang" untuk membuat cadangan.
                    </td>
                  </tr>
                ) : (
                  backups.map((b, index) => (
                    <motion.tr 
                      key={b.id_backup} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {b.nama_file}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(b.created_at)}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{(b.ukuran_kb).toLocaleString()} KB</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(b.nama_file)}
                            className="cursor-pointer p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium px-3 border border-blue-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 
                            Download
                          </button>
                          <button
                            onClick={() => handleDelete(b.nama_file)}
                            className="cursor-pointer p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium px-3 border border-red-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Hapus
                          </button>
                        </div>
                      </td>
                  </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Status Backup Otomatis */}
        <motion.div variants={itemVariants} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Status Backup Otomatis</h2>
          </div>
          <div className="p-6">
            <div className="text-[13px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-4 leading-relaxed">
              Belum ada catatan backup otomatis. Fitur backup otomatis (Cron Job) belum diaktifkan untuk lingkungan ini. Silakan gunakan fungsi "Backup Sekarang" untuk pencadangan manual.
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default BackupDatabase;
