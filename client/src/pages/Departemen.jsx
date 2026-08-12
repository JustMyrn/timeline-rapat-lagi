import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { departemenApi } from '../services/api';

const Departemen = () => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: null, nama: '', kode: '' });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDepts = async () => {
    try {
      const data = await departemenApi.getAll();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await departemenApi.update(formData.id, { nama_departemen: formData.nama, kode_departemen: formData.kode });
      } else {
        await departemenApi.create({ nama_departemen: formData.nama, kode_departemen: formData.kode });
      }
      setFormData({ id: null, nama: '', kode: '' });
      setEditMode(false);
      fetchDepts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (dept) => {
    setEditMode(true);
    setFormData({ id: dept.id_departemen, nama: dept.nama_departemen, kode: dept.kode_departemen });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData({ id: null, nama: '', kode: '' });
  };

  const handleDelete = async (dept) => {
    if (dept.total_rapat > 0) return;
    if (!window.confirm(`Hapus departemen ${dept.nama_departemen}?`)) return;
    try {
      await departemenApi.delete(dept.id_departemen);
      fetchDepts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <main className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 bg-surface-bg text-on-surface">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
          <h2 className="text-[24px] font-bold text-primary tracking-tight">Kelola Departemen</h2>
          <div className="text-[14px] text-on-surface-variant mt-1">Tambah, edit, atau hapus daftar departemen</div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
            {editMode && (
              <div className="bg-blue-50/50 text-blue-800 text-[13px] px-5 py-3 border-b border-blue-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Mode edit: <strong>{formData.nama}</strong>
              </div>
            )}
            <div className="p-5 border-b border-border-subtle bg-surface-container-lowest">
              <h3 className="text-[16px] font-bold text-on-surface">{editMode ? 'Edit Departemen' : 'Tambah Departemen'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-on-surface mb-2">Nama Departemen *</label>
                <input type="text" required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} placeholder="Contoh: Departemen ITE" className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-on-surface mb-2">Kode Departemen *</label>
                <input type="text" required maxLength="20" value={formData.kode} onChange={(e) => setFormData({...formData, kode: e.target.value.toUpperCase()})} placeholder="Contoh: ITE" className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest uppercase" />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-[13px] transition-colors shadow-sm flex-1">{editMode ? 'Simpan Perubahan' : 'Tambah'}</button>
                {editMode && <button type="button" onClick={handleCancelEdit} className="bg-white border border-border-subtle hover:bg-surface-container-lowest text-on-surface-variant px-4 py-2.5 rounded-lg font-bold text-[13px] transition-colors shadow-sm">Batal</button>}
              </div>
            </form>
          </motion.div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
            <div className="p-5 border-b border-border-subtle bg-surface-container-lowest">
              <h3 className="text-[16px] font-bold text-on-surface">Daftar Departemen ({departments.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-border-subtle text-[12px] uppercase tracking-wider text-on-surface-variant">
                    <th className="px-5 py-3.5 font-bold w-24">Kode</th>
                    <th className="px-5 py-3.5 font-bold">Nama Departemen</th>
                    <th className="px-5 py-3.5 font-bold text-center w-32">Total Rapat</th>
                    <th className="px-5 py-3.5 font-bold text-right w-40">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {departments.map((dept) => (
                    <tr key={dept.id_departemen} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-5 py-3"><span className="inline-flex bg-surface-container-high border border-border-subtle px-2 py-1 rounded text-[11px] font-bold text-primary tracking-wider">{dept.kode_departemen}</span></td>
                      <td className="px-5 py-3 text-[14px] font-semibold text-on-surface">{dept.nama_departemen}</td>
                      <td className="px-5 py-3 text-center"><span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold ${dept.total_rapat > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>{dept.total_rapat}</span></td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(dept)} className="bg-white border border-border-subtle text-on-surface-variant hover:text-primary hover:border-primary px-3 py-1.5 rounded text-[12px] font-semibold transition-all shadow-sm">Edit</button>
                          <button onClick={() => handleDelete(dept)} disabled={dept.total_rapat > 0} title={dept.total_rapat > 0 ? `Tidak dapat dihapus (${dept.total_rapat} rapat)` : 'Hapus'} className={`px-3 py-1.5 rounded text-[12px] font-semibold transition-all shadow-sm border ${dept.total_rapat > 0 ? 'bg-surface-container-highest border-border-subtle text-on-surface-variant/50 cursor-not-allowed opacity-60' : 'bg-white border-error-container text-status-active hover:bg-error-container'}`}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && departments.length === 0 && <tr><td colSpan="4" className="px-5 py-8 text-center text-on-surface-variant text-[14px]">Belum ada departemen</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default Departemen;
