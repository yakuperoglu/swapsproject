# SwapS Project

SwapS: Proje tabanlı beceri takas platformu. Kullanıcılar projelerini ve ihtiyaç duydukları becerileri paylaşır; diğer kullanıcılar kendi becerileriyle katkı sunarak karşılıklı kazan-kazan (skill swap) modeliyle işbirliği yapar.

---

## Kurulum ve Çalıştırma Adımları

### Gereksinimler
- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/USERNAME/SwapS-Project.git
cd SwapS-Project
```

### 2. PostgreSQL Veritabanını Oluşturun

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

# .env dosyasını oluşturun
cp .env.example .env
```

**Backend .env dosyasını düzenleyin:**

```env
NODE_ENV=development
PORT=3000

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=swaps_db

# JWT Secret
JWT_SECRET=your_super_secret_key_here

# Frontend URL (CORS için)
FRONTEND_URL=http://localhost:5173
```

**Backend'i başlatın:**

```bash
node index.js
# Sunucu http://localhost:3000 adresinde başlatılacak
```

> **Not:** Veritabanı şeması ilk çalıştırmada otomatik olarak oluşturulur.

### 4. Frontend Kurulumu

Yeni bir terminal açın:

```bash
cd frontend
npm install

# .env dosyasını oluşturun (gerekirse)
```

**Frontend .env dosyası:**

```env
VITE_API_BASE_URL=http://localhost:3000
```

**Frontend'i başlatın:**

```bash
npm run dev
# Uygulama http://localhost:5173 adresinde açılacak
```

---

## Kullanıcı Giriş Bilgileri

### Admin Hesabı
- **Email:** admin1@gmail.com
- **Şifre:** admin-1

### Test Kullanıcı Hesapları
Sisteme kayıt olarak yeni kullanıcı oluşturabilirsiniz veya mevcut test kullanıcıları kullanabilirsiniz (veritabanında varsa).

---

## API Endpoint Listesi

### Base URL
- **Local:** `http://localhost:3000`
- **Production:** `https://swaps-backend.onrender.com`

### Kimlik Doğrulama
- `POST /api/auth/register` - Yeni kullanıcı kaydı
  - Body: `{ username, email, password }`
- `POST /api/auth/login` - Kullanıcı girişi
  - Body: `{ email, password }`

### Kullanıcı Profili
- `GET /api/profile/:userId` - Kullanıcı profilini getir
- `POST /api/profile/save-settings` - Profil ayarlarını kaydet 🔒
  - Body: `{ userId, profileData }`
- `DELETE /api/profile/delete-account/:userId` - Hesabı sil 🔒

### Yetenekler (Skills)
- `GET /api/skills` - Tüm yetenekleri listele
- `POST /api/skills` - Yeni yetenek ekle 🔒
  - Body: `{ name, category }`
- `PUT /api/skills/:skillId` - Yetenek güncelle 🔒
  - Body: `{ name, category }`
- `DELETE /api/skills/:skillId` - Yetenek sil 🔒
- `GET /api/categories` - Tüm kategorileri listele

### Kullanıcı Becerileri (User Skills)
- `GET /user-skills/:userId` - Kullanıcının becerilerini getir (Offering/Seeking)
- `POST /user-skills` - Kullanıcıya beceri ekle 🔒
  - Body: `{ skill_id, type }` (type: "Offering" veya "Seeking")
- `DELETE /user-skills/:id` - Kullanıcıdan beceri sil 🔒

### Karşılıklı Eşleşme (Reciprocal Matching)
- `GET /swaps/reciprocal` - İki yönlü beceri eşleşmelerini getir 🔒
  - Kullanıcı A'nın Seeking becerileri = Kullanıcı B'nin Offering becerileri
  - Kullanıcı B'nin Seeking becerileri = Kullanıcı A'nın Offering becerileri

### Projeler
- `GET /projects` - Tüm projeleri listele
- `GET /projects/:id` - Proje detayı
- `GET /projects/my` - Kullanıcının projeleri 🔒
- `POST /projects` - Yeni proje oluştur 🔒
  - Body: `{ title, description }`
- `PUT /projects/:id` - Proje güncelle 🔒
  - Body: `{ title, description }`
- `DELETE /projects/:id` - Proje sil 🔒

### Başvurular (Matches)
- `GET /matches/user` - Kullanıcının başvurularını listele 🔒
- `POST /matches` - Projeye başvur 🔒
  - Body: `{ project_id }`
- `PUT /matches/:id/status` - Başvuru durumu güncelle 🔒
  - Body: `{ status }` (status: "Pending", "Accepted", "Rejected")
- `DELETE /matches/:id` - Başvuru sil 🔒

### Dashboard
- `GET /user/tasks?filter=ongoing` - Devam eden işler 🔒
- `GET /user/tasks?filter=offers` - Bekleyen teklifler 🔒
- `GET /user/tasks?filter=suggestions` - Önerilen projeler 🔒

### Mesajlaşma
- `POST /api/messages` - Yeni mesaj gönder 🔒
  - Body: `{ receiver_id, content }`
- `GET /api/messages/conversations` - Tüm konuşmaları listele 🔒
- `GET /api/messages/conversation/:otherUserId` - İki kişi arasındaki konuşmayı getir 🔒

### Eşleşme İstekleri (Swap Requests)
- `POST /swap-requests` - Eşleşme isteği gönder 🔒
  - Body: `{ receiver_id }`
- `GET /swap-requests` - Gelen/giden eşleşme isteklerini getir 🔒
- `PUT /swap-requests/:id/status` - İstek durumu güncelle 🔒
  - Body: `{ status }` (status: "Accepted", "Rejected")

### Admin
- `GET /api/admin/users` - Tüm kullanıcıları listele 🔒
- `PUT /api/admin/users/:userId` - Kullanıcı güncelle 🔒
  - Body: `{ username, email, profileData }`
- `DELETE /api/admin/users/:userId` - Kullanıcı sil 🔒

> **Not:** 🔒 Token gerekli endpoint'ler için `Authorization: Bearer <TOKEN>` header'ı gereklidir.

---

## Canlı Proje Linki

### 🌐 Production (Render.com)

**Frontend:** [https://swaps.com.tr](https://swaps.com.tr)

**Backend API:** [https://swaps-backend.onrender.com](https://swaps-backend.onrender.com)

### Deployment Bilgisi
- **Hosting:** Render.com (Free Tier)
- **Database:** PostgreSQL (Render Managed)
- **Auto-Deploy:** Her commit'te otomatik deploy edilir

---

## Lisans

MIT License
