import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import authService from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Location state'ten mesaj ve email varsa göster
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // State'i temizle ki sayfa yenilendiğinde mesaj kaybolsun
      window.history.replaceState({}, document.title);
    }
    // Eğer email varsa formu otomatik doldur
    if (location.state?.email) {
      setFormData((prev) => ({
        ...prev,
        email: location.state.email,
      }));
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Hata mesajını temizle
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validasyonlar
    if (!formData.email.trim()) {
      setError('Email gereklidir');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Geçerli bir email adresi giriniz');
      return;
    }

    if (!formData.password) {
      setError('Şifre gereklidir');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        // Token'ı localStorage'a kaydet (backend'den dönen token varsa)
        if (result.data.token) {
          localStorage.setItem('token', result.data.token);
        }
      if (result.data.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }

      // Admin ise admin panele, normal kullanıcı ise profile sayfasına yönlendir
      if (result.data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Giriş Yap
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Adresi"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Şifre"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Giriş Yap'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Hesabınız yok mu?{' '}
                <Link to="/register" style={{ textDecoration: 'none', color: 'primary.main' }}>
                  Kayıt Ol
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;

