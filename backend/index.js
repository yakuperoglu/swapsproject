// .env dosyasındaki gizli bilgileri yüklemek için bu satır en üste eklenir.
require('dotenv').config();

// 1. Kütüphaneleri çağır
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// PostgreSQL veritabanı bağlantısı
const { initializeDatabase, createSchema, getConnection } = require('./config/database');

// Helper fonksiyon: JWT token oluşturur
function generateToken(userId, email, rol = 'user') {
    const payload = {
        id: userId,
        email: email,
        rol: rol
    };
    
    // Token'ı oluştur (24 saat geçerli)
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
}

// Middleware: Gelen isteğin başlıklarında (headers) geçerli bir JWT (token) olup olmadığını kontrol eder.
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']; // Token, 'Bearer <Token>' formatında gelir
    const token = authHeader && authHeader.split(' ')[1]; // Sadece <Token> kısmını ayırırız

    if (token == null) {
        // Eğer token yoksa, 401 Unauthorized (Yetkisiz) cevabını ver.
        return res.status(401).json({ message: 'Erisim reddedildi. Token gerekli.' });
    }

    // Token geçerli mi? Kontrol et.
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Eğer token geçerliliğini yitirmişse veya hatalıysa, 403 Forbidden (Yasak) cevabını ver.
            return res.status(403).json({ message: 'Token gecerli degil veya suresi dolmus.' });
        }
        
        // Token geçerliyse, kullanıcı bilgilerini (id, email, rol) isteğe ekle.
        req.user = user; // user içinde: { id, email, rol }
        next(); // Bir sonraki fonksiyona/endpoint'e geçiş yap.
    });
}


// 2. Express uygulamasını oluştur

const app = express();
const PORT = 3000; 

// YENİ: Veritabanı bağlantısı artık GÜVENLİ .env dosyasından PARÇA PARÇA okunuyor
let db = null;
let useInMemoryDB = true; // Başlangıçta in-memory kullan (PostgreSQL bağlantısı başarılı olursa false olacak)

// In-memory veritabanı (geçici test için - PostgreSQL bağlanamazsa kullanılacak)
let inMemoryUsers = [];
let userIdCounter = 1;

// In-memory yetenekler (PostgreSQL bağlanamazsa kullanılacak)
let inMemorySkills = [
    { id: 1, name: 'İngilizce', category: 'Dil' },
    { id: 2, name: 'Fransızca', category: 'Dil' },
    { id: 3, name: 'Almanca', category: 'Dil' },
    { id: 4, name: 'İspanyolca', category: 'Dil' },
    { id: 5, name: 'Çince', category: 'Dil' },
    { id: 6, name: 'Japonca', category: 'Dil' },
    { id: 7, name: 'JavaScript', category: 'Programlama' },
    { id: 8, name: 'Python', category: 'Programlama' },
    { id: 9, name: 'Java', category: 'Programlama' },
    { id: 10, name: 'C++', category: 'Programlama' },
    { id: 11, name: 'React', category: 'Programlama' },
    { id: 12, name: 'Node.js', category: 'Programlama' },
    { id: 13, name: 'Gitar', category: 'Müzik' },
    { id: 14, name: 'Piyano', category: 'Müzik' },
    { id: 15, name: 'Keman', category: 'Müzik' },
    { id: 16, name: 'Davul', category: 'Müzik' },
    { id: 17, name: 'Photoshop', category: 'Tasarım' },
    { id: 18, name: 'Illustrator', category: 'Tasarım' },
    { id: 19, name: 'Figma', category: 'Tasarım' },
    { id: 20, name: 'UI/UX Design', category: 'Tasarım' },
];
let skillIdCounter = 21;

// In-memory matches (PostgreSQL bağlanamazsa kullanılacak)
let inMemoryMatches = [];
let matchIdCounter = 1;

// In-memory projects (PostgreSQL bağlanamazsa kullanılacak)
let inMemoryProjects = [];
let projectIdCounter = 1;

// PostgreSQL bağlantısını başlat
async function startDatabase() {
    try {
        await initializeDatabase();
        await createSchema();
        db = getConnection();
        
        if (db) {
            console.log('PostgreSQL Veritabanina (swaps_db) basariyla baglanildi.');
            useInMemoryDB = false;
        } else {
            console.warn('PostgreSQL baglanamadi, in-memory veritabani kullaniliyor (TEST MODU)');
            useInMemoryDB = true;
        }
    } catch (error) {
        console.warn('PostgreSQL baglanamadi, in-memory veritabani kullaniliyor (TEST MODU):', error.message);
        useInMemoryDB = true;
        db = null;
    }
}

// Veritabanını başlat
startDatabase();

// 3. CORS ayarı (Frontend'den gelen isteklere izin vermek için)
app.use((req, res, next) => {
    // İzin verilen origin'ler (development + production)
    const allowedOrigins = [
        'http://localhost:5173',              // Local development
        'https://swaps.com.tr',               // Production domain
        'https://www.swaps.com.tr',           // Production domain (www)
        process.env.FRONTEND_URL              // Render'dan gelen environment variable
    ].filter(Boolean); // undefined değerleri temizle
    
    const origin = req.headers.origin;
    
    // Eğer istek izin verilen origin'lerden birinden geliyorsa izin ver
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// JSON ayarı
app.use(express.json());

// Mesajlaşma route'ları
const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

// 5. Ana Test Endpoint'i
app.get('/', (req, res) => {
    res.json({ message: 'SwapS Backend API calisiyor! Hos geldiniz.' });

});

// 5. KULLANICI KAYIT ENDPOINT
app.post('/api/auth/register', async (req, res) => {
    try {
        // Frontend'den gelen field isimlerini backend field isimlerine çevir
        const { username, email, password } = req.body;
        const kullanici_adi = username;
        const sifre = password;

        console.log('Register request received:', { username, email, password: '***' });



        if (!kullanici_adi || !email || !sifre) {

            return res.status(400).json({ message: 'Lutfen tum alanlari doldurun.' });

        }

        // In-memory veritabanı kullanılıyorsa (PostgreSQL bağlanamadıysa)
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database (PostgreSQL not available)');
            // Email veya kullanıcı adı kontrolü
            const existingUser = inMemoryUsers.find(u => u.email === email || u.kullanici_adi === kullanici_adi);
            if (existingUser) {
                return res.status(400).json({ message: 'Bu email veya kullanici adi zaten alinmis.' });
            }

            const hashlenmisSifre = await bcrypt.hash(sifre, 10);
            const newUser = {
                id: userIdCounter++,
                kullanici_adi: kullanici_adi,
                email: email,
                sifre: hashlenmisSifre
            };
            inMemoryUsers.push(newUser);

            // Gerçek JWT token oluştur
            const token = generateToken(newUser.id, email, 'user');

            return res.status(201).json({ 
                message: 'Kullanici basariyla olusturuldu! (TEST MODU - In-Memory)',
                user: {
                    id: newUser.id,
                    username: kullanici_adi,
                    email: email
                },
                token: token
            });
        }

        // PostgreSQL kullanılıyorsa
        console.log('Using PostgreSQL database');
        const hashlenmisSifre = await bcrypt.hash(sifre, 10);
        const sql = "INSERT INTO Kullanicilar (kullanici_adi, email, sifre) VALUES ($1, $2, $3) RETURNING id";

        try {
            const result = await db.query(sql, [kullanici_adi, email, hashlenmisSifre]);
            const userId = result.rows[0].id;
            
            // Gerçek JWT token oluştur
            const token = generateToken(userId, email, 'user');
            
            console.log('User created successfully in PostgreSQL');
            res.status(201).json({ 
                message: 'Kullanici basariyla olusturuldu!',
                user: {
                    id: userId,
                    username: kullanici_adi,
                    email: email
                },
                token: token
            });
        } catch (dbError) {
            if (dbError.code === '23505') { // PostgreSQL unique constraint violation
                return res.status(400).json({ message: 'Bu email veya kullanici adi zaten alinmis.' });
            }
            console.error('Veritabanina kayit sirasinda hata:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi olustu: ' + dbError.message });
        }

    } catch (error) {
        console.error('Register endpoint hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi olustu: ' + error.message });
    }
});

