-- PostgreSQL için SwapS veritabanı şeması

-- ÖNCE: Her şeyi temizle (Eğer yarım yamalak oluştularsa diye)
-- (Ters sırada silmemiz gerekir: Önce Mesajları, sonra Maçları, sonra Projeleri...)
DROP TABLE IF EXISTS Messages CASCADE;
DROP TABLE IF EXISTS Matches CASCADE;
DROP TABLE IF EXISTS Projects CASCADE;
DROP TABLE IF EXISTS Yetenekler CASCADE;
DROP TABLE IF EXISTS Kullanicilar CASCADE;

-- ŞİMDİ: Her şeyi sıfırdan ve doğru sırada oluştur

-- 1. Kullanicilar Tablosu
CREATE TABLE Kullanicilar (
    id SERIAL PRIMARY KEY,
    kullanici_adi VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    sifre VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'User' CHECK (rol IN ('User', 'Admin')),
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Yetenekler Tablosu (Admin panelden yönetilir)
CREATE TABLE Yetenekler (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_skill UNIQUE (name, category)
);

CREATE INDEX idx_category ON Yetenekler(category);

-- Varsayılan yetenekleri ekle
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
('UI/UX Design', 'Tasarım');

-- 3. Projects Tablosu
CREATE TABLE Projects (
    project_id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_owner
        FOREIGN KEY(owner_id) 
        REFERENCES Kullanicilar(id)
        ON DELETE CASCADE
);

-- 4. Matches Tablosu
CREATE TABLE Matches (
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
);

-- 5. Messages Tablosu
CREATE TABLE Messages (
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
);

CREATE INDEX idx_sender ON Messages(sender_id);
CREATE INDEX idx_receiver ON Messages(receiver_id);
CREATE INDEX idx_timestamp ON Messages(timestamp);
