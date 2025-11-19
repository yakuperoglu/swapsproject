const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'swaps_db',
    max: 10, // connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 60000,
    // Render PostgreSQL için SSL gerekli
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com') 
        ? { rejectUnauthorized: false } 
        : false,
};

// Connection pool oluştur
let pool = null;

// Database bağlantısını başlat
async function initializeDatabase() {
    try {
        pool = new Pool(dbConfig);
        
        // Bağlantıyı test et
        const client = await pool.connect();
        console.log('✅ PostgreSQL veritabanına başarıyla bağlanıldı!');
        console.log(`📊 Database: ${dbConfig.database}`);
        console.log(`🌐 Host: ${dbConfig.host}`);
        
        client.release();
        
        return pool;
    } catch (error) {
        console.error('❌ PostgreSQL bağlantı hatası:', error.message);
        console.log('⚠️  In-memory veritabanı modu aktif olacak');
        // Hatalı pool referansını temizle ki uygulama yanlışlıkla PostgreSQL kullanmaya çalışmasın
        if (pool) {
            try {
                await pool.end();
            } catch (closeError) {
                console.warn('Pool kapatılırken hata oluştu:', closeError.message);
            }
        }
        pool = null;
        return null;
    }
}

// Schema'yı otomatik olarak oluştur (ilk çalıştırmada)
async function createSchema() {
    if (!pool) {
        console.log('⚠️  Database pool mevcut değil, schema oluşturulamıyor');
        return false;
    }

    try {
        // Kullanicilar tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Kullanicilar (
                id SERIAL PRIMARY KEY,
                kullanici_adi VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                sifre VARCHAR(255) NOT NULL,
                rol VARCHAR(20) NOT NULL DEFAULT 'User' CHECK (rol IN ('User', 'Admin')),
                olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Yetenekler tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Yetenekler (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_skill UNIQUE (name, category)
            )
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_category ON Yetenekler(category)
        `);
        
        // Varsayılan yetenekleri ekle (eğer yoksa)
        const result = await pool.query('SELECT COUNT(*) as count FROM Yetenekler');
        if (parseInt(result.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO Yetenekler (name, category) VALUES
                ('İngilizce', 'Dil'),
                ('Fransızca', 'Dil'),
                ('Almanca', 'Dil'),
                ('İspanyolca', 'Dil'),
                ('Çince', 'Dil'),
                ('Japonca', 'Dil'),
                ('JavaScript', 'Programlama'),
                ('Python', 'Programlama'),
                ('Java', 'Programlama'),
                ('C++', 'Programlama'),
                ('React', 'Programlama'),
                ('Node.js', 'Programlama'),
                ('Gitar', 'Müzik'),
                ('Piyano', 'Müzik'),
                ('Keman', 'Müzik'),
                ('Davul', 'Müzik'),
                ('Photoshop', 'Tasarım'),
                ('Illustrator', 'Tasarım'),
                ('Figma', 'Tasarım'),
                ('UI/UX Design', 'Tasarım')
            `);
            console.log('✅ Varsayılan yetenekler eklendi');
        }
        
        // Projects tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Projects (
                project_id SERIAL PRIMARY KEY,
                owner_id INTEGER NOT NULL,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_owner
                    FOREIGN KEY(owner_id) 
                    REFERENCES Kullanicilar(id)
                    ON DELETE CASCADE
            )
        `);
        
        // Matches tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Matches (
                match_id SERIAL PRIMARY KEY,
                applicant_id INTEGER NOT NULL,
                project_id INTEGER NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'Pending',
                olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_applicant
                    FOREIGN KEY(applicant_id) 
                    REFERENCES Kullanicilar(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_project
                    FOREIGN KEY(project_id) 
                    REFERENCES Projects(project_id)
                    ON DELETE CASCADE,
                CONSTRAINT unique_application UNIQUE (applicant_id, project_id)
            )
        `);
        
        // Messages tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Messages (
                message_id SERIAL PRIMARY KEY,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_sender
                    FOREIGN KEY(sender_id) 
                    REFERENCES Kullanicilar(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_receiver
                    FOREIGN KEY(receiver_id) 
                    REFERENCES Kullanicilar(id)
                    ON DELETE CASCADE
            )
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_sender ON Messages(sender_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_receiver ON Messages(receiver_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_timestamp ON Messages(timestamp)
        `);
        
        console.log('✅ Veritabanı şeması başarıyla oluşturuldu!');
        return true;
        
    } catch (error) {
        console.error('❌ Schema oluşturma hatası:', error.message);
        return false;
    }
}

// Database connection'ı al
function getConnection() {
    return pool;
}

// Bağlantıyı kapat
async function closeConnection() {
    if (pool) {
        await pool.end();
        console.log('Database connection pool kapatıldı');
    }
}

module.exports = {
    initializeDatabase,
    createSchema,
    getConnection,
    closeConnection
};
