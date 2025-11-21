import React from 'react';
import './Features.css';

const Features = () => {
  return (
    <section id="features" className="features">
      <h2>Özellikler</h2>
      <div className="feature-cards">
        <article className="card">
          <h3>🚀 Akıllı Matchmaking</h3>
          <p>Sunduğun beceriyi, öğrenmek istediğin beceriyle eşleştiren dinamik algoritma. Doğru insanları saniyeler içinde bul, zaman kaybetme.</p>
        </article>
        <article className="card">
          <h3>📚 Her Alanda Beceriler</h3>
          <p>UI/UX, yazılım, çeviri, fotoğrafçılık, finans, müzik… Aradığın ne olursa olsun, mutlaka bir eşleşme vardır.</p>
        </article>
        <article className="card">
          <h3>🔐 Güvenli Takas Ekosistemi</h3>
          <p>Kimlik doğrulama, güvenli mesajlaşma, proje yönetimi. Takas sürecinin her adımı şeffaf, güvenli ve kontrol sende.</p>
        </article>
      </div>
    </section>
  );
};

export default Features;
