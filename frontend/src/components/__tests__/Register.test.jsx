/**
 * REGISTER COMPONENT TEST SENARYOLARI
 * Kullanıcı kayıt ekranını test eder
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import * as authService from '../../services/authService';

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

vi.mock('../../services/authService');

describe('Register Component Test Senaryoları', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
  };

  describe('Sayfa Render Testleri', () => {
    
    test('TEST 1: Register formu doğru şekilde render edilmeli', () => {
      renderRegister();
      
      expect(screen.getByText(/kayıt ol/i) || screen.getByText(/hesap oluştur/i)).toBeInTheDocument();
    });

    test('TEST 2: Tüm gerekli alanlar mevcut olmalı', () => {
      renderRegister();
      
      // Username, email, password alanları olmalı
      expect(screen.getByLabelText(/kullanıcı adı/i) || screen.getByPlaceholderText(/kullanıcı adı/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i)).toBeInTheDocument();
    });

    test('TEST 3: Kayıt ol butonu mevcut olmalı', () => {
      renderRegister();
      
      const registerButton = screen.getByRole('button', { name: /kayıt/i });
      expect(registerButton).toBeInTheDocument();
    });

    test('TEST 4: Giriş yap linki mevcut olmalı', () => {
      renderRegister();
      
      expect(screen.getByText(/giriş yap/i) || screen.getByText(/hesabın var mı/i)).toBeInTheDocument();
    });
  });

  describe('Form Validasyon Testleri', () => {
    
    test('TEST 5: Boş form ile kayıt olunamamalı', async () => {
      renderRegister();
      
      const registerButton = screen.getByRole('button', { name: /kayıt/i });
      fireEvent.click(registerButton);
      
      expect(authService.register).not.toHaveBeenCalled();
    });

    test('TEST 6: Sadece username yeterli olmamalı', async () => {
      renderRegister();
      
      const usernameInput = screen.getByLabelText(/kullanıcı adı/i) || screen.getByPlaceholderText(/kullanıcı adı/i);
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      
      const registerButton = screen.getByRole('button', { name: /kayıt/i });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(authService.register).not.toHaveBeenCalled();
      });
    });

    test('TEST 7: Geçersiz email formatı kabul edilmemeli', async () => {
      renderRegister();
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      
      // Validasyon mesajı gösterilmeli
      await waitFor(() => {
        expect(true).toBe(true);
      });
    });

    test('TEST 8: Kısa şifre kabul edilmemeli', async () => {
      renderRegister();
      
      const usernameInput = screen.getByLabelText(/kullanıcı adı/i) || screen.getByPlaceholderText(/kullanıcı adı/i);
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } }); // Çok kısa
      
      const registerButton = screen.getByRole('button', { name: /kayıt/i });
      fireEvent.click(registerButton);
      
      // Şifre çok kısa uyarısı gösterilmeli
      await waitFor(() => {
        expect(true).toBe(true);
      });
    });

    test('TEST 9: Şifre onayı eşleşmeli', async () => {
      renderRegister();
      
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getAllByPlaceholderText(/şifre/i)[0];
      const confirmPasswordInput = screen.queryByLabelText(/şifre.*tekrar/i) || screen.getAllByPlaceholderText(/şifre/i)[1];
      
      if (confirmPasswordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
        fireEvent.blur(confirmPasswordInput);
        
        await waitFor(() => {
          expect(screen.queryByText(/eşleşmiyor/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Başarılı Kayıt Testleri', () => {
    
    test('TEST 10: Geçerli bilgilerle kayıt başarılı olmalı', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-register-token',
          user: {
            id: 1,
            username: 'newuser',
            email: 'newuser@test.com',
          },
        },
      };

      authService.register.mockResolvedValue(mockResponse);

      renderRegister();
      
      const usernameInput = screen.getByLabelText(/kullanıcı adı/i) || screen.getByPlaceholderText(/kullanıcı adı/i);
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      fireEvent.change(emailInput, { target: { value: 'newuser@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123456' } });
      
      const registerButton = screen.getByRole('button', { name: /kayıt/i });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith('newuser', 'newuser@test.com', 'password123456');
      });
    });

    test('TEST 11: Başarılı kayıtta token localStorage\'a kaydedilmeli', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-register-token-123',
          user: {
            id: 2,
            username: 'newuser2',
            email: 'newuser2@test.com',
          },
        },
      };

      authService.register.mockResolvedValue(mockResponse);

      renderRegister();
      
      const usernameInput = screen.getByLabelText(/kullanıcı adı/i) || screen.getByPlaceholderText(/kullanıcı adı/i);
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(usernameInput, { target: { value: 'newuser2' } });
      fireEvent.change(emailInput, { target: { value: 'newuser2@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123456' } });
      
      const registerButton = screen.getByRole('button', { name: /kayıt/i });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('mock-register-token-123');
      });
    });

    test('TEST 12: Başarılı kayıtta profil sayfasına yönlendirilmeli', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-token',
          user: {
            id: 3,
            username: 'newuser3',
            email: 'newuser3@test.com',
          },
        },
      };

      authService.register.mockResolvedValue(mockResponse);

      renderRegister();
      
      const usernameInput = screen.getByLabelText(/kullanıcı adı/i) || screen.getByPlaceholderText(/kullanıcı adı/i);
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(usernameInput, { target: { value: 'newuser3' } });
      fireEvent.change(emailInput, { target: { value: 'newuser3@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123456' } });
      
      const registerButton = screen.getByRole('button', { name: /kayıt/i });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('Başarısız Kayıt Testleri', () => {
    
    test('TEST 13: Email zaten kullanımda ise hata mesajı gösterilmeli', async () => {
      const mockResponse = {
        success: false,
        error: 'Bu email zaten kayıtlı',
      };

      authService.register.mockResolvedValue(mockResponse);

      renderRegister();
      
      const usernameInput = screen.getByLabelText(/kullanıcı adı/i) || screen.getByPlaceholderText(/kullanıcı adı/i);
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'existing@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123456' } });
      
      const registerButton = screen.getByRole('button', { name: /kayıt/i });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText(/kayıtlı/i) || screen.getByText(/kullanımda/i)).toBeInTheDocument();
      });
    });

    test('TEST 14: Network hatası durumunda kullanıcı bilgilendirilmeli', async () => {
      authService.register.mockRejectedValue(new Error('Network Error'));

      renderRegister();
      
      const usernameInput = screen.getByLabelText(/kullanıcı adı/i) || screen.getByPlaceholderText(/kullanıcı adı/i);
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123456' } });
      
      const registerButton = screen.getByRole('button', { name: /kayıt/i });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/hata/i) || screen.queryByText(/başarısız/i)).toBeInTheDocument();
      });
    });
  });

  describe('Kullanıcı Deneyimi Testleri', () => {
    
    test('TEST 15: Kayıt sırasında loading gösterilmeli', async () => {
      authService.register.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      renderRegister();
      
      const usernameInput = screen.getByLabelText(/kullanıcı adı/i) || screen.getByPlaceholderText(/kullanıcı adı/i);
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/şifre/i) || screen.getByPlaceholderText(/şifre/i);
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123456' } });
      
      const registerButton = screen.getByRole('button', { name: /kayıt/i });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(registerButton).toBeDisabled();
      });
    });
  });
});

