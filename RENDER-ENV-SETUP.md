# 🔐 Render Environment Variables Kurulum Rehberi

## 📝 .env Dosyası ile Otomatik Setup

Render'da `.env` dosyası kullanarak environment variables'ları otomatik ayarlayabilirsiniz.

## 🚀 Hızlı Kurulum

### Adım 1: PostgreSQL Database Oluşturun

1. Render Dashboard → **New + → PostgreSQL**
2. Ayarlar:
   ```
   Name: swaps-postgres
   Database: swaps_db
   User: swaps_user (otomatik)
   Region: Frankfurt
   Plan: Free
   ```
3. **Create Database** tıklayın

### Adım 2: Database Bağlantı Bilgilerini Alın

Database oluşturulduktan sonra → **Info** sekmesi

**Internal Database URL** (Render servisleri için):
```
postgresql://swaps_user:password123@dpg-xxxxx-a/swaps_db
```

Ayrı ayrı değerler:
```
Hostname: dpg-xxxxx-a.frankfurt-postgres.render.com
Port: 5432
Database: swaps_db
Username: swaps_user
Password: xxxxxxxxxxxxxx
```

### Adım 3: backend/.env Dosyasını Güncelleyin

Render size şu bilgileri sağladı:

```
Hostname:  dpg-d4equ1vpm1nc7390u320-a.frankfurt-postgres.render.com
Port:      5432
Database:  swapsdb_ivw9
Username:  yaqp
Password:  6xVluIkR2q6B1LukhK1V4vUBd3CBRiIP
```

`backend/.env` dosyasını açın ve aşağıdaki gibi doldurun:

```env
# PostgreSQL Database Configuration (Render Internal URL)
DB_HOST=dpg-d4equ1vpm1nc7390u320-a.frankfurt-postgres.render.com
DB_PORT=5432
DB_USER=yaqp
DB_PASSWORD=6xVluIkR2q6B1LukhK1V4vUBd3CBRiIP
DB_NAME=swapsdb_ivw9

# JWT Secret
JWT_SECRET=a3f8d9c2e7b1f6a5c8d4e9f2b7c3a6d8e1f4b9c7a2d5e8f1b6c9a3d7e2f5b8c1

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=https://swaps-frontend.onrender.com
```

### Adım 4: JWT Secret Oluşturun

Terminal'de çalıştırın:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Çıktıyı `.env` dosyasındaki `JWT_SECRET` değerine yapıştırın.

### Adım 5: .env Dosyasını Git'e Commit Edin

**⚠️ ÖNEMLİ:** Normalde `.env` dosyasını Git'e commit ETMEYİZ! 

Ancak Render için iki seçenek var:

#### Seçenek 1: .env Dosyasını Git'e EKLE (Kolay ama az güvenli)

```bash
# .gitignore'dan .env'i çıkarın
# backend/.gitignore dosyasını düzenleyin:
node_modules/
# .env  <-- bu satırı kaldırın veya # ile yorum yapın
```

Sonra commit edin:
```bash
git add backend/.env
git commit -m ".env dosyası eklendi"
git push
```

**⚠️ UYARI:** Bu şekilde şifreleriniz Git'te görünür olur!

#### Seçenek 2: Render Dashboard'dan Manuel Girin (Güvenli)

`.env` dosyasını Git'e eklemeden, Render Dashboard'dan manuel olarak girin:

1. Render Dashboard → Web Service → **Environment**
2. **Add Environment Variable** tıklayın
3. Key-Value şeklinde tek tek ekleyin:

```
NODE_ENV = production
PORT = 3000
DB_HOST = dpg-xxxxx-a.frankfurt-postgres.render.com
DB_PORT = 5432
DB_USER = swaps_user
DB_PASSWORD = xxxxxxxxxxxxxx
DB_NAME = swaps_db
JWT_SECRET = a3f8d9c2e7b1...
FRONTEND_URL = https://swaps-frontend.onrender.com
```

## 🎯 Tavsiye Edilen Yöntem

### Production (Render): Environment Variables (Manuel)
- Daha güvenli
- Şifreler Git'te görünmez
- Render Dashboard'dan kolayca güncellenebilir

### Development (Local): .env Dosyası
- Yerel geliştirme için rahat
- `.gitignore`'da olmalı
- Her geliştirici kendi .env'sini oluşturur

## 📋 Render Web Service Ayarları

Eğer `.env` dosyasını kullanmayacaksanız:

```
Name: swaps-backend
Environment: Node
Region: Frankfurt
Branch: main
Root Directory: backend
Build Command: npm ci
Start Command: node index.js
```

**Environment Variables:**
(Yukarıdaki değerleri manuel girin)

## 🔄 Blueprint ile Otomatik (En Kolay)

`render.yaml` dosyası hazır. Sadece:

1. Render → **New + → Blueprint**
2. Repository seçin
3. **Apply** tıklayın
4. Sadece `JWT_SECRET` ekleyin (diğerleri otomatik)

## ✅ Doğrulama

Backend deploy edildikten sonra:

1. Render Dashboard → Web Service → **Logs**
2. Şu mesajı görmelisiniz:

```
✅ PostgreSQL veritabanına başarıyla bağlanıldı!
📊 Database: swaps_db
🌐 Host: dpg-xxxxx-a.frankfurt-postgres.render.com
```

## 🐛 Hata Giderme

### Bağlantı Hatası

```
❌ PostgreSQL bağlantı hatası
```

**Çözüm:**
- Internal Database URL kullanın (Render servisleri için)
- External Database URL yerel geliştirme için
- Database'in Active durumda olduğunu kontrol edin

### Environment Variables Yüklenmiyor

**Çözüm:**
- `.env` dosyası `backend/` klasöründe olmalı
- Dosya adı tam olarak `.env` olmalı (nokta ile başlamalı)
- Render'da **Manual Deploy** tetikleyin

---

**Başarılar! 🚀**

