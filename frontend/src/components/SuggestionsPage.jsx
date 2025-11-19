import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SuggestionsPage.css';
import './ProfilePage.css';

const initialSuggestionTopics = [
  {
    id: 'languages',
    label: 'Yabancı Dil',
    suggestions: [
      {
        title: 'Almanca',
        detail: 'Günlük 10 kelime ezberle ve cümle içinde kullan.',
        username: 'DeutschMika',
      },
      {
        title: 'İtalyanca',
        detail: 'Duolingo + YouTube “Italian with Lucrezia” günlük 1 video.',
        username: 'ParisLeo',
      },
      {
        title: 'Fransızca',
        detail: 'Her gün 5 dakika dizi/şarkı dinle, aynı cümleyi tekrar et.',
        username: 'RomaNico',
      },
    ],
  },
  {
    id: 'coding',
    label: 'Yazılım & Kodlama',
    suggestions: [
      {
        title: 'C',
        detail: 'Her gün 1 küçük fonksiyon yaz ve terminalde derle.',
        username: 'PointerEJ',
      },
      {
        title: 'R',
        detail: 'Hazır veri seti aç, tek bir grafik çiz (plot, hist vb.).',
        username: 'Rstats',
      },
      {
        title: 'JavaScript',
        detail: 'Her gün tek bir etkileşim: butona tıklayınca yazı değişsin.',
        username: 'JSby',
      },
    ],
  },
  {
    id: 'design',
    label: 'Tasarım & Medya',
    suggestions: [
      {
        title: 'Photoshop',
        detail: '1 küçük kompozisyon yap: foto + yazı + renk düzeni.',
        username: 'PSVisionEJ',
      },
      {
        title: 'InDesign',
        detail: 'Günde 1 sayfa düzenle: başlık, iki sütun metin, görsel.',
        username: 'InDesign',
      },
      {
        title: 'Figma',
        detail: 'Her gün 1 bileşen tasarla: buton, kart veya login ekranı.',
        username: 'FigmaFlowEJ',
      },
    ],
  },
  {
    id: 'other',
    label: 'Diğer Yetenekler',
    suggestions: [
      {
        title: 'Yazma',
        detail: 'Kısa metinler üret, 3–4 cümlelik mini hikâyeler dene.',
        username: 'WordSmith',
      },
      {
        title: 'Fizik',
        detail: 'Bir formül seç, nereden geldiğini kendine açıklamaya çalış.',
        username: 'PhysKic',
      },
      {
        title: 'Felsefe',
        detail: 'Tek bir soruya odaklan: “Neden?” ve 1 paragraf yaz.',
        username: 'Socratic',
      },
    ],
  },
];

const skillCategoryOptions = {
  languages: {
    label: 'Dil',
    options: [
      'İngilizce',
      'Fransızca',
      'Almanca',
      'Korece',
      'Arapça',
      'Türkçe',
      'İtalyanca',
      'İspanyolca',
      'Japonca',
      'Çince',
      'Rusça',
      'Portekizce',
      'Yunanca',
      'İsveççe',
      'Norveççe',
      'Fince',
      'Hollandaca',
      'Lehçe',
      'Çekçe',
      'Macarca',
    ],
  },
  coding: {
    label: 'Yazılım & Kodlama',
    options: [
      'C',
      'C++',
      'C#',
      'Java',
      'JavaScript',
      'Python',
      'React',
      'Node.js',
      'HTML',
      'CSS',
      'TypeScript',
      'PHP',
      'Ruby',
      'Go',
      'Swift',
      'Kotlin',
      'Dart',
      'Flutter',
      'Angular',
      'Vue.js',
      'SQL',
      'MongoDB',
      'PostgreSQL',
      'Express.js',
      'Django',
      'Flask',
      'Spring Boot',
      '.NET',
      'ASP.NET',
      'Laravel',
      'Symfony',
      'Next.js',
      'Nuxt.js',
      'Svelte',
      'Rust',
      'Scala',
      'Perl',
      'R',
      'MATLAB',
      'Assembly',
    ],
  },
  design: {
    label: 'Tasarım & Medya',
    options: [
      'Photoshop',
      'Illustrator',
      'InDesign',
      'Figma',
      'Adobe XD',
      'Premiere Pro',
      'After Effects',
      'Lightroom',
      'Canva',
      'Video Editing',
      'Fotoğrafçılık',
      'UI/UX Tasarım',
      'Grafik Tasarım',
      'Web Tasarım',
      '3D Modelleme',
      'Blender',
      'Sketch',
      'InVision',
      'Zeplin',
      'Procreate',
    ],
  },
  other: {
    label: 'Diğer Yetenekler',
    options: [
      'Müzik',
      'Spor',
      'Sanat',
      'Edebiyat',
      'Matematik',
      'Fizik',
      'Kimya',
      'Biyoloji',
      'Tarih',
      'Felsefe',
      'Psikoloji',
      'İşletme',
      'Pazarlama',
      'Finans',
      'Muhasebe',
      'Proje Yönetimi',
      'Liderlik',
      'İletişim',
      'Sunum',
      'Yazma',
    ],
  },
};

const SuggestionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [suggestionTopics, setSuggestionTopics] = useState(initialSuggestionTopics);
  const [activeTopic, setActiveTopic] = useState('all');
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareForm, setShareForm] = useState({
    category: '',
    skill: '',
    description: '',
  });

  const menuItems = [
    { path: '/profile', label: 'Profil', icon: '👤' },
    { path: '/discover', label: 'Keşfet', icon: '🔍' },
    { path: '/suggestions', label: 'Öneriler', icon: '💡' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const visibleTopics =
    activeTopic === 'all'
      ? suggestionTopics
      : suggestionTopics.filter((topic) => topic.id === activeTopic);

  const handleShareChange = (field, value) => {
    setShareForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'category' ? { skill: '' } : {}),
    }));
  };

  const getCurrentUsername = () => {
    if (typeof window === 'undefined') return 'Anonim';
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) return 'Anonim';
      const user = JSON.parse(savedUser);
      return user?.username || 'Anonim';
    } catch (error) {
      console.error('Username parse error:', error);
      return 'Anonim';
    }
  };

  const handleShareSubmit = (e) => {
    e.preventDefault();
    if (!shareForm.category || !shareForm.skill || !shareForm.description.trim()) {
      alert('Lütfen kategori, yetenek ve açıklama alanlarını doldurun.');
      return;
    }

    const newSuggestion = {
      title: shareForm.skill,
      detail: shareForm.description.trim(),
      username: getCurrentUsername(),
    };

    setSuggestionTopics((prev) =>
      prev.map((topic) =>
        topic.id === shareForm.category
          ? { ...topic, suggestions: [newSuggestion, ...topic.suggestions] }
          : topic
      )
    );

    setShareForm({
      category: '',
      skill: '',
      description: '',
    });
    setShowShareForm(false);
    alert('Önerin toplulukla paylaşıldı!');
  };

  return (
    <div className="profile-layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Menü</h2>
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
        <div className="suggestions-hero-wrapper">
          <div className="suggestions-hero">
            <div className="suggestions-hero-text">
              <p className="hero-subtitle">Öneriler</p>
              <p className="hero-description">
                Öğrenmek istediğin yetenek için hazırladığımız önerilere göz at! Kendi
                önerini paylaşarak diğer kullanıcıların da faydalanmasını
                sağlayabilirsin.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="share-button"
            onClick={() => setShowShareForm((prev) => !prev)}
          >
            Önerini Paylaş
          </button>
        </div>

        {showShareForm && (
          <form className="share-form" onSubmit={handleShareSubmit}>
            <div className="share-selects">
              <div className="share-field">
                <label>Kategori</label>
                <select
                  value={shareForm.category}
                  onChange={(e) => handleShareChange('category', e.target.value)}
                >
                  <option value="">Seçiniz</option>
                  {Object.entries(skillCategoryOptions).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="share-field">
                <label>Yetenek</label>
                <select
                  value={shareForm.skill}
                  onChange={(e) => handleShareChange('skill', e.target.value)}
                  disabled={!shareForm.category}
                >
                  <option value="">
                    {shareForm.category ? 'Yetenek seçiniz' : 'Önce kategori seçin'}
                  </option>
                  {shareForm.category &&
                    skillCategoryOptions[shareForm.category].options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="share-field">
              <label>Açıklama</label>
              <textarea
                rows="4"
                placeholder="Önerini detaylıca yaz..."
                value={shareForm.description}
                onChange={(e) => handleShareChange('description', e.target.value)}
              />
            </div>
            <div className="share-actions">
              <button type="submit" className="share-submit">
                Paylaş
              </button>
            </div>
          </form>
        )}

        <div className="topic-filter">
          <button
            className={`topic-chip ${activeTopic === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTopic('all')}
          >
            Tümü
          </button>
          {suggestionTopics.map((topic) => (
            <button
              key={topic.id}
              className={`topic-chip ${activeTopic === topic.id ? 'active' : ''}`}
              onClick={() => setActiveTopic(topic.id)}
            >
              {topic.label}
            </button>
          ))}
        </div>

        <div className="suggestion-grid">
          {visibleTopics.map((topic) => (
            <section key={topic.id} className="suggestion-section">
              <div className="section-header">
                <h2>{topic.label}</h2>
                <span>{topic.suggestions.length} öneri</span>
              </div>
              <div className="suggestion-cards">
                {topic.suggestions.map((item) => (
                  <div key={item.title} className="suggestion-card">
                    <div className="card-header">
                      <span className="suggestion-tag">{item.title}</span>
                    </div>
                    <p className="suggestion-detail">{item.detail}</p>
                    <div className="suggestion-user">
                      <span>Örnek kullanıcı:</span>
                      <strong>{item.username}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestionsPage;

