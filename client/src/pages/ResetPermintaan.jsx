import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { resetApi } from '../services/api';
import dayjs from 'dayjs';

function ResetPermintaan() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPassInfo, setNewPassInfo] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [pendingData, historyData] = await Promise.all([
        resetApi.getPending(),
        resetApi.getHistory()
      ]);
      setPending(pendingData);
      setHistory(historyData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id_request, id_user) => {
    if (!window.confirm('Reset password akun ini dan buat password baru?')) return;
    
    try {
      setError('');
      setSuccess('');
      setNewPassInfo(null);
      const res = await resetApi.approve({ id_request, id_user });
      setSuccess(res.message);
      setNewPassInfo(res.newPassInfo);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleIgnore = async (id_request) => {
    if (!window.confirm('Tandai permintaan ini selesai tanpa reset password?')) return;
    
    try {
      setError('');
      setSuccess('');
      setNewPassInfo(null);
      const res = await resetApi.ignore({ id_request });
      setSuccess(res.message);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 w-full"
    >
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Permintaan Reset Password</h1>
        <p className="text-gray-500 mt-1">Daftar staf yang lupa password dan butuh di-reset oleh Admin.</p>
      </motion.div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {success && !newPassInfo && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="text-sm font-medium">{success}</div>
        </div>
      )}

      {newPassInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-amber-800 font-bold mb-2">
                Password baru untuk {newPassInfo.nama} ({newPassInfo.username}):
              </h3>
              <div className="font-mono text-xl tracking-wider text-blue-700 font-bold bg-white px-4 py-2 rounded border border-amber-200 inline-block mb-3 select-all">
                {newPassInfo.password}
              </div>
              <p className="text-sm text-amber-700">
                Catat/sampaikan sekarang ke yang bersangkutan — password ini <strong>tidak akan ditampilkan lagi</strong> setelah halaman ini ditutup/refresh. Sarankan staff untuk login pakai password ini lalu ganti sendiri lewat menu <strong>"Ganti Password"</strong> di sidebar.
              </p>
            </div>
          </div>
        </div>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-800">Menunggu Diproses ({pending.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium">Username Diketik</th>
                  <th className="px-6 py-3 font-medium">Nama Akun</th>
                  <th className="px-6 py-3 font-medium">Catatan</th>
                  <th className="px-6 py-3 font-medium">Waktu Permintaan</th>
                  <th className="px-6 py-3 font-medium">IP</th>
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && pending.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                      <div className="flex justify-center mb-2">
                        <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      Memuat data...
                    </td>
                  </tr>
                ) : pending.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">Tidak ada permintaan yang menunggu.</td>
                  </tr>
                ) : (
                  pending.map((p, index) => (
                    <motion.tr 
                      key={p.id_request} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{p.username_input}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.nama_user ? (
                        <span className="text-gray-700">{p.nama_user}</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Username tidak ditemukan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.catatan ? (
                        <span className="text-gray-700 italic">"{p.catatan}"</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {dayjs(p.created_at).format('DD/MM/YYYY HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs font-mono whitespace-nowrap">{p.ip || '-'}</td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        {p.id_user && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleApprove(p.id_request, p.id_user)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Reset Password
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleIgnore(p.id_request)}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-colors shadow-sm"
                        >
                          Abaikan
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-800">Riwayat Diproses (20 terakhir)</h2>
          </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium">Username Diketik</th>
                <th className="px-6 py-3 font-medium">Nama Akun</th>
                <th className="px-6 py-3 font-medium">Diproses Oleh</th>
                <th className="px-6 py-3 font-medium text-right">Waktu Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && history.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-400">Memuat data...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-400">Belum ada riwayat.</td>
                </tr>
              ) : (
                history.map((h, index) => (
                  <motion.tr 
                    key={h.id_request} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-3 text-gray-900 whitespace-nowrap">{h.username_input}</td>
                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{h.nama_user || '-'}</td>
                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{h.nama_admin || '-'}</td>
                    <td className="px-6 py-3 text-gray-500 text-right whitespace-nowrap">
                      {h.resolved_at ? dayjs(h.resolved_at).format('DD/MM/YYYY HH:mm') : '-'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default ResetPermintaan;
