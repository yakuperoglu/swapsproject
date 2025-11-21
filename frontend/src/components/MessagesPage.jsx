import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Divider,
  Avatar,
  Badge,
  InputAdornment,
} from '@mui/material';
import { Send, ArrowBack, Message, Search } from '@mui/icons-material';
import messageService from '../services/messageService';
import swapsService from '../services/swapsService';
import './MessagesPage.css';
import './ProfilePage.css';

const MessagesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    loadConversations();
  }, []);

  useEffect(() => {
    // URL'de userId varsa o konuşmayı aç
    if (userId && conversations.length > 0) {
      const user = conversations.find(c => c.other_user_id == userId);
      if (user) {
        setSelectedConversation(user);
        loadMessages(user.other_user_id);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [userId, conversations]);

  useEffect(() => {
    // Seçili konuşma varsa mesajları yükle ve otomatik yenile
    if (selectedConversation) {
      loadMessages(selectedConversation.other_user_id);
      
      // Her 3 saniyede bir mesajları yenile
      const interval = setInterval(() => {
        loadMessages(selectedConversation.other_user_id);
      }, 3000);
      
      setRefreshInterval(interval);
      
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Yeni mesaj geldiğinde scroll yap
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await messageService.getConversations();

      if (result.success) {
        setConversations(result.data.conversations || []);
        
        // URL'de userId varsa o konuşmayı seç
        if (userId) {
          const user = result.data.conversations.find(c => c.other_user_id == userId);
          if (user) {
            setSelectedConversation(user);
          }
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Konuşmalar yüklenirken hata:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId) => {
    try {
      const result = await messageService.getConversation(otherUserId);

      if (result.success) {
        setMessages(result.data.messages || []);
      }
    } catch (err) {
      console.error('Mesajlar yüklenirken hata:', err);
    }
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/messages/${conversation.other_user_id}`);
    loadMessages(conversation.other_user_id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) {
      return;
    }

    setSending(true);

    try {
      const result = await messageService.sendMessage(
        selectedConversation.other_user_id,
        newMessage.trim()
      );

      if (result.success) {
        setNewMessage('');
        // Mesajları yeniden yükle
        await loadMessages(selectedConversation.other_user_id);
        // Konuşmaları yeniden yükle (son mesaj güncellenir)
        await loadConversations();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err);
      setError('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dk`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} sa`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dakika önce`;
    
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentUserId = () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user).id;
      } catch (e) {
        return null;
      }
    }
    return null;
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
      <div className="profile-content messages-content">
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 0, bgcolor: '#f8f9fa' }}>
            {/* Konuşma Listesi */}
            <Box 
              sx={{ 
                width: '380px', 
                bgcolor: 'white',
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
              }}
            >
              {/* Başlık ve Arama */}
              <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8f9fa' }}>
                <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
                  Mesajlar
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Konuşma ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: '#e2e8f0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#cbd5e1',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                  }}
                />
              </Box>

              {/* Konuşma Listesi */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {filteredConversations.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Message sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz konuşma yok'}
                    </Typography>
                    {!searchQuery && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Kabul edilen eşleşmelerinizle mesajlaşabilirsiniz
                      </Typography>
                    )}
                  </Box>
                ) : (
                  filteredConversations.map((conversation) => {
                    const isSelected = selectedConversation?.other_user_id === conversation.other_user_id;
                    return (
                      <Box
                        key={conversation.other_user_id}
                        onClick={() => selectConversation(conversation)}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          bgcolor: isSelected ? '#eff6ff' : 'white',
                          borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: isSelected ? '#eff6ff' : '#f8fafc',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                              '& .MuiBadge-badge': {
                                bgcolor: '#10b981',
                                border: '2px solid white',
                                width: 12,
                                height: 12,
                              },
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: isSelected ? '#3b82f6' : '#8b5cf6',
                                width: 48,
                                height: 48,
                                fontWeight: 600,
                                fontSize: '1rem',
                              }}
                            >
                              {getInitials(conversation.other_user_name)}
                            </Avatar>
                          </Badge>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: isSelected ? 700 : 600,
                                color: '#1e293b',
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {conversation.other_user_name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#64748b',
                                fontSize: '0.85rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {conversation.last_message
                                ? conversation.last_message.content.length > 35
                                  ? conversation.last_message.content.substring(0, 35) + '...'
                                  : conversation.last_message.content
                                : 'Henüz mesaj yok'}
                            </Typography>
                          </Box>
                          {conversation.last_message && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#94a3b8',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatTime(conversation.last_message.timestamp)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>

            {/* Mesaj Alanı */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
              {selectedConversation ? (
                <>
                  {/* Mesaj Başlığı */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: 'white',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    <IconButton
                      onClick={() => navigate('/messages')}
                      size="small"
                      sx={{
                        color: '#64748b',
                        '&:hover': { bgcolor: '#f1f5f9' },
                      }}
                    >
                      <ArrowBack />
                    </IconButton>
                    <Avatar
                      sx={{
                        bgcolor: '#3b82f6',
                        width: 40,
                        height: 40,
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(selectedConversation.other_user_name)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.1rem' }}>
                        {selectedConversation.other_user_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {selectedConversation.other_user_email}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Mesajlar */}
                  <Box
                    sx={{
                      flex: 1,
                      overflow: 'auto',
                      p: 3,
                      background: '#f8fafc',
                      position: 'relative',
                    }}
                  >
                    {messages.length === 0 ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '100%',
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: '#e0e7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Message sx={{ fontSize: 40, color: '#6366f1' }} />
                        </Box>
                        <Typography variant="h6" sx={{ color: '#475569', fontWeight: 600 }}>
                          Henüz mesaj yok
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          İlk mesajınızı göndererek konuşmaya başlayın!
                        </Typography>
                      </Box>
                    ) : (
                      messages.map((message, index) => {
                        const isOwn = message.sender_id == getCurrentUserId();
                        const prevMessage = index > 0 ? messages[index - 1] : null;
                        const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
                        const showTime = !prevMessage || 
                          new Date(message.timestamp) - new Date(prevMessage.timestamp) > 300000; // 5 dakika

                        return (
                          <Box key={message.message_id}>
                            {showTime && (
                              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    bgcolor: '#e2e8f0',
                                    color: '#64748b',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {formatMessageTime(message.timestamp)}
                                </Typography>
                              </Box>
                            )}
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                mb: showAvatar ? 2 : 0.5,
                                gap: 1,
                                alignItems: 'flex-end',
                              }}
                            >
                              {!isOwn && (
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: '#8b5cf6',
                                    fontSize: '0.75rem',
                                    display: showAvatar ? 'flex' : 'none',
                                  }}
                                >
                                  {getInitials(selectedConversation.other_user_name)}
                                </Avatar>
                              )}
                              <Box
                                sx={{
                                  maxWidth: '65%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: isOwn ? 'flex-end' : 'flex-start',
                                }}
                              >
                                <Box
                                  sx={{
                                    p: 1.75,
                                    borderRadius: isOwn 
                                      ? '18px 18px 4px 18px' 
                                      : '18px 18px 18px 4px',
                                    bgcolor: isOwn 
                                      ? '#2563eb' 
                                      : '#ffffff',
                                    color: isOwn ? '#ffffff' : '#0f172a',
                                    boxShadow: isOwn
                                      ? '0 2px 8px rgba(37, 99, 235, 0.25)'
                                      : '0 2px 8px rgba(0,0,0,0.08)',
                                    transition: 'transform 0.2s ease',
                                    border: !isOwn ? '1px solid #e2e8f0' : 'none',
                                    '&:hover': {
                                      transform: 'translateY(-1px)',
                                      boxShadow: isOwn
                                        ? '0 4px 12px rgba(37, 99, 235, 0.35)'
                                        : '0 4px 12px rgba(0,0,0,0.12)',
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontSize: '0.95rem',
                                      lineHeight: 1.6,
                                      wordBreak: 'break-word',
                                      fontWeight: 400,
                                      color: isOwn ? '#ffffff' : '#0f172a',
                                      m: 0,
                                    }}
                                  >
                                    {message.content}
                                  </Typography>
                                </Box>
                                {showAvatar && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      mt: 0.5,
                                      px: 1,
                                      color: '#94a3b8',
                                      fontSize: '0.7rem',
                                    }}
                                  >
                                    {formatMessageTime(message.timestamp)}
                                  </Typography>
                                )}
                              </Box>
                              {isOwn && (
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: '#3b82f6',
                                    fontSize: '0.75rem',
                                    display: showAvatar ? 'flex' : 'none',
                                  }}
                                >
                                  {getInitials(
                                    JSON.parse(localStorage.getItem('user') || '{}').username || 'S'
                                  )}
                                </Avatar>
                              )}
                            </Box>
                          </Box>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </Box>

                  {/* Mesaj Gönderme */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: 'white',
                      borderTop: '1px solid #e2e8f0',
                      display: 'flex',
                      gap: 1.5,
                      alignItems: 'flex-end',
                    }}
                  >
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Mesajınızı yazın..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sending}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#f8fafc',
                          borderRadius: '24px',
                          '& fieldset': {
                            borderColor: '#e2e8f0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#cbd5e1',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                      }}
                    />
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      sx={{
                        bgcolor: newMessage.trim() ? '#3b82f6' : '#cbd5e1',
                        color: 'white',
                        width: 48,
                        height: 48,
                        '&:hover': {
                          bgcolor: newMessage.trim() ? '#2563eb' : '#cbd5e1',
                        },
                        '&:disabled': {
                          bgcolor: '#cbd5e1',
                        },
                        transition: 'all 0.2s ease',
                        boxShadow: newMessage.trim() 
                          ? '0 4px 12px rgba(59, 130, 246, 0.4)' 
                          : 'none',
                      }}
                    >
                      <Send />
                    </IconButton>
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    flexDirection: 'column',
                    gap: 3,
                    bgcolor: '#f8fafc',
                  }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      bgcolor: '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    <Message sx={{ fontSize: 64, color: '#6366f1' }} />
                  </Box>
                  <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                      Bir konuşma seçin
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                      Sol taraftan bir konuşma seçerek mesajlaşmaya başlayın
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;

