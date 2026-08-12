import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userApi, departemenApi } from '../services/api';

const KelolaUser = () => {
  const { user: currentUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: null, nama: '', username: '', password: '', role: 'staff', id_departemen: '' });
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [usersData, deptsData] = await Promise.all([userApi.getAll(), departemenApi.getAll()]);
      setUsers(usersData);
      setDepts(deptsData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await userApi.update(formData.id, { nama: formData.nama, username: formData.username, password: formData.password || undefined, role: formData.role, id_departemen: formData.id_departemen || null });
      } else {
        await userApi.create({ nama: formData.nama, username: formData.username, password: formData.password, role: formData.role, id_departemen: formData.id_departemen || null });
      }
      setFormData({ id: null, nama: '', username: '', password: '', role: 'staff', id_departemen: '' });
      setEditMode(false);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleEdit = (u) => {
    setEditMode(true);
    setFormData({ id: u.id_user, nama: u.nama, username: u.username, password: '', role: u.role, id_departemen: u.id_departemen || '' });
  };

  const handleCancelEdit = () => { setEditMode(false); setFormData({ id: null, nama: '', username: '', password: '', role: 'staff', id_departemen: '' }); };

  const handleDelete = async (u) => {
    if (u.id_user === currentUser?.id_user) return;
    if (!window.confirm(`Hapus user ${u.username}?`)) return;
    try { await userApi.delete(u.id_user); fetchData(); }
    catch (err) { alert(err.message); }
  };

  return (
    <main className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 bg-surface-bg text-on-surface">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
          <h2 className="text-[24px] font-bold text-primary tracking-tight">Kelola User</h2>
          <div className="text-[14px] text-on-surface-variant mt-1">Tambah, edit, atau hapus akun pengguna sistem</div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
            {editMode && <div className="bg-blue-50/50 text-blue-800 text-[13px] px-5 py-3 border-b border-blue-100 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">info</span>Mode edit: <strong>{formData.nama}</strong></div>}
            <div className="p-5 border-b border-border-subtle bg-surface-container-lowest"><h3 className="text-[16px] font-bold text-on-surface">{editMode ? 'Edit User' : 'Tambah User'}</h3></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div><label className="block text-[13px] font-bold text-on-surface mb-2">Nama Lengkap *</label><input type="text" required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} placeholder="Contoh: Administrator" className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest" /></div>
              <div><label className="block text-[13px] font-bold text-on-surface mb-2">Username *</label><input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="Contoh: admin" className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest" /></div>
              <div><label className="block text-[13px] font-bold text-on-surface mb-2">Password {editMode ? <span className="font-normal text-on-surface-variant">(kosongkan jika tidak diubah)</span> : '*'}</label><input type="password" required={!editMode} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Minimal 6 karakter" className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest" /></div>
              <div><label className="block text-[13px] font-bold text-on-surface mb-2">Role *</label><select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest"><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
              <div><label className="block text-[13px] font-bold text-on-surface mb-2">Departemen</label><select value={formData.id_departemen} onChange={(e) => setFormData({...formData, id_departemen: e.target.value})} className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest"><option value="">— Tidak Terikat Departemen —</option>{depts.map(d => <option key={d.id_departemen} value={d.id_departemen}>{d.nama_departemen}</option>)}</select></div>
              <div className="pt-2 flex gap-2">
                <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-[13px] transition-colors shadow-sm flex-1">{editMode ? 'Simpan Perubahan' : 'Tambah User'}</button>
                {editMode && <button type="button" onClick={handleCancelEdit} className="bg-white border border-border-subtle hover:bg-surface-container-lowest text-on-surface-variant px-4 py-2.5 rounded-lg font-bold text-[13px] transition-colors shadow-sm">Batal</button>}
              </div>
            </form>
          </motion.div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
            <div className="p-5 border-b border-border-subtle bg-surface-container-lowest"><h3 className="text-[16px] font-bold text-on-surface">Daftar User ({users.length})</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-surface-container-lowest border-b border-border-subtle text-[12px] uppercase tracking-wider text-on-surface-variant"><th className="px-5 py-3.5 font-bold">Nama</th><th className="px-5 py-3.5 font-bold">Username</th><th className="px-5 py-3.5 font-bold">Role</th><th className="px-5 py-3.5 font-bold">Departemen</th><th className="px-5 py-3.5 font-bold text-right w-32">Aksi</th></tr></thead>
                <tbody className="divide-y divide-border-subtle">
                  {users.map((u) => (
                    <tr key={u.id_user} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-5 py-3 text-[14px] font-semibold text-on-surface whitespace-nowrap">{u.nama}</td>
                      <td className="px-5 py-3 text-[13px] text-on-surface-variant whitespace-nowrap">{u.username}</td>
                      <td className="px-5 py-3 whitespace-nowrap"><span className={`inline-flex px-2 py-1 rounded text-[11px] font-bold tracking-wider uppercase border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{u.role}</span></td>
                      <td className="px-5 py-3 text-[13px] text-on-surface-variant whitespace-nowrap">{u.nama_departemen || '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(u)} className="bg-white border border-border-subtle text-on-surface-variant hover:text-primary hover:border-primary px-3 py-1.5 rounded text-[12px] font-semibold transition-all shadow-sm">Edit</button>
                          {u.id_user !== currentUser?.id_user && <button onClick={() => handleDelete(u)} className="bg-white border border-error-container text-status-active hover:bg-error-container px-3 py-1.5 rounded text-[12px] font-semibold transition-all shadow-sm">Hapus</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && users.length === 0 && <tr><td colSpan="5" className="px-5 py-8 text-center text-on-surface-variant text-[14px]">Belum ada user</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default KelolaUser;
