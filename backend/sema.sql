-- MySQL için SwapS veritabanı şeması
-- NOT: PostgreSQL yerine MySQL kullanıyoruz

-- ÖNCE: Her şeyi temizle (Eğer yarım yamalak oluştularsa diye)
-- (Ters sırada silmemiz gerekir: Önce Mesajları, sonra Maçları, sonra Projeleri...)
DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS Matches;
DROP TABLE IF EXISTS Projects;
DROP TABLE IF EXISTS Yetenekler;
DROP TABLE IF EXISTS Kullanicilar;

-- ŞİMDİ: Her şeyi sıfırdan ve doğru sırada oluştur

-- 1. Kullanicilar Tablosu
CREATE TABLE Kullanicilar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kullanici_adi VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    sifre VARCHAR(255) NOT NULL,
    rol ENUM('User', 'Admin') NOT NULL DEFAULT 'User',
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Yetenekler Tablosu (Admin panelden yönetilir)
CREATE TABLE Yetenekler (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_skill (name, category),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_owner
        FOREIGN KEY(owner_id) 
        REFERENCES Kullanicilar(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Matches Tablosu
CREATE TABLE Matches (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Messages Tablosu
CREATE TABLE Messages (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
