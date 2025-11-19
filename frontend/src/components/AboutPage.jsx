import React from 'react';
import './AboutPage.css';
import Header from './Header';
import Footer from './Footer';

const AboutPage = () => {
  const teamMembers = [
    'Yakup Eroğlu',
    'Efil Saylam',
    'Ömer Faruk Çerçil',
    'Şiray Sanem Bozdoğan'
  ];

  return (
    <>
      <Header />
      <div className="about-page-container">
        <div className="about-section">
          <h1>Proje Hakkında</h1>
          <p>
            SwapS, kullanıcıların becerilerini, hizmetlerini veya ürünlerini takas edebilecekleri bir platformdur. Amacımız, insanların paraya ihtiyaç duymadan ihtiyaçlarını karşılayabilecekleri bir topluluk oluşturmaktır.
          </p>
        </div>
        <div className="team-section">
          <h2>Ekibimiz</h2>
          <div className="team-members-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-member-card">
                {member}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;
