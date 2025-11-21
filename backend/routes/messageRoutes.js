const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth'); // Güvenlik katmanı

// DİKKAT: Bu satır, aşağıdaki TÜM mesaj rotalarının
// korunmasını (giriş yapılmasını) zorunlu kılar.
router.use(authMiddleware);

// POST /api/messages -> Yeni mesaj gönder
router.post('/', messageController.sendMessage);

// GET /api/messages/conversations -> Tüm konuşmaları listele
router.get('/conversations', messageController.getConversations);

// GET /api/messages/conversation/:otherUserId -> İki kişi arasındaki konuşmayı getir
router.get('/conversation/:otherUserId', messageController.getConversation);

module.exports = router;