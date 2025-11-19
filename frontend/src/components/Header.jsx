import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logo from '/SwapS-Logo.svg';

const Header = () => {
  return (
    <header className="header">
      <Link to="/" className="logo">
        <img src={logo} alt="SwapS Logo" />
        <span>SwapS</span>
      </Link>
      <nav>
        <ul>
          <li><Link to="/about">Hakkında</Link></li>
          <li><Link to="/contact">İletişim</Link></li>
        </ul>
      </nav>
      <div className="auth-buttons">
        <Link to="/login" className="login-btn">Giriş Yap</Link>
        <Link to="/register" className="signup-btn">Kayıt Ol</Link>
      </div>
    </header>
  );
};

export default Header;
