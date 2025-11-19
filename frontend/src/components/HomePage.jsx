import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import Discover from './Discover';
import MyWork from './MyWork';

const HomePage = () => {
  const [activeView, setActiveView] = useState('discover');

  const renderContent = () => {
    switch (activeView) {
      case 'discover':
        return <Discover />;
      case 'my-work':
        return <MyWork />;
      default:
        return <Discover />;
    }
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-nav">
          <button 
            onClick={() => setActiveView('discover')} 
            className={activeView === 'discover' ? 'active' : ''}
          >
            Keşfet
          </button>
          <button 
            onClick={() => setActiveView('my-work')}
            className={activeView === 'my-work' ? 'active' : ''}
          >
            İşlerim
          </button>
        </div>
        <div className="profile-section">
          <Link to="/profile">Profil</Link>
        </div>
      </header>
      <main className="home-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default HomePage;
