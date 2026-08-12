import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const Profil = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    password_lama: '',
    password_baru: '',
    konfirmasi: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await authApi.changePassword(
        formData.password_lama,
        formData.password_baru,
        formData.konfirmasi
      );
      setSuccess(res.message);
      setFormData({
        password_lama: '',
        password_baru: '',
        konfirmasi: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[800px] w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola akun Anda dan ubah password sendiri</p>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 flex items-start gap-3 mb-6">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="text-sm font-medium">{success}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start gap-3 mb-6">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">{error}</div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Informasi Akun</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
            <div className="text-gray-900 font-medium">{user?.nama || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Username</label>
            <div className="text-gray-900">{user?.username || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Role</label>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {user?.role || '-'}
            </div>
          </div>
          {user?.departemen && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Departemen</label>
              <div className="text-gray-900">{user?.departemen}</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Ubah Password</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-[400px]">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password_lama">
                Password Lama
              </label>
              <input
                type="password"
                id="password_lama"
                name="password_lama"
                required
                value={formData.password_lama}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password_baru">
                Password Baru
              </label>
              <input
                type="password"
                id="password_baru"
                name="password_baru"
                required
                placeholder="Minimal 6 karakter"
                value={formData.password_baru}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="konfirmasi">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                id="konfirmasi"
                name="konfirmasi"
                required
                value={formData.konfirmasi}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profil;
