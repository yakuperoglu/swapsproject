const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'swaps_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Railway MySQL için önemli ayarlar
    connectTimeout: 60000,
    charset: 'utf8mb4'
};

// Connection pool oluştur
let pool = null;

// Database bağlantısını başlat
async function initializeDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        
        // Bağlantıyı test et
        const connection = await pool.getConnection();
        console.log('✅ MySQL veritabanına başarıyla bağlanıldı!');
        console.log(`📊 Database: ${dbConfig.database}`);
        console.log(`🌐 Host: ${dbConfig.host}`);
        
        connection.release();
        
        return pool;
    } catch (error) {
        console.error('❌ MySQL bağlantı hatası:', error.message);
        console.log('⚠️  In-memory veritabanı modu aktif olacak');
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
        const connection = await pool.getConnection();
        
        // Kullanicilar tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Kullanicilar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                kullanici_adi VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                sifre VARCHAR(255) NOT NULL,
                rol ENUM('User', 'Admin') NOT NULL DEFAULT 'User',
                olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Yetenekler tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Yetenekler (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_skill (name, category),
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Varsayılan yetenekleri ekle (eğer yoksa)
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM Yetenekler');
        if (rows[0].count === 0) {
            await connection.query(`
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
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Projects (
                project_id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_owner
                    FOREIGN KEY(owner_id) 
                    REFERENCES Kullanicilar(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Matches tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Matches (
                match_id INT AUTO_INCREMENT PRIMARY KEY,
                applicant_id INT NOT NULL,
                project_id INT NOT NULL,
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
                UNIQUE KEY unique_application (applicant_id, project_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Messages tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Messages (
                message_id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_sender
                    FOREIGN KEY(sender_id) 
                    REFERENCES Kullanicilar(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_receiver
                    FOREIGN KEY(receiver_id) 
                    REFERENCES Kullanicilar(id)
                    ON DELETE CASCADE,
                INDEX idx_sender (sender_id),
                INDEX idx_receiver (receiver_id),
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        connection.release();
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

