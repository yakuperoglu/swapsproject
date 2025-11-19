import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Edit, Save, Cancel, Delete, Add, Close, Warning } from '@mui/icons-material';
import authService from '../services/authService';
import skillsService from '../services/skillsService';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalAction, setPasswordModalAction] = useState(''); // 'delete-account' gibi
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeSection, setActiveSection] = useState('temel-bilgiler');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success' | 'error' | 'warning' | 'info'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const [profileData, setProfileData] = useState({
    name: '',
    surname: '',
    phone: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    bio: '',
    languages: [],
    programming: [],
    design: [],
    other: [],
    wantToLearn: {
      languages: [],
      programming: [],
      design: [],
      other: [],
    },
    socialMedia: [],
    city: '',
    country: '',
    currentEducation: '',
    profession: '',
    job: '',
    email: '',
    username: '',
  });

  // Geçici düzenleme verileri (state'e yazılmadan önce tutuluyor)
  const [tempProfileData, setTempProfileData] = useState({
    name: '',
    surname: '',
    phone: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    bio: '',
    languages: [],
    programming: [],
    design: [],
    other: [],
    wantToLearn: {
      languages: [],
      programming: [],
      design: [],
      other: [],
    },
    socialMedia: [],
    city: '',
    country: '',
    currentEducation: '',
    profession: '',
    job: '',
    email: '',
    username: '',
  });

  // Skill kategorileri
  // Admin panelden gelen yetenekleri kategorilere göre dinamik olarak oluştur
  const getSkillCategories = async () => {
    // API'den yetenekleri al
    await skillsService.getAllSkills();
    
    const skillsByCategory = skillsService.getSkillsByCategory();
    const categories = {};
    
    Object.keys(skillsByCategory).forEach((category) => {
      // Kategori ismini key olarak kullan (boşlukları temizle, küçük harf)
      const categoryKey = category.toLowerCase().replace(/\s+/g, '-').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
      categories[categoryKey] = {
        label: category,
        options: skillsByCategory[category].map(skill => skill.name),
      };
    });
    
    return categories;
  };

  const getSkillCategoriesSync = () => {
    const skillsByCategory = skillsService.getSkillsByCategory();
    const categories = {};
    
    Object.keys(skillsByCategory).forEach((category) => {
      const categoryKey = category.toLowerCase().replace(/\s+/g, '-').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
      categories[categoryKey] = {
        label: category,
        options: skillsByCategory[category].map(skill => skill.name),
      };
    });
    
    return categories;
  };

  const [skillCategories, setSkillCategories] = useState(getSkillCategoriesSync());

  const socialMediaOptions = ['LinkedIn', 'Twitter', 'Instagram', 'Facebook', 'GitHub', 'Behance', 'Dribbble', 'YouTube', 'TikTok', 'Pinterest'];

  const educationOptions = ['İlkokul', 'Ortaokul', 'Lise', 'Ön Lisans', 'Lisans - Üniversite', 'Yüksek Lisans', 'Doktora'];

  const sectionRefs = {
    'temel-bilgiler': useRef(null),
    'skiller': useRef(null),
    'ogrenmek-istediklerim': useRef(null),
    'sosyal-medya': useRef(null),
    'cografi-bilgiler': useRef(null),
    'egitim-bilgileri': useRef(null),
    'hesap-guvenligi': useRef(null),
  };

  // Aktif kullanıcının profil anahtarını üret
  const getCurrentUserProfileKey = () => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;

    try {
      const user = JSON.parse(savedUser);
      if (user?.id) return `profileData_${user.id}`;
      if (user?.email) return `profileData_${user.email}`;
    } catch (e) {
      console.error('Kullanıcı bilgisi okunurken hata oluştu:', e);
    }

    // Eski versiyon geriye dönük uyumluluk için
    return 'profileData';
  };

  // localStorage'dan aktif kullanıcının bilgilerini yükle VE API'den güncel verileri çek
  useEffect(() => {
    const loadUserProfile = async () => {
      // Önce localStorage'dan yükle (hızlı gösterim için)
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setProfileData(prev => ({
            ...prev,
            name: user.username || '',
            email: user.email || '',
          }));

          // API'den güncel kullanıcı bilgilerini çek
          const result = await authService.getUserProfile(user.id);
          
          if (result.success && result.data.user) {
            const apiUser = result.data.user;
            
            // Kullanıcı adı veya email değiştiyse güncelle
            if (apiUser.username !== user.username || apiUser.email !== user.email) {
              // localStorage'daki user bilgisini güncelle
              const updatedUser = {
                ...user,
                username: apiUser.username,
                email: apiUser.email,
              };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              // State'i güncelle
              setProfileData(prev => ({
                ...prev,
                name: apiUser.username,
                email: apiUser.email,
              }));

              console.log('Kullanıcı bilgileri API\'den güncellendi:', apiUser);
            }

            // Profil verileri varsa onları da yükle
            if (result.data.profile) {
              setProfileData(prev => ({ ...prev, ...result.data.profile }));
              
              // localStorage'a da kaydet
              const profileKey = getCurrentUserProfileKey();
              if (profileKey) {
                localStorage.setItem(profileKey, JSON.stringify(result.data.profile));
              }
            }
          }
        } catch (e) {
          console.error('Kullanıcı bilgisi işlenirken hata oluştu:', e);
        }
      }

      // localStorage profil verilerini de yükle (fallback)
      const profileKey = getCurrentUserProfileKey();
      if (profileKey) {
        const savedProfile = localStorage.getItem(profileKey);
        if (savedProfile) {
          try {
            const profile = JSON.parse(savedProfile);
            setProfileData(prev => ({ ...prev, ...profile }));
          } catch (e) {
            console.error('Profil bilgisi parse edilirken hata oluştu:', e);
          }
        }
      }

      // Yetenekleri güncelle (admin panelden değişiklik yapıldıysa)
      const categories = await getSkillCategories();
      setSkillCategories(categories);
    };

    loadUserProfile();
  }, []);

  // Düzenleme moduna girdiğinde yetenekleri ve kullanıcı bilgilerini yeniden yükle
  useEffect(() => {
    if (isEditing) {
      const loadData = async () => {
        // Yetenekleri yükle
        const categories = await getSkillCategories();
        setSkillCategories(categories);

        // Kullanıcı bilgilerini yeniden çek (admin değiştirmiş olabilir)
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            const result = await authService.getUserProfile(user.id);
            
            if (result.success && result.data.user) {
              const apiUser = result.data.user;
              
              // Kullanıcı bilgileri değiştiyse güncelle
              if (apiUser.username !== user.username || apiUser.email !== user.email) {
                const updatedUser = {
                  ...user,
                  username: apiUser.username,
                  email: apiUser.email,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                // profileData ve tempProfileData'yı güncelle
                setProfileData(prev => ({
                  ...prev,
                  name: apiUser.username,
                  email: apiUser.email,
                }));
                
                setTempProfileData(prev => ({
                  ...prev,
                  name: apiUser.username,
                  email: apiUser.email,
                }));

                setSnackbar({
                  open: true,
                  message: 'Kullanıcı bilgileriniz güncellendi!',
                  severity: 'info',
                });
              }
            }
          } catch (e) {
            console.error('Kullanıcı bilgisi güncellenirken hata:', e);
          }
        }
      };
      loadData();
    }
  }, [isEditing]);

  // Section'a scroll et
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    if (sectionRefs[sectionId]?.current) {
      sectionRefs[sectionId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInputChange = (field, value) => {
    setTempProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSkillToggle = (category, skill) => {
    setTempProfileData(prev => {
      const currentSkills = prev[category] || [];
      const isSelected = currentSkills.includes(skill);
      
      return {
        ...prev,
        [category]: isSelected
          ? currentSkills.filter(s => s !== skill)
          : [...currentSkills, skill],
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleWantToLearnToggle = (category, skill) => {
    setTempProfileData(prev => {
      const currentSkills = prev.wantToLearn[category] || [];
      const isSelected = currentSkills.includes(skill);
      
      return {
        ...prev,
        wantToLearn: {
          ...prev.wantToLearn,
          [category]: isSelected
            ? currentSkills.filter(s => s !== skill)
            : [...currentSkills, skill],
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleAddSocialMedia = () => {
    setTempProfileData(prev => ({
      ...prev,
      socialMedia: [...prev.socialMedia, { platform: '', account: '' }],
    }));
    setHasUnsavedChanges(true);
  };

  const handleSocialMediaChange = (index, field, value) => {
    setTempProfileData(prev => {
      const updated = [...prev.socialMedia];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, socialMedia: updated };
    });
    setHasUnsavedChanges(true);
  };

  const handleRemoveSocialMedia = (index) => {
    setTempProfileData(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  };

  const handleEditClick = () => {
    // Mevcut profil verilerini geçici state'e kopyala
    setTempProfileData({ ...profileData });
    setHasUnsavedChanges(false);
    setIsEditing(true);
  };

  const handlePasswordSubmit = async () => {
    // Şifre doğrulama (önemli işlemler için kullanılacak)
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      setPasswordError('Kullanıcı bilgisi bulunamadı.');
      return;
    }

    // Şimdilik demo için basit kontrol (gerçekte backend'e post atılmalı)
    if (passwordInput.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    // Şifre doğru kabul edildi
    setShowPasswordModal(false);
    setPasswordInput('');
    setPasswordError('');

    // İşlemi gerçekleştir
    if (passwordModalAction === 'delete-account') {
      await handleDeleteAccount();
    } else {
      setSnackbar({
        open: true,
        message: 'Şifre doğrulandı! İşleminiz gerçekleştiriliyor...',
        severity: 'success',
      });
    }

    // Action'ı temizle
    setPasswordModalAction('');
  };

  const handleDeleteAccount = async () => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      setSnackbar({
        open: true,
        message: 'Kullanıcı bilgisi bulunamadı!',
        severity: 'error',
      });
      return;
    }

    try {
      const user = JSON.parse(savedUser);
      const result = await authService.deleteAccount(user.id);

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Hesabınız başarıyla silindi. Yönlendiriliyorsunuz...',
          severity: 'success',
        });

        // 2 saniye sonra çıkış yap ve login sayfasına yönlendir
        setTimeout(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          // Tüm profil verilerini temizle
          const profileKey = getCurrentUserProfileKey();
          if (profileKey) {
            localStorage.removeItem(profileKey);
          }
          navigate('/login');
        }, 2000);
      } else {
        setSnackbar({
          open: true,
          message: 'Hata: ' + result.error,
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Hesap silme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Hesap silinirken bir hata oluştu!',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSave = async () => {
    const profileKey = getCurrentUserProfileKey();
    if (!profileKey) {
      console.warn('Aktif kullanıcı bulunamadı, profil kaydedilemedi.');
      setSnackbar({
        open: true,
        message: 'Kullanıcı bilgisi bulunamadı.',
        severity: 'error',
      });
      return;
    }

    // Kullanıcı ID'sini al
    const savedUser = localStorage.getItem('user');
    let userId = null;
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        userId = user.id;
      } catch (e) {
        console.error('Kullanıcı bilgisi parse edilirken hata oluştu:', e);
      }
    }

    if (!userId) {
      setSnackbar({
        open: true,
        message: 'Kullanıcı ID bulunamadı.',
        severity: 'error',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Geçici verileri gerçek state'e kopyala
      setProfileData({ ...tempProfileData });

      // Backend'e profil verilerini gönder
      const result = await authService.saveProfileSettings(userId, tempProfileData);

      if (result.success) {
        // Başarılı ise localStorage'a da kaydet
        localStorage.setItem(profileKey, JSON.stringify(tempProfileData));
        setHasUnsavedChanges(false);
        setIsEditing(false);
        setSnackbar({
          open: true,
          message: 'Profil bilgileriniz başarıyla kaydedildi!',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Hata: ' + result.error,
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Profil kaydetme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Profil kaydedilirken bir hata oluştu.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setConfirmDialog({
        open: true,
        title: 'Değişiklikleri İptal Et',
        message: 'Yaptığınız değişiklikler kaydedilmedi. İptal ederseniz tüm değişiklikler kaybolacak. Devam etmek istiyor musunuz?',
        onConfirm: () => {
          setConfirmDialog({ ...confirmDialog, open: false });
          setTempProfileData({ ...profileData });
          setHasUnsavedChanges(false);
          setIsEditing(false);
        },
      });
    } else {
      // Geçici değişiklikleri iptal et, orijinal verilere dön
      setTempProfileData({ ...profileData });
      setHasUnsavedChanges(false);
      setIsEditing(false);
    }
  };

  const handleNavigateWithCheck = (path) => {
    if (hasUnsavedChanges) {
      setConfirmDialog({
        open: true,
        title: 'Kaydedilmemiş Değişiklikler',
        message: 'Yaptığınız değişiklikler kaydedilmedi. Sayfadan çıkarsanız tüm değişiklikler kaybolacak. Devam etmek istiyor musunuz?',
        onConfirm: () => {
          setConfirmDialog({ ...confirmDialog, open: false });
          setHasUnsavedChanges(false);
          navigate(path);
        },
      });
    } else {
      navigate(path);
    }
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const menuItems = [
    { path: '/profile', label: 'Profil', icon: '👤' },
    { path: '/discover', label: 'Keşfet', icon: '🔍' },
    { path: '/suggestions', label: 'Öneriler', icon: '💡' },
  ];

  const editMenuItems = [
    { id: 'temel-bilgiler', label: 'Temel Bilgiler' },
    { id: 'skiller', label: 'Yeteneklerim' },
    { id: 'ogrenmek-istediklerim', label: 'Öğrenmek İstediklerim' },
    { id: 'sosyal-medya', label: 'Sosyal Medyalar' },
    { id: 'cografi-bilgiler', label: 'Coğrafi Bilgiler' },
    { id: 'egitim-bilgileri', label: 'Eğitim Bilgileri' },
    { id: 'hesap-guvenligi', label: 'Hesap Güvenliği' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Tüm skill'leri birleştir (dinamik kategorilerden)
  const allSkills = Object.keys(skillCategories).reduce((acc, categoryKey) => {
    return [...acc, ...(profileData[categoryKey] || [])];
  }, []);

  // Öğrenmek istedikleri skill'leri birleştir (dinamik kategorilerden)
  const allWantToLearnSkills = Object.keys(skillCategories).reduce((acc, categoryKey) => {
    return [...acc, ...(profileData.wantToLearn?.[categoryKey] || [])];
  }, []);

  // Görüntüleme Modu
  if (!isEditing) {
    return (
      <div className="profile-layout">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Menü</h2>
          </div>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button
              className="logout-button"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setProfileData({
                  name: '',
                  surname: '',
                  phone: '',
                  birthDay: '',
                  birthMonth: '',
                  birthYear: '',
                  bio: '',
                  languages: [],
                  programming: [],
                  design: [],
                  other: [],
                  wantToLearn: {
                    languages: [],
                    programming: [],
                    design: [],
                    other: [],
                  },
                  socialMedia: [],
                  city: '',
                  country: '',
                  currentEducation: '',
                  profession: '',
                  job: '',
                  email: '',
                  username: '',
                });
                navigate('/login');
              }}
            >
              Profilden Çık
            </button>
          </div>
        </div>
        <div className="profile-content">
          <div className="profile-view-container">
            {/* Header */}
            <div className="profile-header">
              <div className="profile-header-bg"></div>
              <div className="profile-header-content">
                <div className="profile-info">
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {profileData.name || 'Kullanıcı Adı'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {profileData.location || 'Konum belirtilmemiş'}
                    </Typography>
                    {profileData.birthYear && (
                      <Typography variant="body2" color="text.secondary">
                        {new Date().getFullYear() - parseInt(profileData.birthYear)} yaşında
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={handleEditClick}
                    sx={{
                      background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #ff6b35 0%, #ff5722 100%)',
                      },
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    Profilimi Düzenle
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="profile-view-content">
              <Grid container spacing={3}>
                {/* Sol Taraf - Yetenekler ve Hakkında */}
                <Grid item xs={12} md={4}>
                  <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                      Yetenekler
                    </Typography>
                    {allSkills.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {allSkills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                              color: 'white',
                              fontWeight: 500,
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Henüz yetenek eklenmemiş.
                      </Typography>
                    )}
                  </Paper>

                  <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                      Öğrenmek İstedikleri
                    </Typography>
                    {allWantToLearnSkills.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {allWantToLearnSkills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              fontWeight: 500,
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Henüz öğrenmek istediği yetenek eklenmemiş.
                      </Typography>
                    )}
                  </Paper>

                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                      Hakkında
                    </Typography>
                    {profileData.bio ? (
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {profileData.bio}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Henüz hakkında bilgisi eklenmemiş.
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Sağ Taraf - Detaylı Bilgiler (Büyük Kare) */}
                <Grid item xs={12} md={8}>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 4, 
                      borderRadius: 2,
                      minHeight: '400px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 4, fontWeight: 600, color: '#333' }}>
                      Detaylı Bilgiler
                    </Typography>
                    <Grid container spacing={3}>
                      {profileData.surname && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Soyisim</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>{profileData.surname}</Typography>
                        </Grid>
                      )}
                      {profileData.currentEducation && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Eğitim</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>{profileData.currentEducation}</Typography>
                        </Grid>
                      )}
                      {profileData.profession && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Meslek</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>{profileData.profession}</Typography>
                        </Grid>
                      )}
                      {profileData.job && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>İş</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>{profileData.job}</Typography>
                        </Grid>
                      )}
                      {profileData.city && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Şehir</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>{profileData.city}</Typography>
                        </Grid>
                      )}
                      {profileData.country && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Ülke</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>{profileData.country}</Typography>
                        </Grid>
                      )}
                      {profileData.birthDay && profileData.birthMonth && profileData.birthYear && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Doğum Tarihi</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                            {profileData.birthDay}/{profileData.birthMonth}/{profileData.birthYear}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </div>
          </div>
        </div>

        {/* Şifre Doğrulama Modal */}
        {showPasswordModal && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={() => setShowPasswordModal(false)}
          >
            <Paper
              sx={{
                p: 4,
                maxWidth: 400,
                width: '90%',
                borderRadius: 2,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Şifrenizi Girin
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Profil bilgilerinizi düzenlemek için önce şifrenizi doğrulayın.
              </Typography>
              <TextField
                fullWidth
                type="password"
                label="Şifre"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                error={!!passwordError}
                helperText={passwordError}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                sx={{ mb: 3 }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handlePasswordSubmit}
                  sx={{
                    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ff5722 100%)',
                    },
                  }}
                >
                  Doğrula
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setShowPasswordModal(false)}
                  sx={{
                    borderColor: '#ff8c42',
                    color: '#ff8c42',
                    '&:hover': {
                      borderColor: '#ff6b35',
                      background: 'rgba(255, 140, 66, 0.1)',
                    },
                  }}
                >
                  İptal
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Toast Bildirimi */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Onay Dialogu */}
        <Dialog
          open={confirmDialog.open}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 3,
              minWidth: 400,
            },
          }}
        >
          <DialogTitle
            id="alert-dialog-title"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#f57c00',
              fontWeight: 700,
            }}
          >
            <Warning sx={{ fontSize: 28, color: '#f57c00' }} />
            {confirmDialog.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description" sx={{ fontSize: '1rem', color: '#555' }}>
              {confirmDialog.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={handleCloseConfirmDialog}
              variant="outlined"
              sx={{
                borderColor: '#ccc',
                color: '#666',
                '&:hover': {
                  borderColor: '#999',
                  background: 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              Vazgeç
            </Button>
            <Button
              onClick={confirmDialog.onConfirm}
              variant="contained"
              autoFocus
              sx={{
                background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff6b35 0%, #ff5722 100%)',
                },
              }}
            >
              Devam Et
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  // Düzenleme Modu
  return (
    <div className="profile-layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Menü</h2>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavigateWithCheck(item.path)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="profile-content edit-mode">
        <div className="edit-layout">
          {/* Sol Menü */}
          <div className="edit-sidebar">
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, px: 2, pt: 2 }}>
              Profil Düzenle
            </Typography>
            <nav className="edit-menu">
              {editMenuItems.map((item) => (
                <button
                  key={item.id}
                  className={`edit-menu-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <Box sx={{ p: 2, mt: 'auto' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCancel}
                sx={{
                  background: 'linear-gradient(135deg, #ff9500 0%, #ff7f00 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ff7f00 0%, #ff6b00 100%)',
                  },
                }}
              >
                Profile Git
              </Button>
            </Box>
          </div>

          {/* Sağ İçerik */}
          <div className="edit-content">
            <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
              {/* Temel Bilgiler */}
              <section ref={sectionRefs['temel-bilgiler']} className="edit-section">
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Temel Bilgiler
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="İsim"
                      value={tempProfileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Soyisim"
                      value={tempProfileData.surname}
                      onChange={(e) => handleInputChange('surname', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TextField
                        fullWidth
                        label="Telefon Numarası"
                        value={tempProfileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Gizli
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">Doğum Tarihi</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Herkese Göster
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl sx={{ minWidth: 100 }}>
                        <InputLabel>Gün</InputLabel>
                        <Select
                          value={tempProfileData.birthDay}
                          label="Gün"
                          onChange={(e) => handleInputChange('birthDay', e.target.value)}
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <MenuItem key={day} value={day}>{day}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Ay</InputLabel>
                        <Select
                          value={tempProfileData.birthMonth}
                          label="Ay"
                          onChange={(e) => handleInputChange('birthMonth', e.target.value)}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <MenuItem key={month} value={month}>{month}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Yıl</InputLabel>
                        <Select
                          value={tempProfileData.birthYear}
                          label="Yıl"
                          onChange={(e) => handleInputChange('birthYear', e.target.value)}
                        >
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Hakkımda
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      value={tempProfileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Kendiniz hakkında bilgi verin..."
                    />
                  </Grid>
                </Grid>
              </section>

              {/* Yeteneklerim */}
              <section ref={sectionRefs['skiller']} className="edit-section">
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Yeteneklerim
                </Typography>
                {Object.entries(skillCategories).map(([categoryKey, category]) => (
                  <Box key={categoryKey} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#ff8c42', fontWeight: 600 }}>
                      {category.label}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {category.options.map((skill) => {
                        const isSelected = tempProfileData[categoryKey]?.includes(skill);
                        return (
                          <Chip
                            key={skill}
                            label={skill}
                            onClick={() => handleSkillToggle(categoryKey, skill)}
                            color={isSelected ? 'primary' : 'default'}
                            variant={isSelected ? 'filled' : 'outlined'}
                            sx={{
                              cursor: 'pointer',
                              background: isSelected 
                                ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' 
                                : 'transparent',
                              color: isSelected ? 'white' : '#ff9800',
                              borderColor: '#ff9800',
                              fontWeight: isSelected ? 600 : 400,
                              '&:hover': {
                                background: isSelected 
                                  ? 'rgba(255, 152, 0, 0.8)' 
                                  : 'rgba(255, 152, 0, 0.1)',
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                ))}
              </section>

              {/* Öğrenmek İstediklerim */}
              <section ref={sectionRefs['ogrenmek-istediklerim']} className="edit-section">
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Öğrenmek İstediklerim
                </Typography>
                {Object.entries(skillCategories).map(([categoryKey, category]) => (
                  <Box key={categoryKey} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#667eea', fontWeight: 600 }}>
                      {category.label}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {category.options.map((skill) => {
                        const isSelected = tempProfileData.wantToLearn?.[categoryKey]?.includes(skill);
                        return (
                          <Chip
                            key={skill}
                            label={skill}
                            onClick={() => handleWantToLearnToggle(categoryKey, skill)}
                            color={isSelected ? 'primary' : 'default'}
                            variant={isSelected ? 'filled' : 'outlined'}
                            sx={{
                              cursor: 'pointer',
                              background: isSelected 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                : 'transparent',
                              color: isSelected ? 'white' : '#667eea',
                              borderColor: '#667eea',
                              fontWeight: isSelected ? 600 : 400,
                              '&:hover': {
                                background: isSelected 
                                  ? 'rgba(102, 126, 234, 0.8)' 
                                  : 'rgba(102, 126, 234, 0.1)',
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                ))}
              </section>

              {/* Sosyal Medya */}
              <section ref={sectionRefs['sosyal-medya']} className="edit-section">
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Sosyal Medya
                </Typography>
                {tempProfileData.socialMedia.map((social, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                    <FormControl sx={{ minWidth: 150 }}>
                      <InputLabel>Platform</InputLabel>
                      <Select
                        value={social.platform}
                        label="Platform"
                        onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
                      >
                        {socialMediaOptions.map(option => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Hesap"
                      value={social.account}
                      onChange={(e) => handleSocialMediaChange(index, 'account', e.target.value)}
                      placeholder="Kullanıcı adı, URL veya email"
                    />
                    <IconButton onClick={() => handleRemoveSocialMedia(index)} color="error">
                      <Close />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<Add />}
                  onClick={handleAddSocialMedia}
                  variant="outlined"
                  sx={{ 
                    borderColor: '#ff8c42', 
                    color: '#ff8c42',
                    '&:hover': {
                      borderColor: '#ff6b35',
                      background: 'rgba(255, 140, 66, 0.1)',
                    },
                  }}
                >
                  Yeni Sosyal Medya Hesabı Ekle
                </Button>
              </section>

              {/* Coğrafi Bilgiler */}
              <section ref={sectionRefs['cografi-bilgiler']} className="edit-section">
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Coğrafi Bilgiler
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Şehir"
                      value={tempProfileData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ülke"
                      value={tempProfileData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </section>

              {/* Eğitim Bilgileri */}
              <section ref={sectionRefs['egitim-bilgileri']} className="edit-section">
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Eğitim ve İş Bilgileri
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">Güncel Eğitim Seviyesi</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Herkese Göster
                      </Typography>
                    </Box>
                    <FormControl fullWidth>
                      <InputLabel>Eğitim Seviyesi</InputLabel>
                      <Select
                        value={tempProfileData.currentEducation}
                        label="Eğitim Seviyesi"
                        onChange={(e) => handleInputChange('currentEducation', e.target.value)}
                      >
                        {educationOptions.map(option => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">Meslek</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Herkese Göster
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      value={tempProfileData.profession}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                      placeholder="Örn: Öğrenci, Yazılım Geliştirici"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">İş</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Herkese Göster
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      value={tempProfileData.job}
                      onChange={(e) => handleInputChange('job', e.target.value)}
                      placeholder="İş unvanı"
                    />
                  </Grid>
                </Grid>
              </section>

              {/* Hesap Güvenliği */}
              <section ref={sectionRefs['hesap-guvenligi']} className="edit-section">
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#f57c00' }}>
                  Hesap Güvenliği
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Bu bölümdeki işlemler için şifre doğrulaması gereklidir.
                </Typography>

                {/* Kullanıcı Adı Değiştir */}
                <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Kullanıcı Adı Değiştir
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Yeni Kullanıcı Adı"
                        value={tempProfileData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Yeni kullanıcı adınızı girin"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={() => setShowPasswordModal(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)',
                          '&:hover': { 
                            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                          },
                        }}
                      >
                        Kullanıcı Adını Güncelle
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Şifre Değiştir */}
                <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Şifre Değiştir
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Yeni Şifre"
                        placeholder="Yeni şifrenizi girin"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Yeni Şifre Tekrar"
                        placeholder="Yeni şifrenizi tekrar girin"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={() => setShowPasswordModal(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)',
                          '&:hover': { 
                            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                          },
                        }}
                      >
                        Şifreyi Güncelle
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* E-posta Değiştir */}
                <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    E-posta Değiştir
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="email"
                        label="Yeni E-posta"
                        value={tempProfileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Yeni e-posta adresinizi girin"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={() => setShowPasswordModal(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)',
                          '&:hover': { 
                            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                          },
                        }}
                      >
                        E-postayı Güncelle
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Hesabı Sil */}
                <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2, borderLeft: '4px solid #f44336' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#f44336' }}>
                    Hesabı Sil
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    ⚠️ Bu işlem geri alınamaz! Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Delete />}
                    onClick={() => {
                      setPasswordModalAction('delete-account');
                      setShowPasswordModal(true);
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #ff5722 0%, #e64a19 100%)',
                      '&:hover': { 
                        background: 'linear-gradient(135deg, #e64a19 0%, #d84315 100%)',
                      },
                    }}
                  >
                    Hesabı Kalıcı Olarak Sil
                  </Button>
                </Paper>
              </section>

              {/* Kaydet ve İptal Butonları */}
              <Box sx={{ display: 'flex', gap: 2, mt: 4, pb: 4 }}>
                <Button
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  onClick={handleSave}
                  disabled={isSaving}
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ff5722 100%)',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #ccc 0%, #aaa 100%)',
                    },
                  }}
                >
                  {isSaving ? 'Kaydediliyor...' : 'Tüm Değişiklikleri Kaydet'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  size="large"
                  sx={{
                    borderColor: '#ff8c42',
                    color: '#ff8c42',
                    '&:hover': {
                      borderColor: '#ff6b35',
                      background: 'rgba(255, 140, 66, 0.1)',
                    },
                  }}
                >
                  İptal
                </Button>
              </Box>
            </Box>
          </div>
        </div>

        {/* Şifre Doğrulama Modal (Düzenleme Modunda) */}
        {showPasswordModal && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={() => setShowPasswordModal(false)}
          >
            <Paper
              sx={{
                p: 4,
                maxWidth: 400,
                width: '90%',
                borderRadius: 2,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Şifrenizi Girin
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Bu işlemi gerçekleştirmek için şifrenizi doğrulayın.
              </Typography>
              <TextField
                fullWidth
                type="password"
                label="Mevcut Şifre"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                error={!!passwordError}
                helperText={passwordError}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                sx={{ mb: 3 }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handlePasswordSubmit}
                  sx={{
                    background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ff5722 100%)',
                    },
                  }}
                >
                  Doğrula
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  sx={{
                    borderColor: '#ff8c42',
                    color: '#ff8c42',
                    '&:hover': {
                      borderColor: '#ff6b35',
                      background: 'rgba(255, 140, 66, 0.1)',
                    },
                  }}
                >
                  İptal
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Toast Bildirimi */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Onay Dialogu */}
        <Dialog
          open={confirmDialog.open}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 3,
              minWidth: 400,
            },
          }}
        >
          <DialogTitle
            id="alert-dialog-title"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#f57c00',
              fontWeight: 700,
            }}
          >
            <Warning sx={{ fontSize: 28, color: '#f57c00' }} />
            {confirmDialog.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description" sx={{ fontSize: '1rem', color: '#555' }}>
              {confirmDialog.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={handleCloseConfirmDialog}
              variant="outlined"
              sx={{
                borderColor: '#ccc',
                color: '#666',
                '&:hover': {
                  borderColor: '#999',
                  background: 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              Vazgeç
            </Button>
            <Button
              onClick={confirmDialog.onConfirm}
              variant="contained"
              autoFocus
              sx={{
                background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff6b35 0%, #ff5722 100%)',
                },
              }}
            >
              Devam Et
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfilePage;