// 6. KULLANICI GİRİŞ ENDPOINT
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const sifre = password;

        if (!email || !sifre) {
            return res.status(400).json({ message: 'Lutfen email ve sifre giriniz.' });
        }

        // Mock kullanıcı kontrolü (Demo için)
        // Mock User 1: user / user
        if (email === 'user' && sifre === 'user') {
            const token = generateToken(100001, 'user@demo.com', 'user');
            
            return res.status(200).json({
                message: 'Giris basarili! (Demo User)',
                user: {
                    id: 100001,
                    username: 'user',
                    email: 'user@demo.com',
                    role: 'user'
                },
                token: token
            });
        }

        // Mock User 2: test / test
        if (email === 'test' && sifre === 'test') {
            const token = generateToken(100002, 'test@demo.com', 'user');
            
            return res.status(200).json({
                message: 'Giris basarili! (Demo User)',
                user: {
                    id: 100002,
                    username: 'test',
                    email: 'test@demo.com',
                    role: 'user'
                },
                token: token
            });
        }

        // Admin kontrolü
        if (email === 'admin1@gmail.com' && sifre === 'admin-1') {
            // Gerçek JWT token oluştur (admin için)
            const token = generateToken(999999, 'admin1@gmail.com', 'admin');
            
            return res.status(200).json({
                message: 'Admin girisi basarili!',
                user: {
                    id: 999999,
                    username: 'Admin',
                    email: 'admin1@gmail.com',
                    role: 'admin'
                },
                token: token
            });
        }

        // In-memory veritabanı kullanılıyorsa (PostgreSQL bağlanamadıysa)
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for login (PostgreSQL not available)');
            const kullanici = inMemoryUsers.find(u => u.email === email);
            
            if (!kullanici) {
                return res.status(401).json({ message: 'Email veya sifre hatali.' });
            }

            const sifreEslesiyor = await bcrypt.compare(sifre, kullanici.sifre);

            if (!sifreEslesiyor) {
                return res.status(401).json({ message: 'Email veya sifre hatali.' });
            }

            // Gerçek JWT token oluştur
            const token = generateToken(kullanici.id, kullanici.email, 'user');

            return res.status(200).json({
                message: 'Giris basarili! (TEST MODU - In-Memory)',
                user: {
                    id: kullanici.id,
                    username: kullanici.kullanici_adi,
                    email: kullanici.email,
                    role: 'user'
                },
                token: token
            });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "SELECT * FROM Kullanicilar WHERE email = $1";
        
        try {
            const results = await db.query(sql, [email]);

            if (results.rows.length === 0) {
                return res.status(401).json({ message: 'Email veya sifre hatali.' });
            }

            const kullanici = results.rows[0];
            const sifreEslesiyor = await bcrypt.compare(sifre, kullanici.sifre);

            if (!sifreEslesiyor) {
                return res.status(401).json({ message: 'Email veya sifre hatali.' });
            }

            // Gerçek JWT token oluştur
            const token = generateToken(kullanici.id, kullanici.email, kullanici.rol || 'user');

            // Başarılı giriş - gerçek JWT token ile
            res.status(200).json({
                message: 'Giris basarili!',
                user: {
                    id: kullanici.id,
                    username: kullanici.kullanici_adi,
                    email: kullanici.email,
                    role: kullanici.rol || 'user'
                },
                token: token
            });
        } catch (dbError) {
            console.error('Veritabani sorgusu sirasinda hata:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi olustu.' });
        }

    } catch (error) {
        console.error('Giris sirasinda hata:', error);
        res.status(500).json({ message: 'Sunucu hatasi olustu.' });
    }
});

// 7. KULLANICI PROFİLİNİ GETIR (Kullanıcı bilgileri + profil verileri)
app.get('/api/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'Kullanici ID gereklidir.' });
        }

        // In-memory veritabanı kullanılıyorsa
        if (useInMemoryDB || !db) {
            const user = inMemoryUsers.find(u => u.id == userId);

            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            return res.status(200).json({
                success: true,
                user: {
                    id: user.id,
                    username: user.kullanici_adi,
                    email: user.email,
                },
                profile: user.profile || null,
            });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "SELECT id, kullanici_adi, email FROM Kullanicilar WHERE id = $1";
        
        try {
            const results = await db.query(sql, [userId]);
            
            if (results.rows.length === 0) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            const user = results.rows[0];
            
            // Profil verilerini getir (şimdilik null, ileride Profiles tablosundan çekilebilir)
            res.status(200).json({
                success: true,
                user: {
                    id: user.id,
                    username: user.kullanici_adi,
                    email: user.email,
                },
                profile: null, // İleride Profiles tablosundan çekilecek
            });
        } catch (dbError) {
            console.error('Kullanici bulunamadi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi.' });
        }

    } catch (error) {
        console.error('Profil getirme sirasinda hata:', error);
        res.status(500).json({ message: 'Sunucu hatasi olustu: ' + error.message });
    }
});

// 8. PROFİL AYARLARINI KAYDET ENDPOINT
app.post('/api/profile/save-settings', async (req, res) => {
    try {
        const { userId, profileData } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'Kullanici ID gereklidir.' });
        }

        if (!profileData) {
            return res.status(400).json({ message: 'Profil verileri gereklidir.' });
        }

        console.log('Profile settings save request:', { userId, profileData: { ...profileData, skills: profileData.languages?.length || 0 + ' items' } });

        // In-memory veritabanı kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for profile save (PostgreSQL not available)');

            // Kullanıcıyı bul
            const userIndex = inMemoryUsers.findIndex(u => u.id == userId);

            if (userIndex === -1) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }

            // Profil verilerini kullanıcıya ekle (in-memory için basit tutuyoruz)
            inMemoryUsers[userIndex].profile = profileData;

            return res.status(200).json({
                message: 'Profil ayarlari basariyla kaydedildi! (TEST MODU - In-Memory)',
                success: true
            });
        }

        // PostgreSQL kullanılıyorsa
        // Not: Şu an için profil verileri localStorage'da tutuluyor
        // İleride PostgreSQL'de ayrı bir Profiles tablosu oluşturulabilir
        console.log('PostgreSQL profil kaydetme özelliği henüz implement edilmedi');

        return res.status(200).json({
            message: 'Profil ayarlari basariyla kaydedildi!',
            success: true
        });

    } catch (error) {
        console.error('Profil kaydetme sirasinda hata:', error);
        res.status(500).json({ message: 'Sunucu hatasi olustu: ' + error.message });
    }
});

// 9. ADMIN - TÜM KULLANICILARI LİSTELE
app.get('/api/admin/users', async (req, res) => {
    try {
        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            const users = inMemoryUsers.map(u => ({
                id: u.id,
                username: u.kullanici_adi,
                email: u.email,
                profile: u.profile || null
            }));
            return res.status(200).json({ success: true, users });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "SELECT id, kullanici_adi as username, email FROM Kullanicilar";
        
        try {
            const results = await db.query(sql);
            res.status(200).json({ success: true, users: results.rows });
        } catch (dbError) {
            console.error('Kullanicilar listelenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    } catch (error) {
        console.error('Admin kullanici listesi hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi.' });
    }
});

// 10. ADMIN - KULLANICI SİL
app.delete('/api/admin/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            const index = inMemoryUsers.findIndex(u => u.id == userId);
            if (index === -1) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }
            inMemoryUsers.splice(index, 1);
            return res.status(200).json({ success: true, message: 'Kullanici silindi.' });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "DELETE FROM Kullanicilar WHERE id = $1";
        
        try {
            const result = await db.query(sql, [userId]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }
            res.status(200).json({ success: true, message: 'Kullanici silindi.' });
        } catch (dbError) {
            console.error('Kullanici silinemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    } catch (error) {
        console.error('Kullanici silme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi.' });
    }
});

// 11. ADMIN - KULLANICI PROFİL GÜNCELLE
app.put('/api/admin/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, email, profileData } = req.body;

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            const user = inMemoryUsers.find(u => u.id == userId);
            if (!user) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }
            if (username) user.kullanici_adi = username;
            if (email) user.email = email;
            if (profileData) user.profile = profileData;
            return res.status(200).json({ success: true, message: 'Kullanici guncellendi.' });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "UPDATE Kullanicilar SET kullanici_adi = $1, email = $2 WHERE id = $3";
        
        try {
            const result = await db.query(sql, [username, email, userId]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }
            res.status(200).json({ success: true, message: 'Kullanici guncellendi.' });
        } catch (dbError) {
            console.error('Kullanici guncellenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    } catch (error) {
        console.error('Kullanici guncelleme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi.' });
    }
});

