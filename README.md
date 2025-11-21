# SwapS - Beceri Takas Platformu

**SwapS**, kullanıcıların becerilerini paylaşarak karşılıklı öğrenme ve işbirliği yapabileceği modern bir skill swap (beceri takas) platformudur. Kullanıcılar sahip oldukları becerileri sunabilir (Offering), ihtiyaç duydukları becerileri arayabilir (Seeking) ve karşılıklı eşleşmeler bularak projeler üzerinde işbirliği yapabilir.

---

## 🚀 Canlı Demo

**Frontend:** [https://swaps.com.tr](https://swaps.com.tr)

### 🎯 Hızlı Test için Demo Hesaplar:
- **Kullanıcı Adı:** `user` | **Şifre:** `user`
- **Kullanıcı Adı:** `test` | **Şifre:** `test`
- **Admin:** `admin1@gmail.com` | **Şifre:** `admin-1`

---

## 📋 Özellikler

- ✅ **HTML5 Semantic Markup**: Modern web standartları ile erişilebilir yapı
- ✅ **Kullanıcı Yönetimi**: Kayıt, giriş ve profil ayarları
- ✅ **Beceri Yönetimi**: Offering (sunulan) ve Seeking (aranan) beceriler
- ✅ **Karşılıklı Eşleşme**: İki yönlü beceri eşleşmesi algoritması
- ✅ **Proje Sistemi**: Proje oluşturma, düzenleme ve başvuru yapma
- ✅ **Mesajlaşma**: Kullanıcılar arası gerçek zamanlı mesajlaşma
- ✅ **Dashboard**: Devam eden işler, teklifler ve öneriler
- ✅ **Admin Paneli**: Kullanıcı ve beceri yönetimi
- ✅ **Responsive Tasarım**: Mobil ve desktop uyumlu modern arayüz

---

## 🌐 HTML5 Özellikleri

Proje modern **HTML5 standartlarına** tam uyumludur:

### Semantic HTML5 Elements
- ✅ `<header>` - Sayfa başlıkları ve navigasyon
- ✅ `<nav>` - Navigasyon menüleri
- ✅ `<main>` - Ana içerik alanı
- ✅ `<section>` - İçerik bölümleri
- ✅ `<article>` - Bağımsız içerik blokları
- ✅ `<footer>` - Sayfa alt bilgisi

### HTML5 Form Features
- ✅ `<input type="email">` - Email validasyonu
- ✅ `<input type="password">` - Şifre alanları
- ✅ `required` attribute - Zorunlu alan kontrolü
- ✅ `aria-label` - Erişilebilirlik özellikleri

### HTML5 Meta Tags
- ✅ `<!DOCTYPE html>` - HTML5 deklarasyonu
- ✅ `<meta charset="UTF-8">` - Karakter seti
- ✅ `<meta name="viewport">` - Responsive tasarım
- ✅ Open Graph meta tags - Sosyal medya entegrasyonu

---

## 🛠️ Kullanılan Teknolojiler

### Frontend
- **HTML5** - Semantic markup ve modern web standartları
- **React 19.2.0** - Modern UI kütüphanesi
- **Vite** - Hızlı geliştirme ortamı
- **Material-UI (MUI) v7** - Modern komponent kütüphanesi
- **React Router DOM** - Sayfa yönlendirme
- **Axios** - HTTP istekleri
- **Emotion** - CSS-in-JS styling

### Backend
- **Node.js** - JavaScript runtime
- **Express 5** - Web framework
- **PostgreSQL** - İlişkisel veritabanı
- **JWT** - Token tabanlı kimlik doğrulama
- **bcrypt** - Şifre hashleme
- **pg** - PostgreSQL client

### DevOps
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Docker** - Containerization support

---

## 📥 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/yakuperoglu/swapsproject.git
cd swapsproject
```

### 2. PostgreSQL Veritabanı Kurulumu

PostgreSQL'i başlatın ve veritabanını oluşturun:

```bash
# PostgreSQL'e bağlanın
psql -U postgres

# Veritabanını oluşturun
CREATE DATABASE swaps_db;

# Çıkış yapın
\q
```

### 3. Backend Kurulumu

```bash
cd backend
npm install
```

**Backend .env dosyası oluşturun:**

```bash
# .env dosyası oluşturun
touch .env
```

**Backend .env içeriği:**

```env
NODE_ENV=production
PORT=3000

# PostgreSQL Veritabanı Bağlantısı
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=swaps_db

# JWT Secret (güçlü bir anahtar kullanın)
JWT_SECRET=your_jwt_secret_key_here

# Frontend URL (CORS için)
FRONTEND_URL=http://localhost:5173
```

**Backend'i başlatın:**

```bash
npm start
# Sunucu http://localhost:3000 adresinde başlatılacak
```

> **Not:** Veritabanı tabloları ilk çalıştırmada otomatik olarak oluşturulur.

### 4. Frontend Kurulumu

Yeni bir terminal penceresi açın:

```bash
cd frontend
npm install
```

**Frontend .env dosyası oluşturun:**

```bash
# .env dosyası oluşturun
touch .env
```

**Frontend .env içeriği:**

```env
VITE_API_BASE_URL=http://localhost:3000
```

**Frontend'i başlatın:**

```bash
npm run dev
# Uygulama http://localhost:5173 adresinde açılacak
```

---

## 👤 Kullanıcı Giriş Bilgileri

### Demo Kullanıcı Hesapları

**Mock User 1:**
```
Kullanıcı Adı: user
Şifre: user
```

**Mock User 2:**
```
Kullanıcı Adı: test
Şifre: test
```

**Admin Hesabı:**
```
Email: admin1@gmail.com
Şifre: admin-1
```

> **Not:** 
> - Mock kullanıcılar için email alanına kullanıcı adını yazın (örn: "user")
> - Demo için sisteme yeni kullanıcı kaydı da yapabilirsiniz
> - Kayıt için herhangi bir doğrulama gerekmez

---

## 📡 API Endpoint Listesi

### Base URL
- **Local:** `http://localhost:3000`
- **Production:** `https://swaps-backend.onrender.com`

> **Not:** 🔒 işareti olan endpoint'ler için `Authorization: Bearer <TOKEN>` header'ı gereklidir.

---

### Kimlik Doğrulama (Authentication)

#### Kullanıcı Kaydı
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Yanıt:**
```json
{
  "message": "Kullanici basariyla olusturuldu!",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Kullanıcı Girişi
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user",
  "password": "user"
}
```

**Yanıt:**
```json
{
  "message": "Giris basarili! (Demo User)",
  "user": {
    "id": 100001,
    "username": "user",
    "email": "user@demo.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> **Not:** Mock kullanıcılar için email alanına kullanıcı adını yazın: `"user"` veya `"test"`

---

### Kullanıcı Profili

#### Profil Bilgilerini Getir
```http
GET /api/profile/:userId
```

#### Profil Ayarlarını Kaydet 🔒
```http
POST /api/profile/save-settings
Content-Type: application/json

{
  "userId": 1,
  "profileData": {
    "bio": "string",
    "location": "string",
    ...
  }
}
```

#### Hesabı Sil 🔒
```http
DELETE /api/profile/delete-account/:userId
```

---

### Yetenekler (Skills)

#### Tüm Yetenekleri Listele
```http
GET /api/skills
```

**Yanıt:**
```json
{
  "success": true,
  "skills": [
    {
      "id": 1,
      "name": "JavaScript",
      "category": "Programlama"
    },
    ...
  ]
}
```

#### Yeni Yetenek Ekle 🔒
```http
POST /api/skills
Content-Type: application/json

{
  "name": "React",
  "category": "Programlama"
}
```

#### Yetenek Güncelle 🔒
```http
PUT /api/skills/:skillId
Content-Type: application/json

{
  "name": "React Native",
  "category": "Programlama"
}
```

#### Yetenek Sil 🔒
```http
DELETE /api/skills/:skillId
```

#### Kategorileri Listele
```http
GET /api/categories
```

---

### Kullanıcı Becerileri (User Skills)

#### Kullanıcının Becerilerini Getir
```http
GET /user-skills/:userId
```

**Yanıt:**
```json
{
  "success": true,
  "offering": [
    {
      "id": 1,
      "skill_name": "JavaScript",
      "skill_category": "Programlama",
      "type": "Offering"
    }
  ],
  "seeking": [
    {
      "id": 2,
      "skill_name": "Python",
      "skill_category": "Programlama",
      "type": "Seeking"
    }
  ]
}
```

#### Kullanıcıya Beceri Ekle 🔒
```http
POST /user-skills
Content-Type: application/json

{
  "skill_id": 7,
  "type": "Offering"
}
```
> `type`: "Offering" (sunulan) veya "Seeking" (aranan)

#### Kullanıcıdan Beceri Sil 🔒
```http
DELETE /user-skills/:id
```

---

### Karşılıklı Eşleşme (Reciprocal Matching)

#### İki Yönlü Beceri Eşleşmelerini Getir 🔒
```http
GET /swaps/reciprocal
```

**Algoritma:**
- Kullanıcı A'nın **Seeking** becerileri = Kullanıcı B'nin **Offering** becerileri
- Kullanıcı B'nin **Seeking** becerileri = Kullanıcı A'nın **Offering** becerileri

**Yanıt:**
```json
{
  "success": true,
  "matches_count": 2,
  "matches": [
    {
      "id": 5,
      "kullanici_adi": "jane_smith",
      "email": "jane@example.com",
      "matched_skills_a_needs": [
        {
          "skill_id": 8,
          "skill_name": "Python",
          "skill_category": "Programlama"
        }
      ],
      "matched_skills_b_needs": [
        {
          "skill_id": 7,
          "skill_name": "JavaScript",
          "skill_category": "Programlama"
        }
      ]
    }
  ]
}
```

---

### Projeler (Projects)

#### Tüm Projeleri Listele
```http
GET /projects
```

#### Proje Detayı
```http
GET /projects/:id
```

#### Kullanıcının Projeleri 🔒
```http
GET /projects/my
```

#### Yeni Proje Oluştur 🔒
```http
POST /projects
Content-Type: application/json

{
  "title": "Web Sitesi Geliştirme",
  "description": "E-ticaret projesi için React developer aranıyor"
}
```

#### Proje Güncelle 🔒
```http
PUT /projects/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated Description"
}
```

#### Proje Sil 🔒
```http
DELETE /projects/:id
```

---

### Başvurular (Matches)

#### Kullanıcının Başvurularını Listele 🔒
```http
GET /matches/user
```

**Yanıt:**
```json
{
  "success": true,
  "applicantMatches": [],
  "receivedMatches": []
}
```

#### Projeye Başvur 🔒
```http
POST /matches
Content-Type: application/json

