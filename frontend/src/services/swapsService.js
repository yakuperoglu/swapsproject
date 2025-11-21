import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token'ı header'a ekleyen interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const swapsService = {
  // Karşılıklı eşleşme - Reciprocal Matching
  // Kullanıcının Seeking becerileri ile diğer kullanıcıların Offering becerileri eşleşir
  // ve diğer kullanıcıların Seeking becerileri ile kullanıcının Offering becerileri eşleşir
  getReciprocalMatches: async () => {
    try {
      const response = await api.get('/swaps/reciprocal');
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
      
      // 401 Unauthorized - Token geçersiz veya yok
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          success: false,
          error: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
          requiresAuth: true,
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Eşleşmeler getirilemedi',
      };
    }
  },

  // Kullanıcının becerilerini getir (Offering/Seeking)
  getUserSkills: async (userId) => {
    try {
      const response = await api.get(`/user-skills/${userId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Kullanıcı becerileri getirilemedi',
      };
    }
  },

  // Kullanıcıya beceri ekle
  addUserSkill: async (skillId, type) => {
    try {
      const response = await api.post('/user-skills', {
        skill_id: skillId,
        type: type, // 'Offering' veya 'Seeking'
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor.',
        };
      }
      // 400 hatası (zaten ekli) sessizce geçilebilir
      if (error.response?.status === 400) {
        return {
          success: true, // Zaten ekli, sorun değil
          data: { message: 'Beceri zaten ekli' },
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Beceri eklenemedi',
      };
    }
  },

  // Kullanıcıdan beceri sil
  deleteUserSkill: async (userSkillId) => {
    try {
      const response = await api.delete(`/user-skills/${userSkillId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Beceri silinemedi',
      };
    }
  },

  // Eşleşme isteği gönder
  sendSwapRequest: async (receiverId) => {
    try {
      const response = await api.post('/swap-requests', {
        receiver_id: receiverId,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Eşleşme isteği gönderilemedi',
      };
    }
  },

  // Eşleşme isteklerini getir (gelen, giden, kabul edilenler)
  getSwapRequests: async () => {
    try {
      const response = await api.get('/swap-requests');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Eşleşme istekleri getirilemedi',
      };
    }
  },

  // Eşleşme isteği durumunu güncelle (kabul/red)
  updateSwapRequestStatus: async (requestId, status) => {
    try {
      const response = await api.put(`/swap-requests/${requestId}/status`, {
        status: status, // 'Accepted' veya 'Rejected'
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        return {
          success: false,
          error: 'Backend sunucusuna bağlanılamıyor.',
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'İstek durumu güncellenemedi',
      };
    }
  },
};

export default swapsService;

