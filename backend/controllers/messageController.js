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
        // 1. Gönderen kişi (Token'dan) - id veya kullanici_id olabilir
        const sender_id = req.user.id || req.user.kullanici_id;

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

        // Sadece kabul edilen eşleşmeler arasında mesajlaşma kontrolü
        const swapCheck = await db.query(`
            SELECT id FROM Swap_Requests 
            WHERE status = 'Accepted' 
            AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
        `, [sender_id, receiver_id]);

        if (swapCheck.rows.length === 0) {
            return res.status(403).json({ 
                message: 'Bu kullanıcıyla mesajlaşabilmek için önce eşleşme isteğinin kabul edilmesi gerekir.' 
            });
        }

        const query = `
            INSERT INTO Messages (sender_id, receiver_id, content) 
            VALUES ($1, $2, $3) 
            RETURNING *
        `;

        const { rows } = await db.query(query, [sender_id, receiver_id, content]);

        res.status(201).json({
            success: true,
            message: rows[0]
        });

    } catch (error) {
        console.error("Mesaj gönderme hatası:", error);
        res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
};

/**
 * İKİ KULLUNICI ARASINDAKİ KONUŞMAYI GETİRME (READ)
 * GET /api/messages/conversation/:otherUserId
 */
exports.getConversation = async (req, res) => {
    try {
        // 1. Giriş yapmış kullanıcı (Token'dan) - id veya kullanici_id olabilir
        const loggedInUserId = req.user.id || req.user.kullanici_id;

        // 2. Konuşulmak istenen diğer kullanıcı (URL'den)
        const otherUserId = req.params.otherUserId;

        const db = getDb();
        if (!db) {
            return res.status(500).json({ message: 'Veritabanı bağlantısı mevcut değil.' });
        }

        // Sadece kabul edilen eşleşmeler arasında mesajlaşma kontrolü
        const swapCheck = await db.query(`
            SELECT id FROM Swap_Requests 
            WHERE status = 'Accepted' 
            AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
        `, [loggedInUserId, otherUserId]);

        if (swapCheck.rows.length === 0) {
            return res.status(403).json({ 
                message: 'Bu kullanıcıyla mesajlaşabilmek için önce eşleşme isteğinin kabul edilmesi gerekir.' 
            });
        }

        const query = `
            SELECT 
                m.message_id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.timestamp,
                sender.kullanici_adi as sender_name,
                receiver.kullanici_adi as receiver_name
            FROM Messages m
            JOIN Kullanicilar sender ON m.sender_id = sender.id
            JOIN Kullanicilar receiver ON m.receiver_id = receiver.id
            WHERE 
                (m.sender_id = $1 AND m.receiver_id = $2) OR 
                (m.sender_id = $2 AND m.receiver_id = $1)
            ORDER BY m.timestamp ASC
        `;

        const { rows } = await db.query(query, [loggedInUserId, otherUserId]);

        res.status(200).json({
            success: true,
            messages: rows
        });

    } catch (error) {
        console.error("Konuşma alma hatası:", error);
        res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
};

// Tüm konuşmaları listele (kullanıcının tüm eşleşmeleriyle olan konuşmalar)
exports.getConversations = async (req, res) => {
    try {
        const loggedInUserId = req.user.id || req.user.kullanici_id;

        const db = getDb();
        if (!db) {
            return res.status(500).json({ message: 'Veritabanı bağlantısı mevcut değil.' });
        }

        // Kullanıcının kabul edilen eşleşmelerini getir
        const acceptedSwaps = await db.query(`
            SELECT 
                CASE 
                    WHEN sender_id = $1 THEN receiver_id
                    ELSE sender_id
                END as other_user_id,
                CASE 
                    WHEN sender_id = $1 THEN receiver.kullanici_adi
                    ELSE sender.kullanici_adi
                END as other_user_name,
                CASE 
                    WHEN sender_id = $1 THEN receiver.email
                    ELSE sender.email
                END as other_user_email,
                guncelleme_tarihi
            FROM Swap_Requests sr
            JOIN Kullanicilar sender ON sr.sender_id = sender.id
            JOIN Kullanicilar receiver ON sr.receiver_id = receiver.id
            WHERE (sr.sender_id = $1 OR sr.receiver_id = $1) AND sr.status = 'Accepted'
            ORDER BY guncelleme_tarihi DESC
        `, [loggedInUserId]);

        // Her eşleşme için son mesajı getir
        const conversations = await Promise.all(
            acceptedSwaps.rows.map(async (swap) => {
                const lastMessage = await db.query(`
                    SELECT 
                        m.message_id,
                        m.sender_id,
                        m.receiver_id,
                        m.content,
                        m.timestamp
                    FROM Messages m
                    WHERE 
                        (m.sender_id = $1 AND m.receiver_id = $2) OR 
                        (m.sender_id = $2 AND m.receiver_id = $1)
                    ORDER BY m.timestamp DESC
                    LIMIT 1
                `, [loggedInUserId, swap.other_user_id]);

                return {
                    ...swap,
                    last_message: lastMessage.rows[0] || null,
                    unread_count: 0 // İleride eklenebilir
                };
            })
        );

        res.status(200).json({
            success: true,
            conversations: conversations
        });

    } catch (error) {
        console.error("Konuşmalar alma hatası:", error);
        res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
};