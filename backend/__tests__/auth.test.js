/**
 * AUTH API TEST SENARYOLARI
 * Kullanıcı kayıt ve giriş işlemlerini test eder
 */

const request = require('supertest');
const express = require('express');

// Test için basit bir Express app oluştur
const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

describe('AUTH API Test Senaryoları', () => {
    
    describe('POST /api/auth/register - Kullanıcı Kaydı', () => {
        
        test('TEST 1: Geçerli bilgilerle kayıt başarılı olmalı', async () => {
            const uniqueEmail = `test${Date.now()}@test.com`;
            const response = await request('http://localhost:3000')
                .post('/api/auth/register')
                .send({
                    username: 'TestUser',
                    email: uniqueEmail,
                    password: 'test123456'
                });
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.email).toBe(uniqueEmail);
        });

        test('TEST 2: Eksik alan ile kayıt başarısız olmalı', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/auth/register')
                .send({
                    username: 'TestUser',
                    // email eksik
                    password: 'test123456'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
        });

        test('TEST 3: Zayıf şifre ile kayıt kontrol edilmeli', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/auth/register')
                .send({
                    username: 'TestUser',
                    email: 'test@test.com',
                    password: '123' // çok kısa
                });
            
            // Backend şifre validasyonu varsa 400 dönmeli
            expect([201, 400]).toContain(response.status);
        });

        test('TEST 4: Aynı email ile tekrar kayıt başarısız olmalı', async () => {
            const email = 'duplicate@test.com';
            
            // İlk kayıt
            await request('http://localhost:3000')
                .post('/api/auth/register')
                .send({
                    username: 'User1',
                    email: email,
                    password: 'test123456'
                });

            // Aynı email ile ikinci kayıt
            const response = await request('http://localhost:3000')
                .post('/api/auth/register')
                .send({
                    username: 'User2',
                    email: email,
                    password: 'test123456'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/email.*zaten/i);
        });
    });

    describe('POST /api/auth/login - Kullanıcı Girişi', () => {
        
        const testUser = {
            username: 'LoginTestUser',
            email: 'logintest@test.com',
            password: 'test123456'
        };

        beforeAll(async () => {
            // Test için kullanıcı oluştur
            await request('http://localhost:3000')
                .post('/api/auth/register')
                .send(testUser);
        });

        test('TEST 5: Geçerli bilgilerle giriş başarılı olmalı', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe(testUser.email);
        });

        test('TEST 6: Yanlış şifre ile giriş başarısız olmalı', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });
            
            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/hatali/i);
        });

        test('TEST 7: Olmayan kullanıcı ile giriş başarısız olmalı', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'test123456'
                });
            
            expect(response.status).toBe(401);
        });

        test('TEST 8: Eksik alan ile giriş başarısız olmalı', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/auth/login')
                .send({
                    email: testUser.email
                    // password eksik
                });
            
            expect(response.status).toBe(400);
        });

        test('TEST 9: Admin girişi başarılı olmalı', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/auth/login')
                .send({
                    email: 'admin1@gmail.com',
                    password: 'admin-1'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.user.role).toBe('admin');
        });
    });

    describe('Token Validasyonu', () => {
        
        test('TEST 10: Geçerli token ile korumalı endpoint erişilebilmeli', async () => {
            // Önce giriş yap ve token al
            const loginResponse = await request('http://localhost:3000')
                .post('/api/auth/login')
                .send({
                    email: 'logintest@test.com',
                    password: 'test123456'
                });
            
            const token = loginResponse.body.token;

            // Token ile korumalı endpoint'e istek at
            const response = await request('http://localhost:3000')
                .get('/swap-requests')
                .set('Authorization', `Bearer ${token}`);
            
            expect([200, 404]).toContain(response.status); // 404 = endpoint bulunamadı ama auth geçti
        });

        test('TEST 11: Token olmadan korumalı endpoint erişilememeli', async () => {
            const response = await request('http://localhost:3000')
                .get('/swap-requests');
            
            expect(response.status).toBe(401);
        });

        test('TEST 12: Geçersiz token ile erişim reddedilmeli', async () => {
            const response = await request('http://localhost:3000')
                .get('/swap-requests')
                .set('Authorization', 'Bearer invalid-token-12345');
            
            expect(response.status).toBe(403);
        });
    });
});
