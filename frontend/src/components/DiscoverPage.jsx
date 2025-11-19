import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DiscoverPage.css';
import './ProfilePage.css';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/profile', label: 'Profil', icon: '👤' },
    { path: '/discover', label: 'Keşfet', icon: '🔍' },
    { path: '/suggestions', label: 'Öneriler', icon: '💡' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
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
      <div className="profile-content">
        <h1>Keşfet</h1>
        <p>Bu sayfa yakında doldurulacak. İnsanlar burada aradıkları skillere sahip olan kişileri bulabilecek.</p>
      </div>
    </div>
  );
};

export default DiscoverPage;

