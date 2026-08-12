import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rapatApi, departemenApi } from '../services/api';

const EditMeetingModal = ({ isOpen, onClose, meeting, onUpdate }) => {
  const [jenis, setJenis] = useState('');
  const [depts, setDepts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    tanggal: '',
    jam_mulai: '', jam_selesai: '', topik: '', id_departemen: '',
    id_meeting: '', sandi: '', link_rapat: '', ruangan: '', peserta: []
  });

  useEffect(() => {
    departemenApi.getAll().then(setDepts).catch(console.error);
  }, []);

  useEffect(() => {
    if (isOpen && meeting) {
      setJenis(meeting.jenis || 'Offline');
      
      // format date to YYYY-MM-DD using local time to avoid timezone shift
      let dateStr = '';
      if (meeting.tanggal) {
        const d = new Date(meeting.tanggal);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      } else {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }

      setForm({
        tanggal: dateStr,
        jam_mulai: meeting.jam_mulai ? meeting.jam_mulai.substring(0, 5) : '', // 'HH:mm:ss' to 'HH:mm'
        jam_selesai: meeting.jam_selesai ? meeting.jam_selesai.substring(0, 5) : '',
        topik: meeting.topik || '',
        id_departemen: meeting.id_departemen || '',
        id_meeting: meeting.id_meeting || '',
        sandi: meeting.sandi || '',
        link_rapat: meeting.link_rapat || '',
        ruangan: meeting.ruangan || '',
        // Handle peserta formatting if needed
        peserta: meeting.departemen_peserta ? meeting.departemen_peserta.map(d => d.id_departemen) : []
      });
    }
  }, [isOpen, meeting]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePeserta = (id) => {
    setForm(prev => ({
      ...prev,
      peserta: prev.peserta.includes(id) ? prev.peserta.filter(p => p !== id) : [...prev.peserta, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await rapatApi.update(meeting.id_rapat, { ...form, jenis });
      alert('Jadwal rapat berhasil diubah!');
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-surface-bg rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        >
          <div className="px-6 py-5 border-b border-border-subtle bg-white flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-[18px] font-bold text-on-surface">Edit Jadwal Rapat</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface transition-colors active:scale-95">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="overflow-y-auto p-6 bg-white flex-1">
            <form id="edit-meeting-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-bold text-on-surface mb-2">Tanggal *</label>
                  <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} required className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-on-surface mb-2">Penyelenggara *</label>
                  <select name="id_departemen" value={form.id_departemen} onChange={handleChange} required className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest">
                    <option value="">— Pilih Departemen —</option>
                    {depts.map(d => <option key={d.id_departemen} value={d.id_departemen}>{d.nama_departemen}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-bold text-on-surface mb-2">Jam Mulai *</label>
                  <input type="time" name="jam_mulai" value={form.jam_mulai} onChange={handleChange} required className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-on-surface mb-2">Jam Selesai *</label>
                  <input type="time" name="jam_selesai" value={form.jam_selesai} onChange={handleChange} required className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-on-surface mb-2">Topik Rapat *</label>
                <input type="text" name="topik" value={form.topik} onChange={handleChange} required placeholder="Contoh: Rapat Koordinasi Bulanan" className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-on-surface mb-2">Jenis Rapat *</label>
                <select value={jenis} onChange={(e) => setJenis(e.target.value)} required className="w-full border border-border-subtle rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-surface-container-lowest">
                  <option value="">— Pilih Jenis —</option>
                  <option value="Online">Online (Zoom Meeting / Teams)</option>
                  <option value="Offline">Offline (Tatap Muka)</option>
                </select>
              </div>

              {jenis === 'Online' && (
                <div className="space-y-6 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-[13px] font-bold text-on-surface mb-2">Link Rapat</label>
                    <input type="text" name="link_rapat" value={form.link_rapat} onChange={handleChange} placeholder="Contoh: https://zoom.us/j/123456" className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[13px] font-bold text-on-surface mb-2">ID Meeting</label>
                      <input type="text" name="id_meeting" value={form.id_meeting} onChange={handleChange} placeholder="Contoh: 852 1304 7190" className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-on-surface mb-2">Sandi (Passcode)</label>
                      <input type="text" name="sandi" value={form.sandi} onChange={handleChange} placeholder="Contoh: 123456" className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" />
                    </div>
                  </div>
                </div>
              )}

              {jenis === 'Offline' && (
                <div className="p-5 bg-orange-50/50 rounded-xl border border-orange-100">
                  <label className="block text-[13px] font-bold text-on-surface mb-2">Ruangan</label>
                  <input type="text" name="ruangan" value={form.ruangan} onChange={handleChange} placeholder="Contoh: Ruang Rapat Pimpinan" className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-white" />
                </div>
              )}

              <div>
                <label className="block text-[13px] font-bold text-on-surface mb-3">Peserta yang Diundang</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {depts.map(d => {
                    const isSelected = form.peserta.includes(d.id_departemen);
                    return (
                      <label 
                        key={d.id_departemen} 
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-border-subtle hover:bg-surface-container-lowest'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          checked={isSelected}
                          onChange={() => handlePeserta(d.id_departemen)}
                        />
                        <span className={`ml-3 text-[14px] font-medium ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                          {d.nama_departemen}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>
          
          <div className="px-6 py-4 border-t border-border-subtle bg-surface-container-lowest flex justify-end gap-3 z-10">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={submitting}
              className="px-5 py-2.5 border border-border-subtle text-on-surface-variant font-bold text-[13px] rounded-lg hover:bg-white hover:text-on-surface transition-colors active:scale-95 disabled:opacity-60"
            >
              Batal
            </button>
            <button 
              type="submit" 
              form="edit-meeting-form"
              disabled={submitting}
              className="bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-[13px] hover:bg-primary/90 transition-colors shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditMeetingModal;
