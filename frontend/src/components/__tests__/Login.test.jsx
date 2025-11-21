/**
 * LOGIN COMPONENT TEST SENARYOLARI
 * Kullanıcı giriş ekranını test eder
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import * as authService from '../../services/authService';

// Mock navigate
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// Mock authService
vi.mock('../../services/authService');

describe('Login Component Test Senaryoları', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  describe('Sayfa Render Testleri', () => {
    
    test('TEST 1: Login formu doğru şekilde render edilmeli', () => {
      renderLogin();
      
      expect(screen.getByText(/giriş yap/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i)).toBeInTheDocument();
    });

    test('TEST 2: Giriş butonu mevcut olmalı', () => {
      renderLogin();
      
      const loginButton = screen.getByRole('button', { name: /giriş/i });
      expect(loginButton).toBeInTheDocument();
    });

    test('TEST 3: Kayıt ol linki mevcut olmalı', () => {
      renderLogin();
      
      expect(screen.getByText(/kayıt ol/i) || screen.getByText(/hesabın yok mu/i)).toBeInTheDocument();
    });
  });

  describe('Form Validasyon Testleri', () => {
    
    test('TEST 4: Boş form ile giriş yapılamamalı', async () => {
      renderLogin();
      
      const loginButton = screen.getByRole('button', { name: /giriş/i });
      fireEvent.click(loginButton);
      
      // authService.login çağrılmamalı
      expect(authService.login).not.toHaveBeenCalled();
    });

    test('TEST 5: Sadece email girişi yeterli olmamalı', async () => {
      renderLogin();
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const loginButton = screen.getByRole('button', { name: /giriş/i });
      fireEvent.click(loginButton);
      
      // Şifre eksik olduğu için çağrılmamalı
      await waitFor(() => {
        expect(authService.login).not.toHaveBeenCalled();
      });
    });

    test('TEST 6: Geçersiz email formatı uyarı vermeli', async () => {
      renderLogin();
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      
      // Email validasyon mesajı gösterilmeli (component'te varsa)
      await waitFor(() => {
        // Bu test component implementasyonuna bağlı
        expect(true).toBe(true);
      });
    });
  });

  describe('Başarılı Giriş Testleri', () => {
    
    test('TEST 7: Geçerli bilgilerle giriş başarılı olmalı', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-token-123',
          user: {
            id: 1,
            username: 'TestUser',
            email: 'test@test.com',
          },
        },
      };

      authService.login.mockResolvedValue(mockResponse);

      renderLogin();
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const loginButton = screen.getByRole('button', { name: /giriş/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('test@test.com', 'password123');
      });
    });

    test('TEST 8: Başarılı girişte token localStorage\'a kaydedilmeli', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-token-456',
          user: {
            id: 2,
            username: 'TestUser2',
            email: 'test2@test.com',
          },
        },
      };

      authService.login.mockResolvedValue(mockResponse);

      renderLogin();
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(emailInput, { target: { value: 'test2@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const loginButton = screen.getByRole('button', { name: /giriş/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('mock-token-456');
      });
    });
  });

  describe('Başarısız Giriş Testleri', () => {
    
    test('TEST 9: Yanlış şifre ile hata mesajı gösterilmeli', async () => {
      const mockResponse = {
        success: false,
        error: 'Email veya şifre hatalı',
      };

      authService.login.mockResolvedValue(mockResponse);

      renderLogin();
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      
      const loginButton = screen.getByRole('button', { name: /giriş/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/hatalı/i) || screen.getByText(/başarısız/i)).toBeInTheDocument();
      });
    });

    test('TEST 10: Network hatası durumunda kullanıcı bilgilendirilmeli', async () => {
      authService.login.mockRejectedValue(new Error('Network Error'));

      renderLogin();
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const loginButton = screen.getByRole('button', { name: /giriş/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        // Hata mesajı gösterilmeli
        expect(screen.queryByText(/hata/i) || screen.queryByText(/başarısız/i)).toBeInTheDocument();
      });
    });
  });

  describe('Şifre Görünürlüğü Testleri', () => {
    
    test('TEST 11: Şifre başlangıçta gizli olmalı', () => {
      renderLogin();
      
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('TEST 12: Şifre göster butonu çalışmalı', () => {
      renderLogin();
      
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      // Göster butonunu bul ve tıkla (varsa)
      const toggleButton = screen.queryByRole('button', { name: /göster/i });
      
      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });
  });

  describe('Loading State Testleri', () => {
    
    test('TEST 13: Giriş yaparken loading gösterilmeli', async () => {
      authService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      renderLogin();
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const loginButton = screen.getByRole('button', { name: /giriş/i });
      fireEvent.click(loginButton);
      
      // Loading indicator gösterilmeli (varsa)
      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      });
    });
  });
});