{
  "project_id": 5
}
```

#### Başvuru Durumu Güncelle 🔒
```http
PUT /matches/:id/status
Content-Type: application/json

{
  "status": "Accepted"
}
```
> `status`: "Pending", "Accepted", "Rejected"

#### Başvuru Sil 🔒
```http
DELETE /matches/:id
```

---

### Dashboard

#### Kullanıcı Görevleri 🔒

**Devam Eden İşler:**
```http
GET /user/tasks?filter=ongoing
```

**Bekleyen Teklifler:**
```http
GET /user/tasks?filter=offers
```

**Önerilen Projeler:**
```http
GET /user/tasks?filter=suggestions
```

---

### Mesajlaşma (Messages)

#### Yeni Mesaj Gönder 🔒
```http
POST /api/messages
Content-Type: application/json

{
  "receiver_id": 5,
  "content": "Merhaba, projeniz hakkında konuşabilir miyiz?"
}
```

#### Tüm Konuşmaları Listele 🔒
```http
GET /api/messages/conversations
```

#### İki Kullanıcı Arasındaki Konuşmayı Getir 🔒
```http
GET /api/messages/conversation/:otherUserId
```

---

### Eşleşme İstekleri (Swap Requests)

#### Eşleşme İsteği Gönder 🔒
```http
POST /swap-requests
Content-Type: application/json

