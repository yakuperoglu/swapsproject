# 🚀 Render PostgreSQL Entegrasyon Rehberi

Bu rehber, SwapS projesini Render.com platformu üzerinde PostgreSQL veritabanı ile deploy etmek için gerekli adımları içerir.

## 📋 İçindekiler

1. [Render PostgreSQL Veritabanı Oluşturma](#1-render-postgresql-veritabanı-oluşturma)
2. [Backend Web Service Oluşturma](#2-backend-web-service-oluşturma)
3. [Frontend Static Site Oluşturma](#3-frontend-static-site-oluşturma)
4. [Yerel Geliştirme Ortamı Kurulumu](#4-yerel-geliştirme-ortamı-kurulumu)
5. [Docker ile Çalıştırma](#5-docker-ile-çalıştırma)

---

## 1. Render PostgreSQL Veritabanı Oluşturma

### Adım 1: Render'a Giriş Yapın
1. [Render.com](https://render.com) adresine gidin
2. GitHub hesabınızla giriş yapın (Sign up with GitHub)

### Adım 2: Yeni PostgreSQL Database Oluşturun
1. Dashboard'da **"New +"** butonuna tıklayın
2. **"PostgreSQL"** seçeneğini seçin
3. Veritabanı bilgilerini girin:
   - **Name:** `swaps-postgres` (veya istediğiniz bir isim)
   - **Database:** `swaps_db`
   - **User:** `swaps_user` (otomatik oluşturulur)
   - **Region:** `Frankfurt (EU Central)` (veya size yakın bölge)
   - **Plan:** `Free` (başlangıç için yeterli)
4. **"Create Database"** butonuna tıklayın

### Adım 3: Veritabanı Bağlantı Bilgilerini Alın

Veritabanı oluşturulduktan sonra, sayfanın üst kısmındaki **"Info"** sekmesinde aşağıdaki bilgileri bulacaksınız:

```
Hostname: dpg-xxxxx.frankfurt-postgres.render.com
Port: 5432
Database: swaps_db
Username: swaps_user
Password: xxxxxxxxxxxxxxxxxxxxxx
```

**Önemli:** 
- **Internal Database URL** (aynı Render hesabındaki servisler için)
- **External Database URL** (yerel geliştirme veya harici bağlantılar için)

Her iki URL'yi de kaydedin!

---

## 2. Backend Web Service Oluşturma

### Seçenek 1: Blueprint ile Otomatik Deploy (Önerilen)

Proje kök dizininde `render.yaml` dosyası mevcut. Bu dosya tüm servisleri otomatik olarak oluşturacak.

1. Dashboard'da **"New +" → "Blueprint"** seçin
2. GitHub repository'nizi bağlayın
3. `render.yaml` dosyası otomatik algılanacak
4. **"Apply"** butonuna tıklayın
5. Render otomatik olarak:
   - PostgreSQL database
   - Backend web service
   - Frontend static site
   
   oluşturacak ve deploy edecek.

### Seçenek 2: Manuel Web Service Oluşturma

1. Dashboard'da **"New +" → "Web Service"** seçin
2. GitHub repository'nizi bağlayın
3. Ayarları yapın:

```
Name: swaps-backend
Region: Frankfurt (EU Central)
Branch: main
Root Directory: backend
Environment: Node
Build Command: npm install
Start Command: node index.js
Plan: Free
```

4. **Environment Variables** ekleyin:

```env
NODE_ENV=production
PORT=3000
DB_HOST=<internal-database-host>
DB_PORT=5432
DB_USER=swaps_user
DB_PASSWORD=<database-password>
DB_NAME=swaps_db
JWT_SECRET=<strong-random-secret-min-32-chars>
FRONTEND_URL=https://your-frontend-url.onrender.com
```

**Not:** `DB_HOST`, `DB_PASSWORD` değerlerini PostgreSQL Info sekmesinden kopyalayın.

5. **"Create Web Service"** butonuna tıklayın

---

## 3. Frontend Static Site Oluşturma

### Manuel Static Site Oluşturma

1. Dashboard'da **"New +" → "Static Site"** seçin
2. Aynı GitHub repository'nizi seçin
3. Ayarları yapın:

```
Name: swaps-frontend
Region: Frankfurt (EU Central)
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
Plan: Free
```

4. **Environment Variables** ekleyin:

```env
VITE_API_BASE_URL=https://swaps-backend.onrender.com
```

**Not:** Backend URL'inizi backend servisinizin URL'si ile değiştirin.

5. **"Create Static Site"** butonuna tıklayın

---

## 4. Yerel Geliştirme Ortamı Kurulumu

### Adım 1: .env Dosyası Oluşturun

Backend klasöründe `.env` dosyası oluşturun:

```bash
cd backend
touch .env  # Windows'da: type nul > .env
```

### Adım 2: Render Database Bilgilerini .env Dosyasına Ekleyin

Render PostgreSQL → Info → **External Database URL** kullanın (yerel geliştirme için):

```env
# Render PostgreSQL Database Configuration
DB_HOST=dpg-xxxxx.frankfurt-postgres.render.com
DB_PORT=5432
DB_USER=swaps_user
DB_PASSWORD=your-external-db-password-here
DB_NAME=swaps_db

# JWT Secret (Güçlü bir secret oluşturun)
JWT_SECRET=super-secret-jwt-key-min-32-characters-long-12345678

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### Adım 3: Veritabanını Test Edin

```bash
cd backend
npm install
node index.js
```

Başarılı bağlantı mesajını görmelisiniz:
```
✅ PostgreSQL veritabanına başarıyla bağlanıldı!
📊 Database: swaps_db
🌐 Host: dpg-xxxxx.frankfurt-postgres.render.com
```

---

## 5. Docker ile Çalıştırma

### Adım 1: Docker Compose ile Başlatın

Proje kök dizininde:

```bash
# Backend .env dosyasının dolu olduğundan emin olun
docker-compose up -d
```

### Adım 2: Logları Kontrol Edin

```bash
# Backend logları
docker logs swaps-backend

# Frontend logları
docker logs swaps-frontend
```

### Adım 3: Container'ları Yönetin

```bash
# Container'ları durdur
docker-compose down

# Container'ları yeniden başlat
docker-compose restart

# Container'ları temizle
docker-compose down -v
```

---

## 🔧 Veritabanı Schema Oluşturma

### Otomatik Schema Oluşturma

Uygulama ilk başladığında, `config/database.js` dosyası otomatik olarak tüm tabloları oluşturacak.

### Manuel Schema Oluşturma (Opsiyonel)

Render Dashboard → PostgreSQL → **"Shell"** sekmesine gidin ve `sema.sql` dosyasının içeriğini kopyalayıp çalıştırın.

Ya da yerel bilgisayarınızdan:

```bash
# psql kurulu olmalı
psql <EXTERNAL_DATABASE_URL> < backend/sema.sql
```

---

## 📊 Veritabanı Yapısı

Proje aşağıdaki tabloları kullanır:

- **Kullanicilar**: Kullanıcı bilgileri ve kimlik doğrulama
- **Yetenekler**: Beceri ve yetenek listesi (20 varsayılan yetenek)
- **Projects**: Kullanıcı projeleri
- **Matches**: Proje eşleşmeleri
- **Messages**: Kullanıcılar arası mesajlaşma

---

## 🐛 Sorun Giderme

### Bağlantı Hatası

```
❌ PostgreSQL bağlantı hatası: connect ETIMEDOUT
```

**Çözüm:**
- Render PostgreSQL servisinizin **Active** durumda olduğunu kontrol edin
- External Database URL kullandığınızdan emin olun (yerel geliştirme için)
- Internal Database URL kullanın (Render servisleri arası bağlantılar için)
- Render Free plan veritabanları 90 gün sonra devre dışı kalır, yeniden aktive edin

### Build Hatası

```
❌ Build failed
```

**Çözüm:**
- Root Directory doğru ayarlandığından emin olun (`backend` veya `frontend`)
- Build Command'ın doğru olduğunu kontrol edin
- Render Dashboard → Service → Logs bölümünden detaylı hataları inceleyin

### CORS Hatası

```
Access to fetch at '...' has been blocked by CORS policy
```

**Çözüm:**
- Backend environment variables'da `FRONTEND_URL` doğru ayarlandığından emin olun
- Frontend'de `VITE_API_BASE_URL` doğru backend URL'sini gösterdiğinden emin olun
- `backend/index.js` dosyasında CORS ayarlarını kontrol edin

### Free Plan Limitasyonları

Render Free Plan:
- **Web Services:** 15 dakika sonra sleep moduna girer
- **Databases:** 90 gün sonra otomatik silinir (activity yoksa)
- **Bandwidth:** 100 GB/ay
- **Build Minutes:** 400 dakika/ay

**Çözüm:**
- Upgrade to paid plan veya periyodik olarak servise istek gönderin
- Database'i korumak için düzenli query çalıştırın

---

## 🔐 Güvenlik Notları

1. **JWT Secret:** Üretim ortamında mutlaka güçlü bir secret kullanın (min 32 karakter)
2. **Environment Variables:** `.env` dosyasını asla Git'e commit etmeyin
3. **Database Password:** Render otomatik olarak güçlü şifreler oluşturur
4. **External Database URL:** Sadece gerektiğinde kullanın, Internal URL daha güvenlidir
5. **CORS:** Production'da sadece kendi domain'inizi allow edin

---

## 📈 Performans İyileştirmeleri

### Database Connection Pooling

PostgreSQL bağlantı havuzu ayarları (`backend/config/database.js`):

```javascript
const dbConfig = {
    // ...
    max: 10,                    // Maksimum bağlantı sayısı
    idleTimeoutMillis: 30000,   // Boşta bekletme süresi
    connectionTimeoutMillis: 60000, // Bağlantı timeout'u
};
```

### Backend Sleep Önleme (Free Plan)

Render Free plan servisleri 15 dakika sonra uyur. Bunu önlemek için:

**Seçenek 1:** UptimeRobot veya cron-job.org kullanarak periyodik ping gönderin

**Seçenek 2:** Frontend'den keep-alive interval ekleyin:

```javascript
// Frontend'de
setInterval(() => {
  fetch('https://your-backend.onrender.com/')
}, 14 * 60 * 1000); // Her 14 dakikada bir
```

---

## 📞 Destek

Sorun yaşarsanız:
1. Render Dashboard → Service → **Logs** bölümünü kontrol edin
2. `docker logs swaps-backend` ile container loglarını inceleyin
3. Render Community Forum: [community.render.com](https://community.render.com)
4. GitHub Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

## ✅ Checklist

Deploy etmeden önce:

- [ ] Render hesabı oluşturuldu
- [ ] GitHub repository Render'a bağlandı
- [ ] PostgreSQL database oluşturuldu
- [ ] Database bağlantı bilgileri alındı
- [ ] Backend web service oluşturuldu
- [ ] Backend environment variables ayarlandı
- [ ] Frontend static site oluşturuldu
- [ ] Frontend environment variables ayarlandı
- [ ] Her iki servis de başarıyla deploy edildi
- [ ] Database schema oluşturuldu
- [ ] Loglar kontrol edildi ve hata yok

---

## 🎯 Deployment URL'leri

Deploy sonrası URL'leriniz şu formatta olacak:

- **Backend:** `https://swaps-backend.onrender.com`
- **Frontend:** `https://swaps-frontend.onrender.com`
- **Database:** Internal ve External URL'ler Info sekmesinde

---

**Başarılar! 🚀**

## 🔗 Faydalı Linkler

- [Render Docs](https://render.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Node.js Deploy Guide](https://render.com/docs/deploy-node-express-app)
- [Static Sites on Render](https://render.com/docs/static-sites)

