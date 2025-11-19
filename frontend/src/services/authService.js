import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  // Kayıt işlemi
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // Network hatası kontrolü
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || !error.response) {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor. Lütfen backend\'in çalıştığından emin olun. (http://localhost:3000)',
        };
      }
      // Detaylı hata mesajı
      const errorMessage = error.response?.data?.message || error.message || 'Kayıt işlemi başarısız oldu';
      console.error('Register error:', error.response?.data || error.message);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Giriş işlemi
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // Network hatası kontrolü
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor. Lütfen backend\'in çalıştığından emin olun.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Giriş işlemi başarısız oldu',
      };
    }
  },

  // Profil ayarlarını kaydet
  saveProfileSettings: async (userId, profileData) => {
    try {
      const response = await api.post('/profile/save-settings', {
        userId,
        profileData,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // Network hatası kontrolü
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor. Lütfen backend\'in çalıştığından emin olun.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Profil kaydetme işlemi başarısız oldu',
      };
    }
  },

  // ADMIN - Tüm kullanıcıları getir
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Kullanıcılar getirilemedi',
      };
    }
  },

  // ADMIN - Kullanıcı sil
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Kullanıcı silinemedi',
      };
    }
  },

  // ADMIN - Kullanıcı güncelle
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Kullanıcı güncellenemedi',
      };
    }
  },

  // Kullanıcı profilini getir (kullanıcı bilgileri + profil verileri)
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/profile/${userId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // Network hatası kontrolü
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Profil getirilemedi',
      };
    }
  },

  // Kullanıcı hesabını kalıcı olarak sil
  deleteAccount: async (userId) => {
    try {
      const response = await api.delete(`/profile/delete-account/${userId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // Network hatası kontrolü
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Hesap silinemedi',
      };
    }
  },
};

export default authService;

