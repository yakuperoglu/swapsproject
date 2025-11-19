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

// 18. Sunucuyu dinle
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde basariyla baslatildi.`);
});
