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

export const messageService = {
  // Mesaj gönder
  sendMessage: async (receiverId, content) => {
    try {
      const response = await api.post('/messages', {
        receiver_id: receiverId,
        content: content,
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
        error: error.response?.data?.message || error.message || 'Mesaj gönderilemedi',
      };
    }
  },

  // Konuşmayı getir
  getConversation: async (otherUserId) => {
    try {
      const response = await api.get(`/messages/conversation/${otherUserId}`);
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
        error: error.response?.data?.message || error.message || 'Konuşma getirilemedi',
      };
    }
  },

  // Tüm konuşmaları listele
  getConversations: async () => {
    try {
      const response = await api.get('/messages/conversations');
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
        error: error.response?.data?.message || error.message || 'Konuşmalar getirilemedi',
      };
    }
  },
};

export default messageService;

