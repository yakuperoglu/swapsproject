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
        title: '📘 Almanca',
        detail: 'Her gün 5 kelime + 1 cümle kur, ritim hemen oturur.',
        username: 'DeutschDrifter',
      },
      {
        title: '🎧 İngilizce',
        detail: 'Kısa videoları altyazıyla izle, yüksek sesle tekrar et, telaffuz çok hızlı gelişir.',
        username: 'LexiLooper',
      },
      {
        title: '🎤 Fransızca',
        detail: 'Günde 5 dakika sesli okuma yap, dilin melodisini çok hızlı kaparsın.',
        username: 'ParisPhraser',
      },
    ],
  },
  {
    id: 'music',
    label: 'Müzik',
    suggestions: [
      {
        title: '🥁 Davul',
        detail: 'Her gün 10 dakika temel ritimleri (8’lik – 16’lık) tekrar et, koordinasyon çok hızlı oturur.',
        username: 'DrumPulseX',
      },
      {
        title: '🎸 Gitar',
        detail: 'Akor geçişlerini yavaş çalış, parmaklar alıştıkça hız kendiliğinden gelir.',
        username: 'ChordRider',
      },
      {
        title: '🎻 Keman',
        detail: 'Yay kontrolüne odaklan, temiz ton doğru yay açısı + sabit hareketten gelir.',
        username: 'BowFlow',
      },
    ],
  },
  {
    id: 'coding',
    label: 'Programlama',
    suggestions: [
      {
        title: '💻 C',
        detail: 'Her gün 1 tane pointer içeren küçük fonksiyon yaz, bellek mantığı çok daha hızlı oturur.',
        username: 'SegFaultSeeker',
      },
      {
        title: '🌐 JavaScript',
        detail: 'Günde 1 küçük etkileşim ekle (butona tıkla → yazı değişsin), DOM + JS bağlantısı kafanda netleşir.',
        username: 'AsyncNinja',
      },
      {
        title: '⚛️ React',
        detail: 'Önce sadece state ve props ile 2–3 bileşenli mini bir uygulama yaz, mantığı anlayınca hook’lara geç.',
        username: 'HookHunter',
      },
    ],
  },
  {
    id: 'design',
    label: 'Tasarım',
    suggestions: [
      {
        title: '🎨 Figma',
        detail: 'Her gün 1 küçük UI bileşeni tasarla, auto-layout mantığı çok hızlı oturur.',
        username: 'FrameWizard',
      },
      {
        title: '🖼️ Photoshop',
        detail: 'Basit düzenlemelerle başla (renk düzeltme, kesme, maskeleme), katman mantığı oturduktan sonra her şey kolaylaşır.',
        username: 'PixelCrafter',
      },
      {
        title: '📱 UI/UX',
        detail: 'Günde 1 uygulamayı incele, “Neden böyle tasarlamışlar?” sorusunu sorarak alışkanlık kazan.',
        username: 'FlowSensei',
      },
    ],
  },
];

const skillCategoryOptions = {
  languages: {
    label: 'Yabancı Dil',
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
  music: {
    label: 'Müzik',
    options: [
      'Davul',
      'Gitar',
      'Keman',
      'Piyano',
      'Bateri',
      'Şan',
      'Bas Gitar',
      'Saksafon',
      'Viyola',
    ],
  },
  coding: {
    label: 'Programlama',
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
    label: 'Tasarım',
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

