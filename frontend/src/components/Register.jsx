import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, Cancel } from '@mui/icons-material';
import authService from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Şifre validasyonu
  const validatePassword = (password) => {
    const rules = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordRules(rules);
    return Object.values(rules).every((rule) => rule === true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Şifre değiştiğinde validasyon yap
    if (name === 'password') {
      validatePassword(value);
    }

    // Hata mesajını temizle
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasyonlar
    if (!formData.username.trim()) {
      setError('Kullanıcı adı gereklidir');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email gereklidir');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Geçerli bir email adresi giriniz');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Şifre tüm kuralları karşılamalıdır');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        // Token'ı localStorage'a kaydet (backend'den token gelirse)
        if (result.data.token) {
          localStorage.setItem('token', result.data.token);
        }
        if (result.data.user) {
          localStorage.setItem('user', JSON.stringify(result.data.user));
        }

        // Eğer backend'den token geldiyse direkt profil sayfasına yönlendir
        if (result.data.token) {
          navigate('/profile');
        } else {
          // Token yoksa otomatik olarak giriş yap
          const loginResult = await authService.login({
            email: formData.email,
            password: formData.password,
          });

          if (loginResult.success) {
            // Token'ı localStorage'a kaydet
            if (loginResult.data.token) {
              localStorage.setItem('token', loginResult.data.token);
            }
            if (loginResult.data.user) {
              localStorage.setItem('user', JSON.stringify(loginResult.data.user));
            }

            // Başarılı giriş sonrası profil sayfasına yönlendir
            navigate('/profile');
          } else {
            // Giriş başarısız, login sayfasına yönlendir
            navigate('/login', { 
              state: { 
                message: 'Kayıt başarılı! Ancak otomatik giriş yapılamadı. Lütfen giriş yapın.',
                email: formData.email 
              } 
            });
          }
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Register error:', error);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const PasswordRuleItem = ({ rule, label }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
      {rule ? (
        <CheckCircle sx={{ color: 'success.main', fontSize: '1rem' }} />
      ) : (
        <Cancel sx={{ color: 'error.main', fontSize: '1rem' }} />
      )}
      <Typography variant="body2" color={rule ? 'success.main' : 'text.secondary'}>
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'var(--primary-gradient)',
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
            Kayıt Ol
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="username"
                  label="Kullanıcı Adı"
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Adresi"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Şifre"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
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
                {formData.password && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Şifre Kuralları:
                    </Typography>
                    <PasswordRuleItem rule={passwordRules.minLength} label="En az 8 karakter" />
                    <PasswordRuleItem rule={passwordRules.hasUpperCase} label="En az 1 büyük harf" />
                    <PasswordRuleItem rule={passwordRules.hasLowerCase} label="En az 1 küçük harf" />
                    <PasswordRuleItem rule={passwordRules.hasNumber} label="En az 1 rakam" />
                    <PasswordRuleItem rule={passwordRules.hasSpecialChar} label="En az 1 özel karakter" />
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Şifre Tekrar"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  error={formData.confirmPassword && formData.password !== formData.confirmPassword}
                  helperText={
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'Şifreler eşleşmiyor'
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Kayıt Ol'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Zaten hesabınız var mı?{' '}
                <Link to="/login" style={{ textDecoration: 'none', color: 'var(--primary-accent)' }}>
                  Giriş Yap
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

export default Register;

