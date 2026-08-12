import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';

const LupaPassword = () => {
  const [username, setUsername] = useState('');
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const res = await authApi.resetRequest(username, catatan);
      setSuccess(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1929] font-sans p-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-[380px] text-center"
      >
        <div className="text-[#4a7ab5] text-[12px] tracking-[1.5px] uppercase mb-6 font-semibold">
          Sistem Informasi
        </div>

        <div className="bg-[#0f2035] border border-[#1e3a5f] rounded-[14px] p-8 text-left shadow-2xl">
          <div className="text-[#ffc532] text-[18px] font-semibold text-center mb-1">
            Lupa Password
          </div>
          <div className="text-[#4a7ab5] text-[11px] text-center mb-7 leading-relaxed">
            Ajukan permintaan reset password ke admin sistem
          </div>

          <hr className="border-t border-[#1e3a5f] border-x-0 border-b-0 mb-6" />

          {success ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-[#0a2d16] border border-[#2d8a4e] text-[#8fd6a8] rounded-lg px-3.5 py-3 text-[13px] mb-5 leading-relaxed">
                {success}
              </div>
              <Link to="/login">
                <button 
                  type="button"
                  className="w-full bg-[#ffc532] hover:bg-[#e6b020] text-[#0b1929] font-bold py-[11px] rounded-lg text-[14px] tracking-[0.3px] transition-colors"
                >
                  Kembali ke Login
                </button>
              </Link>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#2d0a0a] border border-[#a32d2d] text-[#f09595] rounded-lg px-3.5 py-2.5 text-[13px] mb-5"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[#7ea8d8] text-[12px] font-medium mb-1.5" htmlFor="username">
                    Username
                  </label>
                  <input 
                    type="text"
                    id="username"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username kamu"
                    className="w-full bg-[#0b1929] border border-[#1e3a5f] text-white rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-[#378add] transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-[#7ea8d8] text-[12px] font-medium mb-1.5" htmlFor="catatan">
                    Catatan (opsional)
                  </label>
                  <textarea 
                    id="catatan"
                    rows="3"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: lupa password sejak ganti laptop"
                    className="w-full bg-[#0b1929] border border-[#1e3a5f] text-white rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-[#378add] transition-colors" 
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-[#ffc532] hover:bg-[#e6b020] disabled:opacity-60 text-[#0b1929] font-bold py-[11px] rounded-lg text-[14px] tracking-[0.3px] transition-colors"
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Permintaan Reset'}
                </button>
              </form>

              <div className="text-center mt-5 text-[12px]">
                <Link to="/login" className="text-[#5a8fc4] hover:text-[#7ea8d8] hover:underline transition-colors">
                  &larr; Kembali ke Login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LupaPassword;
