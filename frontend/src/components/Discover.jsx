import React from 'react';
import './Discover.css';

const Discover = () => {
  return (
    <div className="discover-container">
      <h2>Keşfet</h2>
      <p>Burada yeni işler ve projeler keşfedebilirsiniz.</p>
      <div className="placeholder-grid">
        <div className="placeholder-card">Proje 1</div>
        <div className="placeholder-card">Proje 2</div>
        <div className="placeholder-card">Proje 3</div>
        <div className="placeholder-card">Proje 4</div>
      </div>
    </div>
  );
};

export default Discover;
