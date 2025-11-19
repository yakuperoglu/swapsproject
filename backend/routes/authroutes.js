const express = require('express');
const router = express.Router();

// Oluşturduğumuz controller'ı çağır
const authController = require('../controllers/authController');

// /register URL'i gelirse, authController.register fonksiyonunu çalıştır
router.post('/register', authController.register);

// /login URL'i gelirse, authController.login fonksiyonunu çalıştır
router.post('/login', authController.login);

module.exports = router;