// 12. TÜM YETENEKLERİ GETIR
app.get('/api/skills', async (req, res) => {
    try {
        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            return res.status(200).json({ success: true, skills: inMemorySkills });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "SELECT * FROM Yetenekler ORDER BY category, name";
        
        try {
            const results = await db.query(sql);
            res.status(200).json({ success: true, skills: results.rows });
        } catch (dbError) {
            console.error('Yetenekler listelenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    } catch (error) {
        console.error('Yetenek listesi hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi.' });
    }
});

// 13. YENİ YETENEK EKLE
app.post('/api/skills', async (req, res) => {
    try {
        const { name, category } = req.body;

        if (!name || !category) {
            return res.status(400).json({ message: 'Yetenek adi ve kategori gereklidir.' });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            // Aynı yetenek var mı kontrol et
            const exists = inMemorySkills.find(
                s => s.name.toLowerCase() === name.toLowerCase() && s.category === category
            );
            
            if (exists) {
                return res.status(400).json({ message: 'Bu yetenek zaten mevcut!' });
            }

            const newSkill = {
                id: skillIdCounter++,
                name: name.trim(),
                category: category.trim(),
            };
            inMemorySkills.push(newSkill);
            return res.status(201).json({ success: true, skill: newSkill, message: 'Yetenek eklendi! (TEST MODU - In-Memory)' });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "INSERT INTO Yetenekler (name, category) VALUES ($1, $2) RETURNING *";
        
        try {
            const result = await db.query(sql, [name.trim(), category.trim()]);
            res.status(201).json({
                success: true,
                skill: result.rows[0],
                message: 'Yetenek eklendi!',
            });
        } catch (dbError) {
            if (dbError.code === '23505') { // PostgreSQL unique constraint violation
                return res.status(400).json({ message: 'Bu yetenek zaten mevcut!' });
            }
            console.error('Yetenek eklenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    } catch (error) {
        console.error('Yetenek ekleme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi.' });
    }
});

// 14. YETENEK SİL
app.delete('/api/skills/:skillId', async (req, res) => {
    try {
        const { skillId } = req.params;

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            const index = inMemorySkills.findIndex(s => s.id == skillId);
            if (index === -1) {
                return res.status(404).json({ message: 'Yetenek bulunamadi.' });
            }
            inMemorySkills.splice(index, 1);
            return res.status(200).json({ success: true, message: 'Yetenek silindi.' });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "DELETE FROM Yetenekler WHERE id = $1";
        
        try {
            const result = await db.query(sql, [skillId]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Yetenek bulunamadi.' });
            }
            res.status(200).json({ success: true, message: 'Yetenek silindi.' });
        } catch (dbError) {
            console.error('Yetenek silinemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    } catch (error) {
        console.error('Yetenek silme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi.' });
    }
});

// 15. YETENEK GÜNCELLE
app.put('/api/skills/:skillId', async (req, res) => {
    try {
        const { skillId } = req.params;
        const { name, category } = req.body;

        if (!name || !category) {
            return res.status(400).json({ message: 'Yetenek adi ve kategori gereklidir.' });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            const skill = inMemorySkills.find(s => s.id == skillId);
            if (!skill) {
                return res.status(404).json({ message: 'Yetenek bulunamadi.' });
            }
            skill.name = name.trim();
            skill.category = category.trim();
            return res.status(200).json({ success: true, message: 'Yetenek guncellendi.' });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "UPDATE Yetenekler SET name = $1, category = $2 WHERE id = $3";
        
        try {
            const result = await db.query(sql, [name.trim(), category.trim(), skillId]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Yetenek bulunamadi.' });
            }
            res.status(200).json({ success: true, message: 'Yetenek guncellendi.' });
        } catch (dbError) {
            console.error('Yetenek guncellenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    } catch (error) {
        console.error('Yetenek guncelleme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi.' });
    }
});

// 16. KULLANICI HESABINI SİL (Kullanıcı kendini siler)
app.delete('/api/profile/delete-account/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'Kullanici ID gereklidir.' });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            const index = inMemoryUsers.findIndex(u => u.id == userId);
            if (index === -1) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }
            
            const deletedUser = inMemoryUsers[index];
            inMemoryUsers.splice(index, 1);
            
            console.log(`Kullanici silindi: ${deletedUser.kullanici_adi} (ID: ${userId})`);
            
            return res.status(200).json({ 
                success: true, 
                message: 'Hesabiniz basariyla silindi. (TEST MODU - In-Memory)' 
            });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "DELETE FROM Kullanicilar WHERE id = $1";
        
        try {
            const result = await db.query(sql, [userId]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Kullanici bulunamadi.' });
            }
            
            console.log(`Kullanici silindi (ID: ${userId})`);
            res.status(200).json({ 
                success: true, 
                message: 'Hesabiniz basariyla silindi.' 
            });
        } catch (dbError) {
            console.error('Hesap silinemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    } catch (error) {
        console.error('Hesap silme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi.' });
    }
});

// 17. TÜM KATEGORİLERİ GETIR
app.get('/api/categories', async (req, res) => {
    try {
        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            const categories = [...new Set(inMemorySkills.map(s => s.category))].sort();
            return res.status(200).json({ success: true, categories });
        }

        // PostgreSQL kullanılıyorsa
        const sql = "SELECT DISTINCT category FROM Yetenekler ORDER BY category";
        
        try {
            const results = await db.query(sql);
            const categories = results.rows.map(row => row.category);
            res.status(200).json({ success: true, categories });
        } catch (dbError) {
            console.error('Kategoriler listelenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi.' });
        }
    } catch (error) {
        console.error('Kategori listesi hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi.' });
    }
});

// ============================================
// PROJECTS API - PROJE YÖNETİMİ
// ============================================

// 18. PROJE OLUŞTURMA (POST /projects)
app.post('/projects', authenticateToken, async (req, res) => {
    try {
        const { title, description } = req.body;
        const owner_id = req.user.id; // Token'dan gelen kullanıcı ID'si

        // Validasyon
        if (!title || !description) {
            return res.status(400).json({ message: 'Proje basligi ve aciklama gereklidir.' });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for projects (PostgreSQL not available)');

            const newProject = {
                project_id: projectIdCounter++,
                owner_id: parseInt(owner_id),
                title: title,
                description: description,
                olusturulma_tarihi: new Date()
            };

            inMemoryProjects.push(newProject);

            return res.status(201).json({
                success: true,
                message: 'Proje basariyla olusturuldu! (TEST MODU - In-Memory)',
                project: newProject
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            const sql = `
                INSERT INTO Projects (owner_id, title, description) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `;

            const result = await db.query(sql, [owner_id, title, description]);

            res.status(201).json({
                success: true,
                message: 'Proje basariyla olusturuldu!',
                project: result.rows[0]
            });

        } catch (dbError) {
            console.error('Proje olusturulamadi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Proje olusturma hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 19. TÜM PROJELERİ LİSTELE (GET /projects)
app.get('/projects', async (req, res) => {
    try {
        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for projects list (PostgreSQL not available)');

            // Proje sahibi bilgilerini ekle
            const projectsWithOwners = inMemoryProjects.map(project => {
                const owner = inMemoryUsers.find(u => u.id === project.owner_id);
                return {
                    ...project,
                    owner_name: owner ? owner.kullanici_adi : 'Bilinmeyen',
                    owner_email: owner ? owner.email : ''
                };
            });

            return res.status(200).json({
                success: true,
                projects: projectsWithOwners
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            const sql = `
                SELECT 
                    p.project_id, 
                    p.owner_id, 
                    p.title, 
                    p.description, 
                    p.olusturulma_tarihi,
                    k.kullanici_adi as owner_name,
                    k.email as owner_email
                FROM Projects p
                JOIN Kullanicilar k ON p.owner_id = k.id
                ORDER BY p.olusturulma_tarihi DESC
            `;

            const result = await db.query(sql);

            res.status(200).json({
                success: true,
                projects: result.rows
            });

        } catch (dbError) {
            console.error('Projeler listelenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Proje listesi hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 20. TEK PROJE DETAYI (GET /projects/:id)
app.get('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for project detail (PostgreSQL not available)');

            const project = inMemoryProjects.find(p => p.project_id == id);
            if (!project) {
                return res.status(404).json({ message: 'Proje bulunamadi.' });
            }

            const owner = inMemoryUsers.find(u => u.id === project.owner_id);

            return res.status(200).json({
                success: true,
                project: {
                    ...project,
                    owner_name: owner ? owner.kullanici_adi : 'Bilinmeyen',
                    owner_email: owner ? owner.email : ''
                }
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            const sql = `
                SELECT 
                    p.project_id, 
                    p.owner_id, 
                    p.title, 
                    p.description, 
                    p.olusturulma_tarihi,
                    k.kullanici_adi as owner_name,
                    k.email as owner_email
                FROM Projects p
                JOIN Kullanicilar k ON p.owner_id = k.id
                WHERE p.project_id = $1
            `;

            const result = await db.query(sql, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Proje bulunamadi.' });
            }

            res.status(200).json({
                success: true,
                project: result.rows[0]
            });

        } catch (dbError) {
            console.error('Proje detayi getirilemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Proje detay hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 21. KULLANICININ KENDİ PROJELERİ (GET /projects/my)
app.get('/projects/my', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id; // Token'dan gelen kullanıcı ID'si

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for my projects (PostgreSQL not available)');

            const myProjects = inMemoryProjects.filter(p => p.owner_id == user_id);

            return res.status(200).json({
                success: true,
                projects: myProjects
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            const sql = `
                SELECT * FROM Projects 
                WHERE owner_id = $1 
                ORDER BY olusturulma_tarihi DESC
            `;

            const result = await db.query(sql, [user_id]);

            res.status(200).json({
                success: true,
                projects: result.rows
            });

        } catch (dbError) {
            console.error('Kullanici projeleri listelenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Projelerim listesi hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 22. PROJE GÜNCELLE (PUT /projects/:id)
// Sadece proje sahibi güncelleyebilir
app.put('/projects/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const user_id = req.user.id; // Token'dan gelen kullanıcı ID'si

        // Validasyon
        if (!title || !description) {
            return res.status(400).json({ message: 'Proje basligi ve aciklama gereklidir.' });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for project update (PostgreSQL not available)');

            const project = inMemoryProjects.find(p => p.project_id == id);
            if (!project) {
                return res.status(404).json({ message: 'Proje bulunamadi.' });
            }

            // Sadece proje sahibi güncelleyebilir
            if (project.owner_id != user_id) {
                return res.status(403).json({ 
                    message: 'Bu projeyi guncelleme yetkiniz yok.' 
                });
            }

            project.title = title;
            project.description = description;

            return res.status(200).json({
                success: true,
                message: 'Proje guncellendi! (TEST MODU - In-Memory)',
                project: project
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // Önce proje sahibini kontrol et
            const checkQuery = 'SELECT owner_id FROM Projects WHERE project_id = $1';
            const checkResult = await db.query(checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: 'Proje bulunamadi.' });
            }

            // Sadece proje sahibi güncelleyebilir
            if (checkResult.rows[0].owner_id != user_id) {
                return res.status(403).json({ 
                    message: 'Bu projeyi guncelleme yetkiniz yok.' 
                });
            }

            // Projeyi güncelle
            const updateQuery = `
                UPDATE Projects 
                SET title = $1, description = $2 
                WHERE project_id = $3 
                RETURNING *
            `;

            const updateResult = await db.query(updateQuery, [title, description, id]);

            res.status(200).json({
                success: true,
                message: 'Proje guncellendi!',
                project: updateResult.rows[0]
            });

        } catch (dbError) {
            console.error('Proje guncellenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Proje guncelleme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 23. PROJE SİL (DELETE /projects/:id)
// Sadece proje sahibi silebilir
app.delete('/projects/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id; // Token'dan gelen kullanıcı ID'si

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for project delete (PostgreSQL not available)');

            const projectIndex = inMemoryProjects.findIndex(p => p.project_id == id);
            if (projectIndex === -1) {
                return res.status(404).json({ message: 'Proje bulunamadi.' });
            }

            const project = inMemoryProjects[projectIndex];

            // Sadece proje sahibi silebilir
            if (project.owner_id != user_id) {
                return res.status(403).json({ 
                    message: 'Bu projeyi silme yetkiniz yok.' 
                });
            }

            // Projeyi sil
            inMemoryProjects.splice(projectIndex, 1);

            // İlgili match'leri de sil
            inMemoryMatches = inMemoryMatches.filter(m => m.project_id != id);

            return res.status(200).json({
                success: true,
                message: 'Proje silindi! (TEST MODU - In-Memory)'
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // Önce proje sahibini kontrol et
            const checkQuery = 'SELECT owner_id FROM Projects WHERE project_id = $1';
            const checkResult = await db.query(checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: 'Proje bulunamadi.' });
            }

            // Sadece proje sahibi silebilir
            if (checkResult.rows[0].owner_id != user_id) {
                return res.status(403).json({ 
                    message: 'Bu projeyi silme yetkiniz yok.' 
                });
            }

            // Projeyi sil (CASCADE ile match'ler otomatik silinir)
            const deleteQuery = 'DELETE FROM Projects WHERE project_id = $1';
            await db.query(deleteQuery, [id]);

            res.status(200).json({
                success: true,
                message: 'Proje silindi!'
            });

        } catch (dbError) {
            console.error('Proje silinemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Proje silme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// ============================================
// MATCHES API - BAŞVURU YÖNETİMİ
// ============================================

// 24. BAŞVURU OLUŞTURMA (POST /matches)
// Token'dan gelen kullanıcı, belirtilen projeye başvurur
app.post('/matches', authenticateToken, async (req, res) => {
    try {
        const { project_id } = req.body;
        const applicant_id = req.user.id; // Token'dan gelen kullanıcı ID'si (JWT payload'dan)

        // Validasyon
        if (!project_id) {
            return res.status(400).json({ message: 'Proje ID gereklidir.' });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for matches (PostgreSQL not available)');

            // Projenin varlığını kontrol et
            const project = inMemoryProjects.find(p => p.project_id == project_id);
            if (!project) {
                return res.status(404).json({ message: 'Proje bulunamadi.' });
            }

            // Kendi projesine başvuramaz
            if (project.owner_id == applicant_id) {
                return res.status(400).json({ message: 'Kendi projenize basvuramazsiniz.' });
            }

            // Aynı projeye daha önce başvuru yapmış mı kontrol et
            const existingMatch = inMemoryMatches.find(
                m => m.applicant_id == applicant_id && m.project_id == project_id
            );

            if (existingMatch) {
                return res.status(400).json({ message: 'Bu projeye zaten basvuru yaptiniz.' });
            }

            // Yeni başvuru oluştur
            const newMatch = {
                match_id: matchIdCounter++,
                applicant_id: parseInt(applicant_id),
                project_id: parseInt(project_id),
                status: 'Pending',
                olusturulma_tarihi: new Date()
            };

            inMemoryMatches.push(newMatch);

            return res.status(201).json({
                success: true,
                message: 'Basvurunuz basariyla olusturuldu! (TEST MODU - In-Memory)',
                match: newMatch
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // Projenin varlığını ve sahibini kontrol et
            const projectCheck = await db.query(
                'SELECT owner_id FROM Projects WHERE project_id = $1',
                [project_id]
            );

            if (projectCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Proje bulunamadi.' });
            }

            // Kendi projesine başvuramaz
            if (projectCheck.rows[0].owner_id == applicant_id) {
                return res.status(400).json({ message: 'Kendi projenize basvuramazsiniz.' });
            }

            // Başvuru oluştur
            const sql = `
                INSERT INTO Matches (applicant_id, project_id, status) 
                VALUES ($1, $2, 'Pending') 
                RETURNING *
            `;

            const result = await db.query(sql, [applicant_id, project_id]);

            res.status(201).json({
                success: true,
                message: 'Basvurunuz basariyla olusturuldu!',
                match: result.rows[0]
            });

        } catch (dbError) {
            // UNIQUE constraint violation
            if (dbError.code === '23505') {
                return res.status(400).json({ message: 'Bu projeye zaten basvuru yaptiniz.' });
            }
            console.error('Basvuru olusturulamadi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Basvuru olusturma hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 25. KULLANICI BAŞVURULARINI LİSTELE (GET /matches/user)
// Token'dan gelen kullanıcının tüm başvurularını getirir
// (Hem yaptığı başvurular hem de projelerine gelen başvurular)
app.get('/matches/user', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id; // Token'dan gelen kullanıcı ID'si (JWT payload'dan)

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for matches list (PostgreSQL not available)');

            // Kullanıcının sahip olduğu projeler
            const userProjects = inMemoryProjects.filter(p => p.owner_id == user_id);
            const userProjectIds = userProjects.map(p => p.project_id);

            // Kullanıcının yaptığı başvurular
            const applicantMatches = inMemoryMatches.filter(m => m.applicant_id == user_id);

            // Kullanıcının projelerine gelen başvurular
            const receivedMatches = inMemoryMatches.filter(m => 
                userProjectIds.includes(m.project_id)
            );

            return res.status(200).json({
                success: true,
                applicantMatches: applicantMatches,
                receivedMatches: receivedMatches
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // Kullanıcının yaptığı başvurular
            const applicantMatchesQuery = `
                SELECT 
                    m.match_id, 
                    m.applicant_id, 
                    m.project_id, 
                    m.status, 
                    m.olusturulma_tarihi,
                    p.title as project_title,
                    p.description as project_description,
                    p.owner_id as project_owner_id,
                    k.kullanici_adi as project_owner_name
                FROM Matches m
                JOIN Projects p ON m.project_id = p.project_id
                JOIN Kullanicilar k ON p.owner_id = k.id
                WHERE m.applicant_id = $1
                ORDER BY m.olusturulma_tarihi DESC
            `;

            const applicantMatchesResult = await db.query(applicantMatchesQuery, [user_id]);

            // Kullanıcının projelerine gelen başvurular
            const receivedMatchesQuery = `
                SELECT 
                    m.match_id, 
                    m.applicant_id, 
                    m.project_id, 
                    m.status, 
                    m.olusturulma_tarihi,
                    p.title as project_title,
                    p.description as project_description,
                    k.kullanici_adi as applicant_name,
                    k.email as applicant_email
                FROM Matches m
                JOIN Projects p ON m.project_id = p.project_id
                JOIN Kullanicilar k ON m.applicant_id = k.id
                WHERE p.owner_id = $1
                ORDER BY m.olusturulma_tarihi DESC
            `;

            const receivedMatchesResult = await db.query(receivedMatchesQuery, [user_id]);

            res.status(200).json({
                success: true,
                applicantMatches: applicantMatchesResult.rows,
                receivedMatches: receivedMatchesResult.rows
            });

        } catch (dbError) {
            console.error('Basvurular listelenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Basvuru listesi hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 26. BAŞVURU DURUMU GÜNCELLE (PUT /matches/:id/status)
// Sadece proje sahibi başvuru durumunu değiştirebilir (Pending -> Accepted/Rejected)
app.put('/matches/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params; // match_id
        const { status } = req.body;
        const user_id = req.user.id; // Token'dan gelen kullanıcı ID'si (JWT payload'dan)

        // Validasyon
        if (!status || !['Pending', 'Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ 
                message: 'Gecerli bir durum belirtmelisiniz: Pending, Accepted veya Rejected' 
            });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for match status update (PostgreSQL not available)');

            // Match'i bul
            const match = inMemoryMatches.find(m => m.match_id == id);
            if (!match) {
                return res.status(404).json({ message: 'Basvuru bulunamadi.' });
            }

            // Projeyi bul
            const project = inMemoryProjects.find(p => p.project_id == match.project_id);
            if (!project) {
                return res.status(404).json({ message: 'Proje bulunamadi.' });
            }

            // Sadece proje sahibi durumu değiştirebilir
            if (project.owner_id != user_id) {
                return res.status(403).json({ 
                    message: 'Bu islemi sadece proje sahibi yapabilir.' 
                });
            }

            // Durumu güncelle
            match.status = status;

            return res.status(200).json({
                success: true,
                message: 'Basvuru durumu guncellendi! (TEST MODU - In-Memory)',
                match: match
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // Önce başvurunun ve projenin sahibinin kontrolünü yap
            const checkQuery = `
                SELECT m.match_id, m.status, p.owner_id 
                FROM Matches m
                JOIN Projects p ON m.project_id = p.project_id
                WHERE m.match_id = $1
            `;

            const checkResult = await db.query(checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: 'Basvuru bulunamadi.' });
            }

            const matchData = checkResult.rows[0];

            // Sadece proje sahibi durumu değiştirebilir
            if (matchData.owner_id != user_id) {
                return res.status(403).json({ 
                    message: 'Bu islemi sadece proje sahibi yapabilir.' 
                });
            }

            // Durumu güncelle
            const updateQuery = `
                UPDATE Matches 
                SET status = $1 
                WHERE match_id = $2 
                RETURNING *
            `;

            const updateResult = await db.query(updateQuery, [status, id]);

            res.status(200).json({
                success: true,
                message: 'Basvuru durumu guncellendi!',
                match: updateResult.rows[0]
            });

        } catch (dbError) {
            console.error('Basvuru durumu guncellenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Durum guncelleme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 27. BAŞVURU SİL (DELETE /matches/:id)
// Sadece proje sahibi veya başvuruyu yapan kullanıcı silebilir
app.delete('/matches/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params; // match_id
        const user_id = req.user.id; // Token'dan gelen kullanıcı ID'si (JWT payload'dan)

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for match delete (PostgreSQL not available)');

            // Match'i bul
            const matchIndex = inMemoryMatches.findIndex(m => m.match_id == id);
            if (matchIndex === -1) {
                return res.status(404).json({ message: 'Basvuru bulunamadi.' });
            }

            const match = inMemoryMatches[matchIndex];

            // Projeyi bul
            const project = inMemoryProjects.find(p => p.project_id == match.project_id);
            if (!project) {
                return res.status(404).json({ message: 'Proje bulunamadi.' });
            }

            // Sadece proje sahibi veya başvuruyu yapan silebilir
            if (match.applicant_id != user_id && project.owner_id != user_id) {
                return res.status(403).json({ 
                    message: 'Bu basvuruyu silme yetkiniz yok.' 
                });
            }

            // Match'i sil
            inMemoryMatches.splice(matchIndex, 1);

            return res.status(200).json({
                success: true,
                message: 'Basvuru silindi! (TEST MODU - In-Memory)'
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // Önce başvurunun bilgilerini kontrol et
            const checkQuery = `
                SELECT m.match_id, m.applicant_id, p.owner_id 
                FROM Matches m
                JOIN Projects p ON m.project_id = p.project_id
                WHERE m.match_id = $1
            `;

            const checkResult = await db.query(checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: 'Basvuru bulunamadi.' });
            }

            const matchData = checkResult.rows[0];

            // Sadece proje sahibi veya başvuruyu yapan silebilir
            if (matchData.applicant_id != user_id && matchData.owner_id != user_id) {
                return res.status(403).json({ 
                    message: 'Bu basvuruyu silme yetkiniz yok.' 
                });
            }

            // Match'i sil
            const deleteQuery = 'DELETE FROM Matches WHERE match_id = $1';
            await db.query(deleteQuery, [id]);

            res.status(200).json({
                success: true,
                message: 'Basvuru silindi!'
            });

        } catch (dbError) {
            console.error('Basvuru silinemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Basvuru silme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// ============================================
// USER SKILLS API - KULLANICI BECERİ YÖNETİMİ
// ============================================

// 28. KULLANICININ BECERİLERİNİ GETIR (GET /user-skills/:userId)
app.get('/user-skills/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'Kullanici ID gereklidir.' });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            // In-memory için basit bir yapı kullanabiliriz (ileride eklenebilir)
            return res.status(200).json({
                success: true,
                message: 'In-memory modda User_Skill desteklenmiyor',
                offering: [],
                seeking: []
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            const sql = `
                SELECT 
                    us.id,
                    us.user_id,
                    us.skill_id,
                    us.type,
                    us.olusturulma_tarihi,
                    y.name as skill_name,
                    y.category as skill_category
                FROM User_Skill us
                JOIN Yetenekler y ON us.skill_id = y.id
                WHERE us.user_id = $1
                ORDER BY us.type, y.category, y.name
            `;

            const results = await db.query(sql, [userId]);

            // Offering ve Seeking olarak ayır
            const offering = results.rows.filter(row => row.type === 'Offering');
            const seeking = results.rows.filter(row => row.type === 'Seeking');

            res.status(200).json({
                success: true,
                offering: offering,
                seeking: seeking
            });

        } catch (dbError) {
            console.error('Kullanici becerileri getirilemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('User skills getirme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 29. KULLANICIYA BECERİ EKLE (POST /user-skills)
app.post('/user-skills', authenticateToken, async (req, res) => {
    try {
        const { skill_id, type } = req.body;
        const user_id = req.user.id; // Token'dan gelen kullanıcı ID'si

        // Validasyon
        if (!skill_id || !type) {
            return res.status(400).json({ message: 'skill_id ve type gereklidir.' });
        }

        if (!['Offering', 'Seeking'].includes(type)) {
            return res.status(400).json({ message: 'type sadece "Offering" veya "Seeking" olabilir.' });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            return res.status(501).json({
                success: false,
                message: 'In-memory modda User_Skill desteklenmiyor. PostgreSQL gerekli.'
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            const sql = `
                INSERT INTO User_Skill (user_id, skill_id, type) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `;

            const result = await db.query(sql, [user_id, skill_id, type]);

            res.status(201).json({
                success: true,
                message: 'Beceri basariyla eklendi!',
                user_skill: result.rows[0]
            });

        } catch (dbError) {
            // UNIQUE constraint violation
            if (dbError.code === '23505') {
                return res.status(400).json({ message: 'Bu beceri zaten ekli.' });
            }
            // Foreign key violation
            if (dbError.code === '23503') {
                return res.status(400).json({ message: 'Gecersiz skill_id veya user_id.' });
            }
            console.error('Beceri eklenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('User skill ekleme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 30. KULLANICIDAN BECERİ SİL (DELETE /user-skills/:id)
app.delete('/user-skills/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params; // user_skill id
        const user_id = req.user.id; // Token'dan gelen kullanıcı ID'si

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            return res.status(501).json({
                success: false,
                message: 'In-memory modda User_Skill desteklenmiyor. PostgreSQL gerekli.'
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // Önce bu becerinin bu kullanıcıya ait olup olmadığını kontrol et
            const checkQuery = 'SELECT user_id FROM User_Skill WHERE id = $1';
            const checkResult = await db.query(checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ message: 'Beceri bulunamadi.' });
            }

            // Sadece kendi becerisini silebilir
            if (checkResult.rows[0].user_id != user_id) {
                return res.status(403).json({ 
                    message: 'Bu beceriyi silme yetkiniz yok.' 
                });
            }

            // Beceriyi sil
            const deleteQuery = 'DELETE FROM User_Skill WHERE id = $1';
            await db.query(deleteQuery, [id]);

            res.status(200).json({
                success: true,
                message: 'Beceri silindi!'
            });

        } catch (dbError) {
            console.error('Beceri silinemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('User skill silme hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// ============================================
// SWAPS API - KARŞILIKLI EŞLEŞME (RECIPROCAL MATCHING)
// ============================================

// DEBUG: User_Skill verilerini kontrol et (geçici)
app.get('/debug/user-skills', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        if (useInMemoryDB || !db) {
            return res.status(501).json({ message: 'PostgreSQL gerekli' });
        }

        // Tüm kullanıcıların becerilerini getir
        const allSkills = await db.query(`
            SELECT 
                us.id,
                us.user_id,
                us.skill_id,
                us.type,
                u.kullanici_adi,
                y.name as skill_name,
                y.category as skill_category
            FROM User_Skill us
            JOIN Kullanicilar u ON us.user_id = u.id
            JOIN Yetenekler y ON us.skill_id = y.id
            ORDER BY us.user_id, us.type
        `);

        // Mevcut kullanıcının becerilerini getir
        const currentUserSkills = await db.query(`
            SELECT 
                us.id,
                us.skill_id,
                us.type,
                y.name as skill_name,
                y.category as skill_category
            FROM User_Skill us
            JOIN Yetenekler y ON us.skill_id = y.id
            WHERE us.user_id = $1
            ORDER BY us.type, y.name
        `, [user_id]);

        res.status(200).json({
            success: true,
            current_user_id: user_id,
            current_user_skills: currentUserSkills.rows,
            all_user_skills: allSkills.rows,
            total_records: allSkills.rows.length
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 31. KARŞILIKLI EŞLEŞME - RECIPROCAL MATCHING (GET /swaps/reciprocal)
// Token'dan gelen kullanıcı için, iki yönlü beceri eşleşmesi olan kullanıcıları listeler
// Mantık:
// - Kullanıcı A'nın Seeking becerileri = Kullanıcı B'nin Offering becerileri
// - Kullanıcı B'nin Seeking becerileri = Kullanıcı A'nın Offering becerileri
app.get('/swaps/reciprocal', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id; // Token'dan gelen kullanıcı ID'si (Kullanıcı A)

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            return res.status(501).json({
                success: false,
                message: 'Reciprocal matching sadece PostgreSQL ile destekleniyor.',
                matches: []
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // Karmaşık SQL sorgusu: İki yönlü eşleşme
            // jsonb_agg kullanarak ve COALESCE ile NULL kontrolü yapıyoruz
            const sql = `
                SELECT DISTINCT
                    u.id,
                    u.kullanici_adi,
                    u.email,
                    u.olusturulma_tarihi,
                    -- A'nın Seeking becerileri ve B'nin karşılayan Offering becerileri
                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'skill_id', y.id,
                                    'skill_name', y.name,
                                    'skill_category', y.category
                                )
                            )
                            FROM User_Skill us_a_seeking
                            INNER JOIN User_Skill us_b_offering 
                                ON us_a_seeking.skill_id = us_b_offering.skill_id
                            INNER JOIN Yetenekler y 
                                ON us_a_seeking.skill_id = y.id
                            WHERE us_a_seeking.user_id = $1
                            AND us_a_seeking.type = 'Seeking'
                            AND us_b_offering.user_id = u.id
                            AND us_b_offering.type = 'Offering'
                        ),
                        '[]'::jsonb
                    ) as matched_skills_a_needs,
                    -- B'nin Seeking becerileri ve A'nın karşılayan Offering becerileri
                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'skill_id', y.id,
                                    'skill_name', y.name,
                                    'skill_category', y.category
                                )
                            )
                            FROM User_Skill us_b_seeking
                            INNER JOIN User_Skill us_a_offering 
                                ON us_b_seeking.skill_id = us_a_offering.skill_id
                            INNER JOIN Yetenekler y 
                                ON us_b_seeking.skill_id = y.id
                            WHERE us_b_seeking.user_id = u.id
                            AND us_b_seeking.type = 'Seeking'
                            AND us_a_offering.user_id = $1
                            AND us_a_offering.type = 'Offering'
                        ),
                        '[]'::jsonb
                    ) as matched_skills_b_needs
                FROM Kullanicilar u
                WHERE u.id != $1  -- Kendini eşleştirme
                AND EXISTS (
                    -- Koşul 1: A'nın Seeking becerileri, B'nin Offering becerileri ile eşleşiyor
                    SELECT 1
                    FROM User_Skill us_a_seeking
                    INNER JOIN User_Skill us_b_offering 
                        ON us_a_seeking.skill_id = us_b_offering.skill_id
                    WHERE us_a_seeking.user_id = $1
                    AND us_a_seeking.type = 'Seeking'
                    AND us_b_offering.user_id = u.id
                    AND us_b_offering.type = 'Offering'
                )
                AND EXISTS (
                    -- Koşul 2: B'nin Seeking becerileri, A'nın Offering becerileri ile eşleşiyor
                    SELECT 1
                    FROM User_Skill us_b_seeking
                    INNER JOIN User_Skill us_a_offering 
                        ON us_b_seeking.skill_id = us_a_offering.skill_id
                    WHERE us_b_seeking.user_id = u.id
                    AND us_b_seeking.type = 'Seeking'
                    AND us_a_offering.user_id = $1
                    AND us_a_offering.type = 'Offering'
                )
                AND NOT EXISTS (
                    -- Koşul 3: A ile B arasında kabul edilmiş bir swap request yok
                    SELECT 1
                    FROM Swap_Requests sr
                    WHERE ((sr.sender_id = $1 AND sr.receiver_id = u.id) 
                           OR (sr.sender_id = u.id AND sr.receiver_id = $1))
                    AND sr.status = 'Accepted'
                )
                ORDER BY u.kullanici_adi
            `;

            const results = await db.query(sql, [user_id]);
            
            // JSONB sonuçlarını düzgün bir şekilde işle
            const processedResults = results.rows.map(row => ({
                ...row,
                matched_skills_a_needs: row.matched_skills_a_needs || [],
                matched_skills_b_needs: row.matched_skills_b_needs || []
            }));

            res.status(200).json({
                success: true,
                message: 'Karsilikli eslesmeler basariyla getirildi!',
                user_id: user_id,
                matches_count: processedResults.length,
                matches: processedResults
            });

        } catch (dbError) {
            console.error('Reciprocal matching hatasi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Swaps reciprocal hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// ============================================
// DASHBOARD TASKS API - GÖREV YÖNETİMİ
// ============================================

// 32. KULLANICI GÖREVLERİNİ LİSTELE (GET /user/tasks)
// Filter parametreleri: ongoing, offers, suggestions
app.get('/user/tasks', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id; // Token'dan gelen kullanıcı ID'si
        const { filter } = req.query; // Query parameter: ?filter=ongoing

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            console.log('Using in-memory database for user tasks (PostgreSQL not available)');

            // 1. DEVAM EDEN İŞLER (ongoing)
            if (filter === 'ongoing') {
                // Kullanıcının owner olduğu projeler
                const ownedProjects = inMemoryProjects.filter(p => p.owner_id == user_id);

                // Kullanıcının başvurusu Accepted olan projeler
                const acceptedMatches = inMemoryMatches.filter(
                    m => m.applicant_id == user_id && m.status === 'Accepted'
                );
                const acceptedProjectIds = acceptedMatches.map(m => m.project_id);
                const acceptedProjects = inMemoryProjects.filter(
                    p => acceptedProjectIds.includes(p.project_id)
                );

                return res.status(200).json({
                    success: true,
                    filter: 'ongoing',
                    ownedProjects: ownedProjects,
                    acceptedProjects: acceptedProjects,
                    totalCount: ownedProjects.length + acceptedProjects.length
                });
            }

            // 2. BEKLEYEN TEKLİFLER (offers)
            if (filter === 'offers') {
                // Kullanıcının sahip olduğu projeler
                const userProjects = inMemoryProjects.filter(p => p.owner_id == user_id);
                const userProjectIds = userProjects.map(p => p.project_id);

                // Bu projelere gelen Pending başvurular
                const pendingOffers = inMemoryMatches.filter(
                    m => userProjectIds.includes(m.project_id) && m.status === 'Pending'
                );

                // Başvuru sahiplerinin bilgilerini ekle
                const offersWithApplicants = pendingOffers.map(match => {
                    const applicant = inMemoryUsers.find(u => u.id === match.applicant_id);
                    const project = inMemoryProjects.find(p => p.project_id === match.project_id);
                    return {
                        ...match,
                        applicant_name: applicant ? applicant.kullanici_adi : 'Bilinmeyen',
                        applicant_email: applicant ? applicant.email : '',
                        project_title: project ? project.title : '',
                        project_description: project ? project.description : ''
                    };
                });

                return res.status(200).json({
                    success: true,
                    filter: 'offers',
                    offers: offersWithApplicants,
                    totalCount: offersWithApplicants.length
                });
            }

            // 3. ÖNERİLER (suggestions)
            // Not: Skill bazlı filtreleme için profile verisi gerekli
            if (filter === 'suggestions') {
                // Kullanıcının başvurmadığı ve sahibi olmadığı projeler
                const userMatches = inMemoryMatches.filter(m => m.applicant_id == user_id);
                const appliedProjectIds = userMatches.map(m => m.project_id);

                const suggestions = inMemoryProjects.filter(
                    p => p.owner_id != user_id && !appliedProjectIds.includes(p.project_id)
                );

                return res.status(200).json({
                    success: true,
                    filter: 'suggestions',
                    suggestions: suggestions,
                    totalCount: suggestions.length
                });
            }

            // Filter belirtilmemişse tümünü döndür
            return res.status(400).json({ 
                message: 'Lutfen bir filter belirtin: ongoing, offers veya suggestions' 
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // 1. DEVAM EDEN İŞLER (ongoing)
            if (filter === 'ongoing') {
                // Kullanıcının owner olduğu projeler
                const ownedProjectsQuery = `
                    SELECT 
                        p.project_id, 
                        p.owner_id, 
                        p.title, 
                        p.description, 
                        p.olusturulma_tarihi,
                        'owned' as project_type
                    FROM Projects p
                    WHERE p.owner_id = $1
                    ORDER BY p.olusturulma_tarihi DESC
                `;

                const ownedProjects = await db.query(ownedProjectsQuery, [user_id]);

                // Kullanıcının başvurusu Accepted olan projeler
                const acceptedProjectsQuery = `
                    SELECT 
                        p.project_id, 
                        p.owner_id, 
                        p.title, 
                        p.description, 
                        p.olusturulma_tarihi,
                        m.match_id,
                        m.status,
                        'accepted' as project_type,
                        k.kullanici_adi as owner_name
                    FROM Matches m
                    JOIN Projects p ON m.project_id = p.project_id
                    JOIN Kullanicilar k ON p.owner_id = k.id
                    WHERE m.applicant_id = $1 AND m.status = 'Accepted'
                    ORDER BY m.olusturulma_tarihi DESC
                `;

                const acceptedProjects = await db.query(acceptedProjectsQuery, [user_id]);

                return res.status(200).json({
                    success: true,
                    filter: 'ongoing',
                    ownedProjects: ownedProjects.rows,
                    acceptedProjects: acceptedProjects.rows,
                    totalCount: ownedProjects.rows.length + acceptedProjects.rows.length
                });
            }

            // 2. BEKLEYEN TEKLİFLER (offers)
            if (filter === 'offers') {
                const offersQuery = `
                    SELECT 
                        m.match_id, 
                        m.applicant_id, 
                        m.project_id, 
                        m.status, 
                        m.olusturulma_tarihi,
                        p.title as project_title,
                        p.description as project_description,
                        k.kullanici_adi as applicant_name,
                        k.email as applicant_email
                    FROM Matches m
                    JOIN Projects p ON m.project_id = p.project_id
                    JOIN Kullanicilar k ON m.applicant_id = k.id
                    WHERE p.owner_id = $1 AND m.status = 'Pending'
                    ORDER BY m.olusturulma_tarihi DESC
                `;

                const offers = await db.query(offersQuery, [user_id]);

                return res.status(200).json({
                    success: true,
                    filter: 'offers',
                    offers: offers.rows,
                    totalCount: offers.rows.length
                });
            }

            // 3. ÖNERİLER (suggestions)
            if (filter === 'suggestions') {
                // Kullanıcının başvurmadığı ve sahibi olmadığı projeler
                const suggestionsQuery = `
                    SELECT 
                        p.project_id, 
                        p.owner_id, 
                        p.title, 
                        p.description, 
                        p.olusturulma_tarihi,
                        k.kullanici_adi as owner_name,
                        k.email as owner_email
                    FROM Projects p
                    JOIN Kullanicilar k ON p.owner_id = k.id
                    WHERE p.owner_id != $1
                    AND p.project_id NOT IN (
                        SELECT project_id 
                        FROM Matches 
                        WHERE applicant_id = $1
                    )
                    ORDER BY p.olusturulma_tarihi DESC
                `;

                const suggestions = await db.query(suggestionsQuery, [user_id]);

                return res.status(200).json({
                    success: true,
                    filter: 'suggestions',
                    suggestions: suggestions.rows,
                    totalCount: suggestions.rows.length
                });
            }

            // Filter belirtilmemişse hata döndür
            return res.status(400).json({ 
                message: 'Lutfen bir filter belirtin: ongoing, offers veya suggestions' 
            });

        } catch (dbError) {
            console.error('Kullanici gorevleri listelenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Gorev listesi hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// ============================================
// SWAP REQUESTS API - EŞLEŞME İSTEKLERİ
// ============================================

// 34. EŞLEŞME İSTEĞİ GÖNDER (POST /swap-requests)
app.post('/swap-requests', authenticateToken, async (req, res) => {
    try {
        const { receiver_id } = req.body;
        const sender_id = req.user.id;

        if (!receiver_id) {
            return res.status(400).json({ message: 'Alıcı kullanıcı ID gereklidir.' });
        }

        if (sender_id == receiver_id) {
            return res.status(400).json({ message: 'Kendinize istek gönderemezsiniz.' });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            return res.status(501).json({
                success: false,
                message: 'Swap requests sadece PostgreSQL ile destekleniyor.'
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // Alıcı kullanıcının varlığını kontrol et
            const receiverCheck = await db.query('SELECT id FROM Kullanicilar WHERE id = $1', [receiver_id]);
            if (receiverCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Alıcı kullanıcı bulunamadı.' });
            }

            // Zaten istek gönderilmiş mi kontrol et
            const existingRequest = await db.query(
                'SELECT id, status FROM Swap_Requests WHERE sender_id = $1 AND receiver_id = $2',
                [sender_id, receiver_id]
            );

            if (existingRequest.rows.length > 0) {
                const request = existingRequest.rows[0];
                if (request.status === 'Pending') {
                    return res.status(400).json({ message: 'Bu kullanıcıya zaten istek gönderdiniz.' });
                } else if (request.status === 'Accepted') {
                    return res.status(400).json({ message: 'Bu kullanıcıyla zaten eşleşme kabul edildi.' });
                }
            }

            // Yeni istek oluştur
            const sql = `
                INSERT INTO Swap_Requests (sender_id, receiver_id, status) 
                VALUES ($1, $2, 'Pending') 
                RETURNING *
            `;

            const result = await db.query(sql, [sender_id, receiver_id]);

            res.status(201).json({
                success: true,
                message: 'Eşleşme isteği başarıyla gönderildi!',
                request: result.rows[0]
            });

        } catch (dbError) {
            if (dbError.code === '23505') { // UNIQUE constraint violation
                return res.status(400).json({ message: 'Bu kullanıcıya zaten istek gönderdiniz.' });
            }
            console.error('Eşleşme isteği gönderilemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Swap request hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 35. EŞLEŞME İSTEKLERİNİ GETİR (GET /swap-requests)
// Gelen ve giden istekleri getirir
app.get('/swap-requests', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            return res.status(501).json({
                success: false,
                message: 'Swap requests sadece PostgreSQL ile destekleniyor.',
                incoming: [],
                outgoing: [],
                accepted: []
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // Gelen istekler (Pending)
            const incomingQuery = `
                SELECT 
                    sr.id,
                    sr.sender_id,
                    sr.receiver_id,
                    sr.status,
                    sr.olusturulma_tarihi,
                    u.kullanici_adi as sender_name,
                    u.email as sender_email
                FROM Swap_Requests sr
                JOIN Kullanicilar u ON sr.sender_id = u.id
                WHERE sr.receiver_id = $1 AND sr.status = 'Pending'
                ORDER BY sr.olusturulma_tarihi DESC
            `;
            const incoming = await db.query(incomingQuery, [user_id]);

            // Giden istekler (Pending)
            const outgoingQuery = `
                SELECT 
                    sr.id,
                    sr.sender_id,
                    sr.receiver_id,
                    sr.status,
                    sr.olusturulma_tarihi,
                    u.kullanici_adi as receiver_name,
                    u.email as receiver_email
                FROM Swap_Requests sr
                JOIN Kullanicilar u ON sr.receiver_id = u.id
                WHERE sr.sender_id = $1 AND sr.status = 'Pending'
                ORDER BY sr.olusturulma_tarihi DESC
            `;
            const outgoing = await db.query(outgoingQuery, [user_id]);

            // Kabul edilenler (Accepted - hem gönderen hem alan olarak)
            const acceptedQuery = `
                SELECT 
                    sr.id,
                    sr.sender_id,
                    sr.receiver_id,
                    sr.status,
                    sr.olusturulma_tarihi,
                    sr.guncelleme_tarihi,
                    sender.kullanici_adi as sender_name,
                    sender.email as sender_email,
                    receiver.kullanici_adi as receiver_name,
                    receiver.email as receiver_email,
                    CASE 
                        WHEN sr.sender_id = $1 THEN receiver.kullanici_adi
                        ELSE sender.kullanici_adi
                    END as other_user_name,
                    CASE 
                        WHEN sr.sender_id = $1 THEN receiver.email
                        ELSE sender.email
                    END as other_user_email
                FROM Swap_Requests sr
                JOIN Kullanicilar sender ON sr.sender_id = sender.id
                JOIN Kullanicilar receiver ON sr.receiver_id = receiver.id
                WHERE (sr.sender_id = $1 OR sr.receiver_id = $1) AND sr.status = 'Accepted'
                ORDER BY sr.guncelleme_tarihi DESC
            `;
            const accepted = await db.query(acceptedQuery, [user_id]);

            res.status(200).json({
                success: true,
                incoming: incoming.rows,
                outgoing: outgoing.rows,
                accepted: accepted.rows
            });

        } catch (dbError) {
            console.error('Eşleşme istekleri getirilemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Swap requests hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 36. EŞLEŞME İSTEĞİ DURUMU GÜNCELLE (PUT /swap-requests/:id/status)
// Sadece alıcı kullanıcı kabul/red edebilir
app.put('/swap-requests/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user_id = req.user.id;

        if (!status || !['Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ 
                message: 'Gecerli bir durum belirtmelisiniz: Accepted veya Rejected' 
            });
        }

        // In-memory kullanılıyorsa
        if (useInMemoryDB || !db) {
            return res.status(501).json({
                success: false,
                message: 'Swap requests sadece PostgreSQL ile destekleniyor.'
            });
        }

        // PostgreSQL kullanılıyorsa
        try {
            // İsteği bul ve alıcı kontrolü yap
            const requestCheck = await db.query(
                'SELECT id, receiver_id, status FROM Swap_Requests WHERE id = $1',
                [id]
            );

            if (requestCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Eşleşme isteği bulunamadı.' });
            }

            const request = requestCheck.rows[0];

            // Sadece alıcı kullanıcı durumu değiştirebilir
            if (request.receiver_id != user_id) {
                return res.status(403).json({ 
                    message: 'Bu isteği sadece alıcı kullanıcı kabul/red edebilir.' 
                });
            }

            // Zaten işlenmiş mi kontrol et
            if (request.status !== 'Pending') {
                return res.status(400).json({ 
                    message: `Bu istek zaten ${request.status === 'Accepted' ? 'kabul edilmiş' : 'reddedilmiş'}.` 
                });
            }

            // Durumu güncelle
            const updateQuery = `
                UPDATE Swap_Requests 
                SET status = $1, guncelleme_tarihi = CURRENT_TIMESTAMP
                WHERE id = $2 
                RETURNING *
            `;

            const result = await db.query(updateQuery, [status, id]);

            res.status(200).json({
                success: true,
                message: `Eşleşme isteği ${status === 'Accepted' ? 'kabul edildi' : 'reddedildi'}!`,
                request: result.rows[0]
            });

        } catch (dbError) {
            console.error('Eşleşme isteği guncellenemedi:', dbError);
            return res.status(500).json({ message: 'Sunucu hatasi: ' + dbError.message });
        }

    } catch (error) {
        console.error('Swap request status hatasi:', error);
        res.status(500).json({ message: 'Sunucu hatasi: ' + error.message });
    }
});

// 33. Sunucuyu dinle
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde basariyla baslatildi.`);
});
