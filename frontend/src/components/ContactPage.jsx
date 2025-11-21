import React from 'react';
import './ContactPage.css';
import Header from './Header';
import Footer from './Footer';

const ContactPage = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Mesajınız gönderildi!');
  };

  return (
    <>
      <Header />
      <main className="contact-page-wrapper">
        <section className="contact-page-container">
          <h1>İletişim</h1>
          <p>Bize ulaşmak için aşağıdaki formu doldurabilirsiniz.</p>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Adınız Soyadınız</label>
              <input type="text" id="name" name="name" required aria-label="Adınız Soyadınız" />
            </div>
            <div className="form-group">
              <label htmlFor="email">E-posta Adresiniz</label>
              <input type="email" id="email" name="email" required aria-label="E-posta Adresiniz" />
            </div>
            <div className="form-group">
              <label htmlFor="message">Mesajınız</label>
              <textarea id="message" name="message" rows="6" required aria-label="Mesajınız"></textarea>
            </div>
            <button type="submit" className="submit-btn">Gönder</button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ContactPage;
