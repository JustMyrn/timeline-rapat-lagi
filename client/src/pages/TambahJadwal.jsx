import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { rapatApi, departemenApi } from '../services/api';

const TambahJadwal = () => {
  const navigate = useNavigate();
  const [jenis, setJenis] = useState('');
  const [depts, setDepts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: '', jam_selesai: '', topik: '', id_departemen: '',
    id_meeting: '', sandi: '', link_rapat: '', ruangan: '', peserta: []
  });

  useEffect(() => {
    departemenApi.getAll().then(setDepts).catch(console.error);
  }, []);

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

  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await rapatApi.create({ ...form, jenis });
      alert('Jadwal rapat berhasil ditambahkan!');
      navigate('/cari-rapat');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Tanggal': '2026-08-20',
        'Jam Mulai': '09:00',
        'Jam Selesai': '11:00',
        'Topik': 'Rapat Evaluasi Tahunan',
        'Jenis': 'Online',
        'Kode Departemen Penyelenggara': 'ITE',
        'Peserta': 'ITE, KEU, UMK',
        'Ruangan': '',
        'ID Meeting': '123456',
        'Sandi': '123',
        'Link Rapat': 'https://meet.google.com/abc-defg-hij'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Jadwal");
    XLSX.writeFile(wb, "Template_Import_Jadwal.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSubmitting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      
      const meetings = json.map(row => {
        // Find Penyelenggara ID by Kode Departemen
        const orgKode = (row['Kode Departemen Penyelenggara'] || '').toString().trim().toLowerCase();
        const deptPenyelenggara = depts.find(d => d.kode_departemen.toLowerCase() === orgKode) || depts[0];

        // Find Peserta IDs by Kode Departemen
        const pesNameStr = (row['Peserta'] || '').toString();
        const pesertaIds = pesNameStr.split(',').map(kode => {
          const matched = depts.find(d => d.kode_departemen.toLowerCase() === kode.trim().toLowerCase());
          return matched ? matched.id_departemen : null;
        }).filter(Boolean);

        const isOnline = (row['Jenis'] || '').toString().trim().toLowerCase() === 'online';

        // Parse excel date (if it's a number, convert to date string YYYY-MM-DD)
        let rawDate = row['Tanggal'];
        let dateStr = '';
        if (typeof rawDate === 'number') {
          const jsDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
          dateStr = jsDate.toISOString().split('T')[0];
        } else {
          dateStr = rawDate || '';
        }

        // Format time strings (handling decimals from excel)
        const formatTime = (t) => {
          if (typeof t === 'number') {
            const totalMinutes = Math.round(t * 24 * 60);
            const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
            const m = (totalMinutes % 60).toString().padStart(2, '0');
            return `${h}:${m}`;
          }
          return t ? t.toString() : '';
        };

        return {
          topik: row['Topik'] || '',
          tanggal: dateStr,
          jam_mulai: formatTime(row['Jam Mulai']),
          jam_selesai: formatTime(row['Jam Selesai']),
          jenis: isOnline ? 'Online' : 'Offline',
          id_departemen: deptPenyelenggara ? deptPenyelenggara.id_departemen : null,
          peserta: pesertaIds,
          ruangan: isOnline ? '' : (row['Ruangan'] || ''),
          link_rapat: isOnline ? (row['Link Rapat'] || '') : '',
          id_meeting: isOnline ? (row['ID Meeting'] || '') : '',
          sandi: isOnline ? (row['Sandi'] || '') : ''
        };
      });

      if (meetings.length === 0) throw new Error('Data Excel kosong atau format salah.');

      const res = await rapatApi.createBulk({ meetings });
      alert(res.message || `Berhasil import ${meetings.length} jadwal rapat!`);
      navigate('/cari-rapat');
    } catch (err) {
      alert('Gagal import: ' + err.message);
    } finally {
      setSubmitting(false);
      e.target.value = null; // reset
    }
  };

  return (
    <main className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 bg-surface-bg text-on-surface">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h2 className="text-[24px] font-bold text-primary tracking-tight">Tambah Jadwal Rapat</h2>
            <div className="text-[14px] text-on-surface-variant mt-1">Isi form di bawah untuk menambahkan jadwal rapat baru</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleDownloadTemplate} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-[13px] transition-colors shadow-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">download</span> Template
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-[13px] transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-60">
              <span className="material-symbols-outlined text-[16px]">upload_file</span> Import Excel
            </button>
            <input type="file" ref={fileRef} accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
            <button onClick={() => navigate('/cari-rapat')} className="bg-white border border-border-subtle hover:bg-surface-container-lowest text-on-surface-variant px-4 py-2 rounded-lg font-semibold text-[13px] transition-colors shadow-sm flex items-center gap-1.5">
              &larr; Batal
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-border-subtle">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <AnimatePresence mode="wait">
              {jenis === 'Online' && (
                <motion.div key="online" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden bg-blue-50/50 border border-blue-100 p-5 rounded-lg space-y-4">
                  <div className="font-bold text-[14px] text-blue-900 mb-2 border-b border-blue-200 pb-2">Detail Rapat Online</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[13px] font-semibold text-blue-900 mb-2">Meeting ID</label>
                      <input type="text" name="id_meeting" value={form.id_meeting} onChange={handleChange} placeholder="Contoh: 8521 3047 19" className="w-full border border-blue-200 rounded-lg px-4 py-2 text-[14px] focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-blue-900 mb-2">Sandi / Password</label>
                      <input type="text" name="sandi" value={form.sandi} onChange={handleChange} placeholder="Contoh: Rapat2026" className="w-full border border-blue-200 rounded-lg px-4 py-2 text-[14px] focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-blue-900 mb-2">Link Rapat</label>
                    <input type="url" name="link_rapat" value={form.link_rapat} onChange={handleChange} placeholder="Contoh: https://zoom.us/j/1234567890" className="w-full border border-blue-200 rounded-lg px-4 py-2 text-[14px] focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </motion.div>
              )}
              {jenis === 'Offline' && (
                <motion.div key="offline" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden bg-orange-50/50 border border-orange-100 p-5 rounded-lg">
                  <div className="font-bold text-[14px] text-orange-900 mb-4 border-b border-orange-200 pb-2">Detail Rapat Offline</div>
                  <div>
                    <label className="block text-[13px] font-semibold text-orange-900 mb-2">Nama Ruangan</label>
                    <input type="text" name="ruangan" value={form.ruangan} onChange={handleChange} placeholder="Contoh: Pahawang Room" className="w-full border border-orange-200 rounded-lg px-4 py-2 text-[14px] focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[13px] font-bold text-on-surface mb-3">Peserta (Departemen yang Diundang)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {depts.map(d => (
                  <label key={d.id_departemen} className="flex items-center gap-3 p-3 border border-border-subtle rounded-lg cursor-pointer hover:bg-surface-container-lowest transition-colors">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary" checked={form.peserta.includes(d.id_departemen)} onChange={() => handlePeserta(d.id_departemen)} />
                    <span className="text-[13px] font-medium text-on-surface-variant">{d.nama_departemen}</span>
                  </label>
                ))}
              </div>
              <div className="text-[12px] text-on-surface-variant mt-3 italic">Centang semua departemen yang diundang dalam rapat ini</div>
            </div>

            <div className="pt-6 border-t border-border-subtle flex gap-3">
              <button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-bold text-[14px] transition-colors shadow-sm">
                {submitting ? 'Menyimpan...' : 'Simpan Jadwal'}
              </button>
              <button type="button" onClick={() => navigate('/cari-rapat')} className="bg-white border border-border-subtle hover:bg-surface-container-lowest text-on-surface-variant px-6 py-2.5 rounded-lg font-bold text-[14px] transition-colors shadow-sm">Batal</button>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  );
};

export default TambahJadwal;