{
  "receiver_id": 5
}
```

#### Gelen/Giden İstekleri Getir 🔒
```http
GET /swap-requests
```

**Yanıt:**
```json
{
  "success": true,
  "incoming": [],
  "outgoing": [],
  "accepted": []
}
```

#### İstek Durumu Güncelle 🔒
```http
PUT /swap-requests/:id/status
Content-Type: application/json

{
  "status": "Accepted"
}
```
> `status`: "Accepted" veya "Rejected"

---

### Admin Paneli 🔒

#### Tüm Kullanıcıları Listele
```http
GET /api/admin/users
```

#### Kullanıcı Güncelle
```http
PUT /api/admin/users/:userId
Content-Type: application/json

{
  "username": "new_username",
  "email": "new_email@example.com"
}
```

#### Kullanıcı Sil
```http
DELETE /api/admin/users/:userId
```

---

## 📱 Kullanım Senaryoları

### 1. Hızlı Başlangıç (Mock Kullanıcı ile)
1. Ana sayfada "Giriş Yap" butonuna tıklayın
2. Email alanına: `user` yazın
3. Şifre alanına: `user` yazın
4. Giriş yapın ve platformu keşfedin!

### 2. Yeni Kullanıcı Kaydı
1. Ana sayfada "Kayıt Ol" butonuna tıklayın
2. Kullanıcı adı, email ve şifre girin
3. Otomatik olarak giriş yapılır ve token alınır

### 3. Beceri Ekleme
1. Profil sayfasına gidin
2. "Offering" (Sunduğunuz beceriler) veya "Seeking" (Aradığınız beceriler) sekmesini seçin
3. Beceri ekleyin

### 4. Eşleşme Bulma
1. "Discover" sayfasına gidin
2. Karşılıklı eşleşen kullanıcıları görüntüleyin
3. İlgilendiğiniz kullanıcıya eşleşme isteği gönderin

### 5. Proje Oluşturma
1. Dashboard'da "Yeni Proje" butonuna tıklayın
2. Proje başlığı ve açıklama girin
3. Diğer kullanıcılar projenize başvurabilir

### 6. Mesajlaşma
1. Eşleştiğiniz kullanıcıyla mesajlaşmak için "Messages" sayfasına gidin
2. Konuşmayı başlatın veya devam ettirin

---

## 🏗️ Proje Yapısı

```
swapsproject/
├── backend/
│   ├── config/
│   │   └── database.js         # PostgreSQL bağlantı ayarları
│   ├── controllers/
│   │   ├── authController.js   # Kimlik doğrulama
│   │   └── messageController.js # Mesajlaşma
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── routes/
│   │   ├── authroutes.js
│   │   └── messageRoutes.js
│   ├── index.js                 # Ana server dosyası
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React bileşenleri
│   │   │   ├── Header.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── Discover.jsx
│   │   │   ├── MessagesPage.jsx
│   │   │   └── ...
│   │   ├── services/            # API servisleri
│   │   │   ├── authService.js
│   │   │   ├── skillsService.js
│   │   │   └── swapsService.js
│   │   ├── App.jsx              # Ana uygulama
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🐛 Hata Ayıklama

### Backend bağlanamıyor?
- PostgreSQL servisinin çalıştığından emin olun
- `.env` dosyasındaki veritabanı bilgilerini kontrol edin
- Port 3000'in kullanımda olmadığından emin olun

### Frontend backend'e bağlanamıyor?
- Backend sunucusunun çalıştığından emin olun
- `.env` dosyasındaki `VITE_API_BASE_URL` adresini kontrol edin
- CORS ayarlarını kontrol edin

### Token geçersiz hatası?
- Token'ınızın süresi dolmuş olabilir, yeniden giriş yapın
- `JWT_SECRET` değişkeninin backend'de doğru ayarlandığından emin olun

---

## 🤝 Katkıda Bulunma

Bu proje açık kaynaklıdır. Katkıda bulunmak için:

1. Bu repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 📞 İletişim

Proje ile ilgili sorularınız için:
- **GitHub:** [yakuperoglu](https://github.com/yakuperoglu)
- **Website:** [https://swaps.com.tr](https://swaps.com.tr)

---

## 🙏 Teşekkürler

SwapS platformunu kullandığınız için teşekkür ederiz! Becerilerinizi paylaşarak öğrenme topluluğuna katkıda bulunun.

**Happy Swapping! 🚀**
