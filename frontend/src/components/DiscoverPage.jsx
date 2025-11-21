import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CircularProgress, Alert, Chip, Box, Typography, Button, Snackbar } from '@mui/material';
import { Send } from '@mui/icons-material';
import swapsService from '../services/swapsService';
import './DiscoverPage.css';
import './ProfilePage.css';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [sendingRequests, setSendingRequests] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const menuItems = [
    { path: '/profile', label: 'Profil', icon: '👤' },
    { path: '/discover', label: 'Keşfet', icon: '🔍' },
    { path: '/requests', label: 'İsteklerim', icon: '📬' },
    { path: '/messages', label: 'Mesajlar', icon: '💬' },
    { path: '/suggestions', label: 'Öneriler', icon: '💡' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      setRequiresAuth(false);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.');
        setRequiresAuth(true);
        setLoading(false);
        return;
      }

      try {
        const result = await swapsService.getReciprocalMatches();
        
        if (result.success) {
          setMatches(result.data.matches || []);
        } else {
          setError(result.error);
          if (result.requiresAuth) {
            setRequiresAuth(true);
          }
        }
      } catch (err) {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        console.error('Discover page error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleSendRequest = async (receiverId, receiverName) => {
    if (sendingRequests.has(receiverId)) {
      return; // Zaten gönderiliyor
    }

    setSendingRequests(prev => new Set(prev).add(receiverId));

    try {
      const result = await swapsService.sendSwapRequest(receiverId);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: `${receiverName} kullanıcısına eşleşme isteği gönderildi!`,
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'İstek gönderilemedi',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Eşleşme isteği gönderme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        severity: 'error',
      });
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(receiverId);
        return newSet;
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div className="profile-layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">
            <span>SW</span>APS
          </h2>
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
      </div>
      <div className="profile-content discover-content">
        <div className="discover-header">
          <h1>Keşfet</h1>
          <p className="discover-subtitle">
            Profilinizdeki yetenekleriniz ve öğrenmek istediklerinizle eşleşen kişileri keşfedin
          </p>
        </div>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert 
            severity={requiresAuth ? "warning" : "error"} 
            sx={{ mb: 3 }}
            action={
              requiresAuth ? (
                <button 
                  onClick={handleLoginRedirect}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'inherit', 
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '8px'
                  }}
                >
                  Giriş Yap
                </button>
              ) : null
            }
          >
            {error}
          </Alert>
        ) : matches.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Henüz eşleşme bulunamadı. Profilinizde yeteneklerinizi ve öğrenmek istediklerinizi ekleyerek 
            daha fazla kişiyle eşleşebilirsiniz.
          </Alert>
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
              <strong>{matches.length}</strong> kişi ile karşılıklı eşleşme bulundu!
            </Typography>
            <div className="matches-grid">
              {matches.map((match) => (
                <div key={match.id} className="match-card">
                  <div className="match-card-header">
                    <div>
                      <h3>{match.kullanici_adi}</h3>
                      <span className="match-email">{match.email}</span>
                    </div>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Send />}
                      onClick={() => handleSendRequest(match.id, match.kullanici_adi)}
                      disabled={sendingRequests.has(match.id)}
                      sx={{ mt: 1 }}
                    >
                      {sendingRequests.has(match.id) ? 'Gönderiliyor...' : 'Eşleşme İsteği Gönder'}
                    </Button>
                  </div>
                  
                  <div className="match-skills-section">
                    <div className="match-skills-group">
                      <h4 className="match-skills-title">
                        <span className="skill-icon">🎯</span>
                        Sizin İhtiyacınız Olan Beceriler (Onların Sundukları)
                      </h4>
                      <div className="match-skills-list">
                        {match.matched_skills_a_needs && match.matched_skills_a_needs.length > 0 ? (
                          match.matched_skills_a_needs.map((skill, idx) => (
                            <Chip
                              key={idx}
                              label={`${skill.skill_name} (${skill.skill_category})`}
                              size="small"
                              color="primary"
                              sx={{ m: 0.5 }}
                            />
                          ))
                        ) : (
                          <span className="no-skills">Eşleşme yok</span>
                        )}
                      </div>
                    </div>

                    <div className="match-skills-group">
                      <h4 className="match-skills-title">
                        <span className="skill-icon">💡</span>
                        Onların İhtiyacı Olan Beceriler (Sizin Sunduklarınız)
                      </h4>
                      <div className="match-skills-list">
                        {match.matched_skills_b_needs && match.matched_skills_b_needs.length > 0 ? (
                          match.matched_skills_b_needs.map((skill, idx) => (
                            <Chip
                              key={idx}
                              label={`${skill.skill_name} (${skill.skill_category})`}
                              size="small"
                              color="secondary"
                              sx={{ m: 0.5 }}
                            />
                          ))
                        ) : (
                          <span className="no-skills">Eşleşme yok</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
      </div>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DiscoverPage;

