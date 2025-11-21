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
      <main className="about-page-container">
        <section className="about-section">
          <h1>Proje Hakkında</h1>
          <article>
            <p>
              SwapS, kullanıcıların becerilerini, hizmetlerini veya ürünlerini takas edebilecekleri bir platformdur. Amacımız, insanların paraya ihtiyaç duymadan ihtiyaçlarını karşılayabilecekleri bir topluluk oluşturmaktır.
            </p>
          </article>
        </section>
        <section className="team-section">
          <h2>Ekibimiz</h2>
          <div className="team-members-grid">
            {teamMembers.map((member, index) => (
              <article key={index} className="team-member-card">
                {member}
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
