import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { rapatApi } from '../services/api';
import EditMeetingModal from './EditMeetingModal';

const MeetingDetailPanel = ({ isOpen, onClose, meeting, onUpdate }) => {
  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // Prevent scrolling when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (meeting?.id_rapat) {
        fetchDetail(meeting.id_rapat);
      }
    } else {
      document.body.style.overflow = 'unset';
      // Don't nullify detail immediately to allow exit animation
      setTimeout(() => setDetail(null), 300);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, meeting]);

  const fetchDetail = async (id) => {
    setLoading(true);
    try {
      const data = await rapatApi.getById(id);
      setDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      alert('Tersalin: ' + text);
    }
  };

  const formatJam = (t) => t ? t.substring(0, 5) : '';
  const formatTgl = (d) => d ? new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const data = detail || meeting; // Use fetched detail if available, else fallback to list view data

  // Status computation
  const status = data?.status_computed || 'akan_datang';
  const statusColor = status === 'berlangsung' ? 'text-orange-700 bg-orange-100' : status === 'selesai' ? 'text-gray-600 bg-gray-100' : 'text-blue-700 bg-blue-100';
  const statusText = status === 'berlangsung' ? 'Berlangsung' : status === 'selesai' ? 'Selesai' : 'Akan Datang';

  const isOnline = data?.jenis === 'Online';
  
  // Parse peserta correctly from detail.departemen_peserta
  const pesertaArray = detail?.departemen_peserta || [];

  return (
    <>
    <AnimatePresence>
      {isOpen && data && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[500px] h-full bg-surface-bg border-l border-border-subtle shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Panel Header */}
            <div className="px-6 py-5 border-b border-border-subtle flex justify-between items-start bg-white sticky top-0 z-10">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${statusColor}`}>
                    {statusText}
                  </span>
                  {isOnline ? (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[14px]">videocam</span> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[14px]">location_on</span> Offline
                    </span>
                  )}
                </div>
                <h2 className="text-[20px] font-bold text-on-surface leading-snug">{data.topik}</h2>
              </div>
              <button 
                className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95 flex-shrink-0"
                onClick={onClose}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Panel Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-surface-bg">
              {loading && !detail ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {/* Section 1: Basic Info */}
                  <section>
                    <h3 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Informasi Dasar</h3>
                    <div className="bg-white rounded-xl p-5 border border-border-subtle grid grid-cols-1 gap-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary">calendar_today</span>
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-on-surface-variant mb-0.5">Tanggal</p>
                          <p className="text-[14px] font-bold text-on-surface">{formatTgl(data.tanggal)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary">schedule</span>
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-on-surface-variant mb-0.5">Waktu</p>
                          <p className="text-[14px] font-bold text-on-surface">{formatJam(data.jam_mulai)} - {formatJam(data.jam_selesai)} WIB</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary">business</span>
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-on-surface-variant mb-0.5">Penyelenggara</p>
                          <p className="text-[14px] font-bold text-on-surface">{data.penyelenggara}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Section 2: Meeting Type Details */}
                  <section>
                    <h3 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Detail Lokasi</h3>
                    <div className="bg-white rounded-xl p-5 border border-border-subtle flex flex-col gap-4 shadow-sm">
                      {isOnline ? (
                        <>
                          {data.id_meeting && (
                            <div className="flex items-center justify-between group">
                              <div>
                                <p className="text-[12px] font-semibold text-on-surface-variant mb-0.5">Meeting ID</p>
                                <p className="text-[15px] font-bold text-on-surface font-mono tracking-wide">{data.id_meeting}</p>
                              </div>
                              <button onClick={() => copyToClipboard(data.id_meeting)} className="p-2 rounded hover:bg-surface-container-high text-primary opacity-0 group-hover:opacity-100 transition-opacity active:scale-95" title="Copy ID">
                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                              </button>
                            </div>
                          )}
                          {data.sandi && (
                            <div className="flex items-center justify-between group">
                              <div>
                                <p className="text-[12px] font-semibold text-on-surface-variant mb-0.5">Sandi / Password</p>
                                <p className="text-[15px] font-bold text-on-surface font-mono tracking-wide">{data.sandi}</p>
                              </div>
                              <button onClick={() => copyToClipboard(data.sandi)} className="p-2 rounded hover:bg-surface-container-high text-primary opacity-0 group-hover:opacity-100 transition-opacity active:scale-95" title="Copy Password">
                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                              </button>
                            </div>
                          )}
                          {data.link_rapat && (
                            <a 
                              href={data.link_rapat.startsWith('http') ? data.link_rapat : `https://${data.link_rapat}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white font-bold text-[14px] rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                              Buka Link Rapat
                            </a>
                          )}
                          {!data.id_meeting && !data.sandi && !data.link_rapat && (
                            <div className="text-[13px] text-on-surface-variant italic">Informasi meeting belum lengkap</div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[24px]">meeting_room</span>
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-on-surface-variant mb-0.5">Ruangan</p>
                            <p className="text-[16px] font-bold text-on-surface">{data.ruangan || '-'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Section 3: Participants */}
                  <section>
                    <div className="flex justify-between items-end mb-3">
                      <h3 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Departemen yang Diundang</h3>
                      <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                        {pesertaArray.length} Departemen
                      </span>
                    </div>
                    <div className="bg-white rounded-xl border border-border-subtle shadow-sm overflow-hidden divide-y divide-border-subtle">
                      {pesertaArray.length > 0 ? (
                        pesertaArray.map((dept) => (
                          <div key={dept.id_departemen} className="p-4 flex items-center gap-3 hover:bg-surface-container-lowest transition-colors">
                            <div className="min-w-[32px] h-8 px-2 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-[12px]">
                              {dept.kode_departemen || 'DEPT'}
                            </div>
                            <div className="flex-1">
                              <p className="text-[14px] font-bold text-on-surface">{dept.nama_departemen}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-[13px] text-on-surface-variant">
                          {loading ? 'Memuat data...' : 'Tidak ada departemen peserta'}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
              
              {/* Spacer for bottom padding */}
              <div className="pb-8"></div>
            </div>

            {/* Panel Footer / Actions */}
            <div className="p-4 border-t border-border-subtle bg-white sticky bottom-0 flex justify-end gap-3 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              <button 
                className="px-5 py-2.5 border border-border-subtle text-on-surface-variant font-bold text-[13px] rounded-lg hover:bg-surface-container-lowest transition-colors active:scale-95 bg-white"
                onClick={onClose}
              >
                Tutup
              </button>
              {user?.role === 'admin' && (
                <button 
                  className="px-5 py-2.5 bg-primary text-white font-bold text-[13px] rounded-lg shadow-sm hover:bg-primary/90 transition-colors active:scale-95 flex items-center gap-2"
                  onClick={() => setIsEditOpen(true)}
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit Jadwal
                </button>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
    <EditMeetingModal 
      isOpen={isEditOpen} 
      onClose={() => setIsEditOpen(false)} 
      meeting={data} 
      onUpdate={() => {
        if (onUpdate) onUpdate();
        // optionally refresh local detail data
        if (meeting?.id_rapat) fetchDetail(meeting.id_rapat);
      }} 
    />
    </>
  );
};

export default MeetingDetailPanel;
