const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Token'ı 'Bearer TOKEN_KODU' formatında header'dan al
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Erişim reddedildi. Token bulunamadı.' });
    }

    try {
        // Token'ı doğrula
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // Kullanıcı bilgilerini (token içindeki) req objesine ekle
        req.user = verified; // örn: { kullanici_id: 1, ... }
        
        // Her şey yolunda, isteğin devam etmesine izin ver
        next();
    } catch (err) {
        res.status(400).json({ message: 'Geçersiz Token.' });
    }
};

module.exports = authMiddleware;