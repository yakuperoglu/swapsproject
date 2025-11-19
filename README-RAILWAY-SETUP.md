# 🚂 Railway MySQL Entegrasyon Rehberi

Bu rehber, SwapS projesini Railway MySQL veritabanı ile entegre etmek için gerekli adımları içerir.

## 📋 İçindekiler

1. [Railway MySQL Veritabanı Oluşturma](#1-railway-mysql-veritabanı-oluşturma)
2. [Bağlantı Bilgilerini Alma](#2-bağlantı-bilgilerini-alma)
3. [Yerel Geliştirme Ortamı Kurulumu](#3-yerel-geliştirme-ortamı-kurulumu)
4. [Docker ile Çalıştırma](#4-docker-ile-çalıştırma)
5. [Railway'e Deploy](#5-railwaye-deploy)

---

## 1. Railway MySQL Veritabanı Oluşturma

### Adım 1: Railway'e Giriş Yapın
1. [Railway.app](https://railway.app) adresine gidin
2. GitHub hesabınızla giriş yapın

### Adım 2: Yeni Proje Oluşturun
1. "New Project" butonuna tıklayın
2. "Provision MySQL" seçeneğini seçin
3. MySQL veritabanınız otomatik olarak oluşturulacak

---

## 2. Bağlantı Bilgilerini Alma

### Railway Dashboard'dan Bilgileri Kopyalayın

MySQL servisinize tıklayın ve "Variables" sekmesine gidin. Aşağıdaki bilgileri bulacaksınız:

```env
MYSQLHOST=your-host.railway.app
MYSQLPORT=3306
MYSQLUSER=root
MYSQLPASSWORD=your-password-here
MYSQLDATABASE=railway
```

**Alternatif Olarak:**
"Connect" sekmesinde `DATABASE_URL` formatında da alabilirsiniz:
```
mysql://root:password@host.railway.app:3306/railway
```

---

## 3. Yerel Geliştirme Ortamı Kurulumu

### Adım 1: .env Dosyası Oluşturun

Backend klasöründe `.env` dosyası oluşturun:

```bash
cd backend
cp .env.example .env
```

### Adım 2: Railway Bilgilerini .env Dosyasına Yapıştırın

`.env` dosyasını düzenleyin:

```env
# Railway MySQL Database Configuration
DB_HOST=your-railway-host.railway.app
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-railway-password-here
DB_NAME=railway

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
✅ MySQL veritabanına başarıyla bağlanıldı!
📊 Database: railway
🌐 Host: your-host.railway.app
```

---

## 4. Docker ile Çalıştırma

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

## 5. Railway'e Deploy

### Seçenek 1: GitHub ile Otomatik Deploy (Önerilen)

1. Railway Dashboard'da "New Project" → "Deploy from GitHub repo"
2. Repository'nizi seçin
3. "Add Variables" sekmesine gidin ve environment variables ekleyin:

```env
DB_HOST=your-railway-mysql-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=railway
JWT_SECRET=your-jwt-secret
NODE_ENV=production
PORT=3000
```

4. Railway otomatik olarak `railway.json` dosyasını okuyacak ve deploy edecek

### Seçenek 2: Railway CLI ile Deploy

```bash
# Railway CLI'yi yükleyin
npm i -g @railway/cli

# Login olun
railway login

# Proje başlatın
railway init

# Backend'i deploy edin
cd backend
railway up

# Environment variables ekleyin
railway variables set DB_HOST=your-host
railway variables set DB_PORT=3306
railway variables set DB_USER=root
railway variables set DB_PASSWORD=your-password
railway variables set DB_NAME=railway
railway variables set JWT_SECRET=your-secret
```

---

## 🔧 Veritabanı Schema Oluşturma

Veritabanı şeması otomatik olarak oluşturulur. Ancak manuel olarak çalıştırmak isterseniz:

### Railway MySQL Shell'e Bağlanma

1. Railway Dashboard → MySQL Service → "Data" sekmesi
2. MySQL shell'i kullanarak `sema.sql` dosyasını çalıştırabilirsiniz

### Ya da Node.js ile Otomatik

Uygulama ilk başladığında, `config/database.js` dosyası otomatik olarak tüm tabloları oluşturacak.

---

## 📊 Veritabanı Yapısı

Proje aşağıdaki tabloları kullanır:

- **Kullanicilar**: Kullanıcı bilgileri ve kimlik doğrulama
- **Yetenekler**: Beceri ve yetenek listesi
- **Projects**: Kullanıcı projeleri
- **Matches**: Proje eşleşmeleri
- **Messages**: Kullanıcılar arası mesajlaşma

---

## 🐛 Sorun Giderme

### Bağlantı Hatası

```
❌ MySQL bağlantı hatası: connect ETIMEDOUT
```

**Çözüm:**
- Railway MySQL servisinizin çalıştığından emin olun
- Bağlantı bilgilerini kontrol edin
- Railway'de IP whitelist ayarlarını kontrol edin

### Tablo Oluşturma Hatası

```
❌ Schema oluşturma hatası
```

**Çözüm:**
- Railway MySQL'de yeterli izinlere sahip olduğunuzdan emin olun
- Manuel olarak `sema.sql` dosyasını çalıştırın

### Docker Network Hatası

```
ERROR: Network swaps-network declared as external, but could not be found
```

**Çözüm:**
```bash
docker network create swaps-network
docker-compose up -d
```

---

## 🔐 Güvenlik Notları

1. **JWT Secret**: Üretim ortamında mutlaka güçlü bir secret kullanın
2. **Environment Variables**: `.env` dosyasını asla Git'e commit etmeyin
3. **Database Password**: Railway otomatik olarak güçlü şifreler oluşturur
4. **CORS**: Production'da sadece kendi domain'inizi allow edin

---

## 📞 Destek

Sorun yaşarsanız:
1. Railway Dashboard'da logları kontrol edin
2. `docker logs swaps-backend` ile container loglarını inceleyin
3. Issue açın: [GitHub Issues](https://github.com/your-repo/issues)

---

## ✅ Checklist

Backend deploy etmeden önce:

- [ ] Railway MySQL veritabanı oluşturuldu
- [ ] Bağlantı bilgileri alındı
- [ ] `.env` dosyası oluşturuldu ve dolduruldu
- [ ] Yerel ortamda test edildi
- [ ] Docker ile çalıştırıldı ve test edildi
- [ ] Railway environment variables ayarlandı
- [ ] Deploy edildi ve loglar kontrol edildi

---

**Başarılar! 🚀**

