import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { rapatApi } from '../services/api';

const TVDisplay = () => {
  const [time, setTime] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch meetings and auto-refresh every 30 seconds
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await rapatApi.getTv();
        setMeetings(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchMeetings();
    const interval = setInterval(fetchMeetings, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':');
  };

  const formatJam = (t) => t ? t.substring(0, 5) : '';

  const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  const dayName = HARI[time.getDay()];
  const dateNum = time.getDate();
  const monthYear = `${BULAN[time.getMonth()]} ${time.getFullYear()}`;

  const activeMeetings = meetings.filter(m => m.status_computed !== 'selesai');

  return (
    <div className="h-screen w-full bg-[#EEF3F8] flex flex-col font-sans overflow-hidden text-[#0B2545]">
      {/* Header Area */}
      <div className="relative font-['Plus_Jakarta_Sans',_sans-serif] bg-gradient-to-br from-[#00305A] via-[#00509A] to-[#0072C6] rounded-b-[32px] p-6 pb-5 overflow-hidden shadow-[0_12px_30px_rgba(0,48,90,0.25)] flex-none">
        <div className="absolute w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_70%)] top-[-220px] right-[-80px] pointer-events-none"></div>
        <div className="absolute w-[260px] h-[260px] rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.22)_0%,rgba(245,166,35,0)_70%)] bottom-[-160px] left-[18%] pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="bg-white rounded-[20px] px-6 py-3 text-center shadow-[0_8px_20px_rgba(0,20,40,0.18)]">
              <div className="text-[#C97F00] text-[1rem] font-bold tracking-[2px] uppercase leading-none mb-1">{dayName}</div>
              <div className="text-[#00305A] text-[3.5rem] font-extrabold leading-[1]">{dateNum}</div>
              <div className="text-[#00509A] text-[1rem] font-bold leading-none mt-1">{monthYear}</div>
            </div>
            <div>
              <div className="text-white text-[2.125rem] font-extrabold tracking-[-0.5px] leading-tight">Jadwal Rapat — Kantor Wilayah PT. BRI (Persero), Tbk</div>
              <div className="text-[#BFE0FF] text-[1rem] mt-1 font-medium opacity-90">Kantor Wilayah PT. BRI (Persero), Tbk</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="text-white text-[3.5rem] font-black tabular-nums tracking-wider leading-none">{formatTime(time)}</div>
            <a href="/dashboard" className="inline-flex items-center gap-1.5 bg-white/10 border border-white/30 rounded-[1.5rem] px-4 py-1.5 text-white text-[0.8125rem] font-semibold backdrop-blur-sm hover:bg-white/20 transition-colors">
              &larr; Kembali ke Panel Admin
            </a>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 items-center mt-4 flex-wrap">
          <div className="flex items-center gap-2.5 bg-white/95 rounded-[1.5rem] px-5 py-1.5 shadow-sm">
            <div className="w-[0.625rem] h-[0.625rem] rounded-full bg-[#F5A623]"></div>
            <span className="text-[0.875rem] font-bold text-[#00305A]">Sedang Berlangsung</span>
          </div>
          <div className="flex items-center gap-2.5 bg-white/95 rounded-[1.5rem] px-5 py-1.5 shadow-sm">
            <div className="w-[0.625rem] h-[0.625rem] rounded-full bg-[#0072C6]"></div>
            <span className="text-[0.875rem] font-bold text-[#00305A]">Akan Datang</span>
          </div>
          <div className="ml-auto bg-white/15 border border-white/30 rounded-[1.5rem] px-5 py-1.5 text-[#E6F2FF] text-[0.875rem] font-medium backdrop-blur-sm shadow-sm">
            Menampilkan <span className="text-white font-extrabold text-[0.9375rem]">{activeMeetings.length}</span> rapat aktif hari ini
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 md:p-8 flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-[24fr_12fr_15fr_20fr_19fr_10fr] gap-[18px] px-[22px] mb-2">
          <span className="text-[#5D7A9C] text-[11px] font-bold tracking-[0.6px] uppercase">Topik Rapat</span>
          <span className="text-[#5D7A9C] text-[11px] font-bold tracking-[0.6px] uppercase">Waktu</span>
          <span className="text-[#5D7A9C] text-[11px] font-bold tracking-[0.6px] uppercase">Penyelenggara</span>
          <span className="text-[#5D7A9C] text-[11px] font-bold tracking-[0.6px] uppercase">Peserta</span>
          <span className="text-[#5D7A9C] text-[11px] font-bold tracking-[0.6px] uppercase">Lokasi / Info</span>
          <span className="text-[#5D7A9C] text-[11px] font-bold tracking-[0.6px] uppercase">Status</span>
        </div>

        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pb-4 custom-scrollbar pr-2">
          {loading && (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#0072C6] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {!loading && activeMeetings.map((meeting) => {
            const isLive = meeting.status_computed === 'berlangsung';
            const isFinished = meeting.status_computed === 'selesai';
            const durasi = (() => {
              const [h1,m1] = meeting.jam_mulai.split(':').map(Number);
              const [h2,m2] = meeting.jam_selesai.split(':').map(Number);
              return (h2*60+m2) - (h1*60+m1);
            })();

            return (
              <motion.div 
                key={meeting.id_rapat}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: isFinished ? 0.5 : 1, x: 0 }}
                className={`grid grid-cols-[24fr_12fr_15fr_20fr_19fr_10fr] gap-[18px] items-center rounded-2xl p-[16px_22px] shadow-[0_3px_10px_rgba(11,37,69,0.06)] border-l-[5px] transition-all ${
                  isLive 
                    ? 'bg-white border-l-[#F5A623] shadow-[0_6px_18px_rgba(245,166,35,0.18)]' 
                    : isFinished ? 'bg-gray-50 border-l-gray-300' : 'bg-white border-l-[#6FB6EA]'
                }`}
              >
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-bold text-[#0B2545] break-words">{meeting.topik}</span>
                  {isLive && (
                    <span className="inline-flex items-center gap-[5px] bg-[#2A1900] border border-[#ffc532] rounded-[20px] px-[9px] py-[2px] ml-1 align-middle">
                      <span className="w-[6px] h-[6px] rounded-full bg-[#ffc532] animate-pulse"></span>
                      <span className="text-[#ffc532] text-[10px] font-bold tracking-[0.5px] uppercase">LIVE</span>
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[#00509A] tabular-nums">{formatJam(meeting.jam_mulai)} - {formatJam(meeting.jam_selesai)}</div>
                  <div className="text-[#5D7A9C] text-[11px] mt-0.5">{durasi} menit</div>
                </div>
                <div className="min-w-0 text-[#0B2545] text-[13px] font-semibold break-words">{meeting.penyelenggara}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1">
                    {meeting.peserta_departemen && meeting.peserta_departemen.length > 0 ? (
                      meeting.peserta_departemen.map((dept, i) => (
                        <span key={i} className={`border px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                          isLive ? 'bg-[#FFF3DC] border-[#F3D391] text-[#C97F00]' : isFinished ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-[#E7F1FC] border-[#C9E2F7] text-[#00509A]'
                        }`}>
                          {dept}
                        </span>
                      ))
                    ) : (
                      <span className={`text-[11px] italic font-semibold ${isLive ? 'text-[#C97F00]' : isFinished ? 'text-gray-400' : 'text-[#00509A]'}`}>Umum</span>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  {meeting.jenis === 'Online' ? (
                    <>
                      {meeting.id_meeting && <div className="text-[12px] font-semibold text-[#0B2545]"><span className="text-[#5D7A9C] font-normal">ID: </span>{meeting.id_meeting}</div>}
                      {meeting.sandi && <div className="text-[12px] font-semibold text-[#0B2545]"><span className="text-[#5D7A9C] font-normal">Sandi: </span>{meeting.sandi}</div>}
                    </>
                  ) : (
                    <div className={`text-[13px] font-bold ${isLive ? 'text-[#C97F00]' : 'text-[#00509A]'}`}>{meeting.ruangan || '-'}</div>
                  )}
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold ${
                    isLive ? 'bg-[#FFF3DC] text-[#C97F00]' : isFinished ? 'bg-gray-100 text-gray-500' : 'bg-[#E7F1FC] text-[#00509A]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#C97F00]' : isFinished ? 'bg-gray-400' : 'bg-[#00509A]'}`}></span>
                    {isLive ? 'Berlangsung' : isFinished ? 'Selesai' : 'Akan Datang'}
                  </span>
                </div>
              </motion.div>
            );
          })}

          {!loading && meetings.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-12 text-[#5D7A9C] text-[16px] font-semibold">
              Tidak ada rapat hari ini
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVDisplay;
