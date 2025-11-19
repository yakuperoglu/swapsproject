// .env dosyasındaki gizli bilgileri yüklemek için bu satır en üste eklenir.
require('dotenv').config();

// 1. Kütüphaneleri çağır
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// PostgreSQL veritabanı bağlantısı
const { initializeDatabase, createSchema, getConnection } = require('./config/database');

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
        
        // Token geçerliyse, kullanıcı bilgilerini (kullanici_id, email, rol) isteğe ekle.
        req.user = user;
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

            return res.status(201).json({ 
                message: 'Kullanici basariyla olusturuldu! (TEST MODU - In-Memory)',
                user: {
                    id: newUser.id,
                    username: kullanici_adi,
                    email: email
                },
                token: 'temp-token-' + newUser.id // Kayıt sonrası otomatik giriş için token
            });
        }

        // PostgreSQL kullanılıyorsa
        console.log('Using PostgreSQL database');
        const hashlenmisSifre = await bcrypt.hash(sifre, 10);
        const sql = "INSERT INTO Kullanicilar (kullanici_adi, email, sifre) VALUES ($1, $2, $3) RETURNING id";

        try {
            const result = await db.query(sql, [kullanici_adi, email, hashlenmisSifre]);
            const userId = result.rows[0].id;
            
            console.log('User created successfully in PostgreSQL');
            res.status(201).json({ 
                message: 'Kullanici basariyla olusturuldu!',
                user: {
                    id: userId,
                    username: kullanici_adi,
                    email: email
                },
                token: 'temp-token-' + userId // Kayıt sonrası otomatik giriş için token
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

        // Admin kontrolü
        if (email === 'admin1@gmail.com' && sifre === 'admin-1') {
            return res.status(200).json({
                message: 'Admin girisi basarili!',
                user: {
                    id: 'admin',
                    username: 'Admin',
                    email: 'admin1@gmail.com',
                    role: 'admin'
                },
                token: 'admin-token-special'
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

            return res.status(200).json({
                message: 'Giris basarili! (TEST MODU - In-Memory)',
                user: {
                    id: kullanici.id,
                    username: kullanici.kullanici_adi,
                    email: kullanici.email,
                    role: 'user'
                },
                token: 'temp-token-' + kullanici.id
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

            // Başarılı giriş - token olmadan basit response (ileride JWT eklenebilir)
            res.status(200).json({
                message: 'Giris basarili!',
                user: {
                    id: kullanici.id,
                    username: kullanici.kullanici_adi,
                    email: kullanici.email,
                    role: 'user'
                },
                token: 'temp-token-' + kullanici.id // Geçici token, ileride JWT ile değiştirilebilir
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
// MATCHES API - BAŞVURU YÖNETİMİ
// ============================================

// 18. BAŞVURU OLUŞTURMA (POST /matches)
// Token'dan gelen kullanıcı, belirtilen projeye başvurur
app.post('/matches', authenticateToken, async (req, res) => {
    try {
        const { project_id } = req.body;
        const applicant_id = req.user.kullanici_id; // Token'dan gelen kullanıcı ID'si

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

// 19. KULLANICI BAŞVURULARINI LİSTELE (GET /matches/user)
// Token'dan gelen kullanıcının tüm başvurularını getirir
// (Hem yaptığı başvurular hem de projelerine gelen başvurular)
app.get('/matches/user', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.kullanici_id; // Token'dan gelen kullanıcı ID'si

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

// 20. BAŞVURU DURUMU GÜNCELLE (PUT /matches/:id/status)
// Sadece proje sahibi başvuru durumunu değiştirebilir (Pending -> Accepted/Rejected)
app.put('/matches/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params; // match_id
        const { status } = req.body;
        const user_id = req.user.kullanici_id; // Token'dan gelen kullanıcı ID'si

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

// 21. BAŞVURU SİL (DELETE /matches/:id)
// Sadece proje sahibi veya başvuruyu yapan kullanıcı silebilir
app.delete('/matches/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params; // match_id
        const user_id = req.user.kullanici_id; // Token'dan gelen kullanıcı ID'si

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

// 22. Sunucuyu dinle
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde basariyla baslatildi.`);
});
