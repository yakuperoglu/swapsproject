# SwapS-Project

SwapS: Proje tabanlı beceri takas platformu. Kullanıcılar projelerini ve ihtiyaç duydukları becerileri paylaşır; diğer kullanıcılar kendi becerileriyle katkı sunarak karşılıklı kazan-kazan (skill swap) modeliyle işbirliği yapar.

---

## İçindekiler

- Özellikler
- Mimari ve Klasör Yapısı
- Gereksinimler
- Kurulum
- Çalıştırma
- Ortam Değişkenleri (.env)
- Proje Komutları
- Geliştirme Rehberi
- Test, Lint ve Format
- Dağıtım (Deploy) Notları
- Yol Haritası
- Katkı ve Lisans

---

## Özellikler

- Proje oluşturma ve beceri ihtiyaçlarını belirtme
- Kullanıcı profili ve beceri etiketleri
- Eşleşme ve iletişim akışı (örn. mesajlaşma/yorumlar)
- Görev/issue bazlı işbirliği modeli
- Değerlendirme/geri bildirim sistemi (ileride)

> Not: Özelliklerin kapsamı ve detayları geliştirme ilerledikçe güncellenecektir.

## Mimari ve Klasör Yapısı

Monorepo düzeni ile `backend` ve `frontend` dizinleri:

```
.
├─ backend/   # Sunucu tarafı kodu (API, iş kuralları, veritabanı erişimi)
└─ frontend/  # İstemci tarafı uygulama (web arayüzü)
```

> Şu an dizinler yer tutucu durumunda. Yığın (stack) belirlendikçe içerik güncellenecek.

## Gereksinimler

- Git
- Node.js 18+ ve paket yöneticisi (npm / yarn / pnpm) veya
- Python/Java/Go gibi alternatif backend yığını (seçime göre güncellenecek)
- Bir veritabanı (MySQL önerilir) – opsiyonel, yığındaki karara göre

## Kurulum

1) Depoyu klonlayın:

```bash
git clone https://github.com/USERNAME/SwapS-Project.git
cd SwapS-Project
```

2) Ortam değişkeni dosyalarını oluşturun (örnek aşağıda):

```bash
cp backend/.env.example backend/.env  # yoksa oluşturun
cp frontend/.env.example frontend/.env # yoksa oluşturun
```

3) Bağımlılıkları kurun (seçeceğiniz yığına göre):

```bash
# Node.js tabanlı ise
cd frontend && npm install && cd ..
cd backend  && npm install && cd ..

# Alternatif: Python tabanlı backend ise (örnek)
# cd backend && python -m venv .venv && source .venv/bin/activate
# pip install -r requirements.txt && cd ..
```

## Çalıştırma

Geliştirme ortamında servisleri başlatın.

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd ../backend
npm run dev
```

> Komutlar yığına göre değişebilir. Aşağıdaki "Proje Komutları" bölümünü özelleştirin.

## Ortam Değişkenleri (.env)

Örnek içerik (ihtiyaca göre genişletin):

```
# Genel
NODE_ENV=development

# Backend
PORT=4000
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/swaps
JWT_SECRET=please_change_me

# Frontend
VITE_API_BASE_URL=http://localhost:4000
```

## Proje Komutları

Aşağıdaki komutlar örnek olup projenin gerçek yığınına göre güncellenmelidir.

```bash
# Frontend
npm run dev       # Geliştirme sunucusu
npm run build     # Üretim derlemesi
npm run preview   # Üretim derlemesini lokalde önizleme

# Backend
npm run dev       # Geliştirme sunucusu (hot-reload)
npm run build     # Üretim derlemesi
npm start         # Üretim çalıştırma
```

## Geliştirme Rehberi

- Dal (branch) stratejisi: `main` kararlı, özellikler için `feature/<isim>` dalları
- Commit biçimi: Anlaşılır, atomik ve tek konu odaklı
- Kod inceleme (PR) gereklidir; küçük de olsa PR açın
- Kod okunabilirliğini ve test kapsamını koruyun


## Dağıtım (Deploy) Notları

- Hedef platform: Vercel (frontend kesin; backend henüz kararlaştırılmadı)
- Ortam değişkenleri: Vercel Dashboard > Project Settings > Environment altında `DATABASE_URL`, `JWT_SECRET`, `VITE_API_BASE_URL` değerlerini üretim/staging için tanımlayın
- MySQL: Üretim veritabanınızı (örn. PlanetScale, Railway, Aiven veya kendi MySQL sunucunuz) hazırlayın ve `DATABASE_URL`'i MySQL bağlantısına göre ayarlayın (`mysql://USER:PASSWORD@HOST:3306/DB_NAME`)
- Frontend: `VITE_API_BASE_URL` değerini Vercel'de barınan backend URL'sine (veya geçici olarak local/placeholder) işaret edecek şekilde ayarlayın
- Backend seçenekleri:
  - Node.js tabanlı sunucu ve Vercel Serverless Functions ile monorepo içinde dağıtım
  - Alternatif bir barındırma (Render/Fly/Heroku/Dokku) ve frontend'in Vercel üzerinde kalması
- CI/CD: Vercel Git entegrasyonu ile PR önizlemeleri ve main dalı üretim deploy akışını etkinleştirin

## Yol Haritası

- MVP: Proje ve beceri ilanları, başvuru/katılım, temel profil
- Eşleşme algoritması ve bildirimler
- Mesajlaşma/işbirliği araçları
- Değerlendirme ve rozetler
- Mobil uyum ve erişilebilirlik iyileştirmeleri


