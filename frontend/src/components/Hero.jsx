import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Takas Yapmanın Yeni Yolu</h1>
        <p>İhtiyaçlarınızı karşılamak için becerilerinizi takas edin.</p>
        <Link to="/login" className="cta-btn">Hemen Başla</Link>
      </div>
    </section>
  );
};

export default Hero;
