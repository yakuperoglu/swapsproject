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
      <div className="contact-page-wrapper">
        <div className="contact-page-container">
          <h1>İletişim</h1>
          <p>Bize ulaşmak için aşağıdaki formu doldurabilirsiniz.</p>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Adınız Soyadınız</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">E-posta Adresiniz</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Mesajınız</label>
              <textarea id="message" name="message" rows="6" required></textarea>
            </div>
            <button type="submit" className="submit-btn">Gönder</button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactPage;
