// Merkezi yetenek yönetim servisi
// Admin panelden eklenen yetenekler tüm uygulamada kullanılır

import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const SKILLS_STORAGE_KEY = 'app_skills';
const SKILLS_CACHE_KEY = 'app_skills_cache_time';
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika cache

// Varsayılan yetenekler
const DEFAULT_SKILLS = [
  { name: 'İngilizce', category: 'Dil' },
  { name: 'Fransızca', category: 'Dil' },
  { name: 'Almanca', category: 'Dil' },
  { name: 'İspanyolca', category: 'Dil' },
  { name: 'Çince', category: 'Dil' },
  { name: 'Japonca', category: 'Dil' },
  { name: 'JavaScript', category: 'Programlama' },
  { name: 'Python', category: 'Programlama' },
  { name: 'Java', category: 'Programlama' },
  { name: 'C++', category: 'Programlama' },
  { name: 'React', category: 'Programlama' },
  { name: 'Node.js', category: 'Programlama' },
  { name: 'Gitar', category: 'Müzik' },
  { name: 'Piyano', category: 'Müzik' },
  { name: 'Keman', category: 'Müzik' },
  { name: 'Davul', category: 'Müzik' },
  { name: 'Photoshop', category: 'Tasarım' },
  { name: 'Illustrator', category: 'Tasarım' },
  { name: 'Figma', category: 'Tasarım' },
  { name: 'UI/UX Design', category: 'Tasarım' },
];

export const skillsService = {
  // Tüm yetenekleri getir (önce cache'den, sonra API'den)
  getAllSkills: async () => {
    try {
      // Cache kontrolü
      const cacheTime = localStorage.getItem(SKILLS_CACHE_KEY);
      const now = Date.now();
      
      if (cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
        // Cache geçerliyse localStorage'dan al
        const cached = localStorage.getItem(SKILLS_STORAGE_KEY);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Cache yoksa veya geçersizse API'den al
      const response = await api.get('/skills');
      
      if (response.data.success) {
        const skills = response.data.skills;
        // Cache'e kaydet
        localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(skills));
        localStorage.setItem(SKILLS_CACHE_KEY, now.toString());
        return skills;
      }
      
      // API başarısız, localStorage'dan dön
      const saved = localStorage.getItem(SKILLS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SKILLS;
    } catch (error) {
      console.error('Yetenekler API\'den yüklenemedi, localStorage kullanılıyor:', error);
      // Network hatası, localStorage'dan dön
      const saved = localStorage.getItem(SKILLS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SKILLS;
    }
  },

  // Senkron versiyon (cache'den okur, eski kodlarla uyumluluk için)
  getAllSkillsSync: () => {
    try {
      const saved = localStorage.getItem(SKILLS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      return DEFAULT_SKILLS;
    } catch (error) {
      console.error('Yetenekler yüklenemedi:', error);
      return DEFAULT_SKILLS;
    }
  },

  // Kategorilere göre grupla (senkron - cache'den okur)
  getSkillsByCategory: () => {
    const skills = skillsService.getAllSkillsSync();
    const grouped = {};
    
    skills.forEach((skill) => {
      const category = skill.category || 'Diğer';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(skill);
    });

    // Kategorileri alfabetik sırala
    const sortedGrouped = {};
    Object.keys(grouped)
      .sort()
      .forEach((key) => {
        sortedGrouped[key] = grouped[key].sort((a, b) => a.name.localeCompare(b.name));
      });

    return sortedGrouped;
  },

  // Tüm kategorileri getir (API'den)
  getAllCategories: async () => {
    try {
      const response = await api.get('/categories');
      
      if (response.data.success) {
        return response.data.categories;
      }
      
      // API başarısız, local'den hesapla
      const skills = skillsService.getAllSkillsSync();
      const categories = [...new Set(skills.map((s) => s.category || 'Diğer'))];
      return categories.sort();
    } catch (error) {
      console.error('Kategoriler API\'den yüklenemedi, local kullanılıyor:', error);
      // Network hatası, local'den hesapla
      const skills = skillsService.getAllSkillsSync();
      const categories = [...new Set(skills.map((s) => s.category || 'Diğer'))];
      return categories.sort();
    }
  },

  // Tüm kategorileri getir (senkron - cache'den)
  getAllCategoriesSync: () => {
    const skills = skillsService.getAllSkillsSync();
    const categories = [...new Set(skills.map((s) => s.category || 'Diğer'))];
    return categories.sort();
  },

  // Yeni yetenek ekle (API'ye gönder)
  addSkill: async (name, category) => {
    try {
      const response = await api.post('/skills', {
        name: name.trim(),
        category: category.trim(),
      });

      if (response.data.success) {
        // Cache'i temizle, yeniden yüklensin
        localStorage.removeItem(SKILLS_CACHE_KEY);
        
        // Hemen cache'e ekle
        const skills = skillsService.getAllSkillsSync();
        const newSkill = response.data.skill;
        const updated = [...skills, newSkill];
        localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(updated));
        
        return { success: true, data: newSkill };
      }

      return { success: false, error: response.data.message || 'Yetenek eklenemedi!' };
    } catch (error) {
      console.error('Yetenek eklenemedi:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Yetenek eklenemedi!';
      return { success: false, error: errorMessage };
    }
  },

  // Yetenek sil (API'den sil)
  deleteSkill: async (skillName, category) => {
    try {
      // Önce skill ID'sini bul
      const skills = skillsService.getAllSkillsSync();
      const skill = skills.find(s => s.name === skillName && s.category === category);
      
      if (!skill) {
        return { success: false, error: 'Yetenek bulunamadı!' };
      }

      const response = await api.delete(`/skills/${skill.id}`);

      if (response.data.success) {
        // Cache'i temizle
        localStorage.removeItem(SKILLS_CACHE_KEY);
        
        // Hemen cache'den sil
        const updated = skills.filter(s => s.id !== skill.id);
        localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(updated));
        
        return { success: true };
      }

      return { success: false, error: response.data.message || 'Yetenek silinemedi!' };
    } catch (error) {
      console.error('Yetenek silinemedi:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Yetenek silinemedi!';
      return { success: false, error: errorMessage };
    }
  },

  // Yetenek güncelle (API'de güncelle)
  updateSkill: async (oldName, oldCategory, newName, newCategory) => {
    try {
      // Önce skill ID'sini bul
      const skills = skillsService.getAllSkillsSync();
      const skill = skills.find(s => s.name === oldName && s.category === oldCategory);
      
      if (!skill) {
        return { success: false, error: 'Yetenek bulunamadı!' };
      }

      const response = await api.put(`/skills/${skill.id}`, {
        name: newName.trim(),
        category: newCategory.trim(),
      });

      if (response.data.success) {
        // Cache'i temizle
        localStorage.removeItem(SKILLS_CACHE_KEY);
        
        // Hemen cache'de güncelle
        const updated = skills.map(s => {
          if (s.id === skill.id) {
            return { ...s, name: newName.trim(), category: newCategory.trim() };
          }
          return s;
        });
        localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(updated));
        
        return { success: true };
      }

      return { success: false, error: response.data.message || 'Yetenek güncellenemedi!' };
    } catch (error) {
      console.error('Yetenek güncellenemedi:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Yetenek güncellenemedi!';
      return { success: false, error: errorMessage };
    }
  },

  // Tüm yetenekleri sıfırla (varsayılana dön)
  resetSkills: () => {
    localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(DEFAULT_SKILLS));
    return { success: true };
  },
};

export default skillsService;

