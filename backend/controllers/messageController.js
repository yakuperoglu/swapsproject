const { getConnection } = require('../config/database'); // PostgreSQL bağlantımız

// Database connection'ı al
function getDb() {
    return getConnection();
}

/**
 * YENİ MESAJ GÖNDERME (CREATE)
 * POST /api/messages
 */
exports.sendMessage = async (req, res) => {
    try {
        // 1. Gönderen kişi (Token'dan)
        const sender_id = req.user.kullanici_id;

        // 2. Alan kişi ve içerik (Frontend'den)
        const { receiver_id, content } = req.body;

        if (!receiver_id || !content) {
            return res.status(400).json({ message: 'Alıcı ID (receiver_id) ve içerik (content) zorunludur.' });
        }

        if (sender_id == receiver_id) {
             return res.status(400).json({ message: 'Kullanıcı kendi kendine mesaj gönderemez.' });
        }

        const db = getDb();
        if (!db) {
            return res.status(500).json({ message: 'Veritabanı bağlantısı mevcut değil.' });
        }

        const query = `
            INSERT INTO Messages (sender_id, receiver_id, content) 
            VALUES ($1, $2, $3) 
            RETURNING *
        `;

        const { rows } = await db.query(query, [sender_id, receiver_id, content]);

        res.status(201).json(rows[0]);

    } catch (error) {
        console.error("Mesaj gönderme hatası:", error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

/**
 * İKİ KULLUNICI ARASINDAKİ KONUŞMAYI GETİRME (READ)
 * GET /api/messages/conversation/:otherUserId
 */
exports.getConversation = async (req, res) => {
    try {
        // 1. Giriş yapmış kullanıcı (Token'dan)
        const loggedInUserId = req.user.kullanici_id;

        // 2. Konuşulmak istenen diğer kullanıcı (URL'den)
        const otherUserId = req.params.otherUserId;

        const db = getDb();
        if (!db) {
            return res.status(500).json({ message: 'Veritabanı bağlantısı mevcut değil.' });
        }

        const query = `
            SELECT * FROM Messages
            WHERE 
                (sender_id = $1 AND receiver_id = $2) OR 
                (sender_id = $2 AND receiver_id = $1)
            ORDER BY timestamp ASC
        `;

        const { rows } = await db.query(query, [loggedInUserId, otherUserId]);

        res.status(200).json(rows);

    } catch (error) {
        console.error("Konuşma alma hatası:", error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};