import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CircularProgress,
  Alert,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Snackbar,
} from '@mui/material';
import { Check, Close, Send, Person, Message } from '@mui/icons-material';
import swapsService from '../services/swapsService';
import './RequestsPage.css';
import './ProfilePage.css';

const RequestsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [requests, setRequests] = useState({
    incoming: [],
    outgoing: [],
    accepted: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [processingRequests, setProcessingRequests] = useState(new Set());
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
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.');
      setLoading(false);
      return;
    }

    try {
      const result = await swapsService.getSwapRequests();

      if (result.success) {
        setRequests({
          incoming: result.data.incoming || [],
          outgoing: result.data.outgoing || [],
          accepted: result.data.accepted || [],
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('İstekler yüklenirken hata:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId, userName) => {
    if (processingRequests.has(requestId)) {
      return;
    }

    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      const result = await swapsService.updateSwapRequestStatus(requestId, 'Accepted');

      if (result.success) {
        setSnackbar({
          open: true,
          message: `${userName} kullanıcısının isteği kabul edildi!`,
          severity: 'success',
        });
        // İstekleri yeniden yükle
        await fetchRequests();
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'İstek kabul edilemedi',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('İstek kabul etme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        severity: 'error',
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId, userName) => {
    if (processingRequests.has(requestId)) {
      return;
    }

    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      const result = await swapsService.updateSwapRequestStatus(requestId, 'Rejected');

      if (result.success) {
        setSnackbar({
          open: true,
          message: `${userName} kullanıcısının isteği reddedildi.`,
          severity: 'info',
        });
        // İstekleri yeniden yükle
        await fetchRequests();
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'İstek reddedilemedi',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('İstek reddetme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        severity: 'error',
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="profile-content requests-content">
        <div className="requests-header">
          <h1>İsteklerim</h1>
          <p className="requests-subtitle">
            Gelen ve giden eşleşme isteklerinizi yönetin
          </p>
        </div>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="istek sekmesi">
                <Tab
                  label={`Gelen İstekler (${requests.incoming.length})`}
                  icon={<Person />}
                  iconPosition="start"
                />
                <Tab
                  label={`Giden İstekler (${requests.outgoing.length})`}
                  icon={<Send />}
                  iconPosition="start"
                />
                <Tab
                  label={`Kabul Edilenler (${requests.accepted.length})`}
                  icon={<Check />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Gelen İstekler */}
            {activeTab === 0 && (
              <div className="requests-list">
                {requests.incoming.length === 0 ? (
                  <Alert severity="info">
                    Henüz gelen istek bulunmuyor.
                  </Alert>
                ) : (
                  requests.incoming.map((request) => (
                    <Card key={request.id} className="request-card">
                      <CardContent>
                        <div className="request-header">
                          <div>
                            <Typography variant="h6" component="div">
                              {request.sender_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.sender_email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              {formatDate(request.olusturulma_tarihi)}
                            </Typography>
                          </div>
                          <Chip label="Beklemede" color="warning" />
                        </div>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<Check />}
                            onClick={() => handleAccept(request.id, request.sender_name)}
                            disabled={processingRequests.has(request.id)}
                          >
                            {processingRequests.has(request.id) ? 'İşleniyor...' : 'Kabul Et'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Close />}
                            onClick={() => handleReject(request.id, request.sender_name)}
                            disabled={processingRequests.has(request.id)}
                          >
                            Reddet
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Giden İstekler */}
            {activeTab === 1 && (
              <div className="requests-list">
                {requests.outgoing.length === 0 ? (
                  <Alert severity="info">
                    Henüz gönderilmiş istek bulunmuyor.
                  </Alert>
                ) : (
                  requests.outgoing.map((request) => (
                    <Card key={request.id} className="request-card">
                      <CardContent>
                        <div className="request-header">
                          <div>
                            <Typography variant="h6" component="div">
                              {request.receiver_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.receiver_email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              {formatDate(request.olusturulma_tarihi)}
                            </Typography>
                          </div>
                          <Chip label="Beklemede" color="info" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Kabul Edilenler */}
            {activeTab === 2 && (
              <div className="requests-list">
                {requests.accepted.length === 0 ? (
                  <Alert severity="info">
                    Henüz kabul edilmiş istek bulunmuyor.
                  </Alert>
                ) : (
                  requests.accepted.map((request) => (
                    <Card key={request.id} className="request-card accepted-card">
                      <CardContent>
                        <div className="request-header">
                          <div>
                            <Typography variant="h6" component="div">
                              {request.other_user_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.other_user_email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Kabul edildi: {formatDate(request.guncelleme_tarihi)}
                            </Typography>
                          </div>
                          <Chip label="Kabul Edildi" color="success" />
                        </div>
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Message />}
                            onClick={() => navigate(`/messages/${request.other_user_id}`)}
                          >
                            Mesaj Gönder
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
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

export default RequestsPage;

