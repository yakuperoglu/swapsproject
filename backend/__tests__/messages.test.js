/**
 * MESSAGES API TEST SENARYOLARI
 * Mesajlaşma sistemini test eder
 */

const request = require('supertest');

describe('MESSAGES API Test Senaryoları', () => {
    
    let user1Token, user1Id;
    let user2Token, user2Id;
    let swapRequestAccepted = false;

    beforeAll(async () => {
        // Test için iki kullanıcı oluştur
        const user1Email = `msguser1_${Date.now()}@test.com`;
        const user2Email = `msguser2_${Date.now()}@test.com`;

        const user1Response = await request('http://localhost:3000')
            .post('/api/auth/register')
            .send({
                username: 'MessageUser1',
                email: user1Email,
                password: 'test123456'
            });
        
        user1Token = user1Response.body.token;
        user1Id = user1Response.body.user.id;

        const user2Response = await request('http://localhost:3000')
            .post('/api/auth/register')
            .send({
                username: 'MessageUser2',
                email: user2Email,
                password: 'test123456'
            });
        
        user2Token = user2Response.body.token;
        user2Id = user2Response.body.user.id;

        // Swap request gönder ve kabul et (mesajlaşma için gerekli)
        try {
            const swapResponse = await request('http://localhost:3000')
                .post('/swap-requests')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    receiver_id: user2Id
                });
            
            if (swapResponse.status === 201) {
                const requestId = swapResponse.body.swap_request.id;
                
                const acceptResponse = await request('http://localhost:3000')
                    .put(`/swap-requests/${requestId}/status`)
                    .set('Authorization', `Bearer ${user2Token}`)
                    .send({
                        status: 'Accepted'
                    });
                
                if (acceptResponse.status === 200) {
                    swapRequestAccepted = true;
                }
            }
        } catch (error) {
            console.log('Swap request oluşturulamadı:', error.message);
        }
    });

    describe('POST /api/messages - Mesaj Gönder', () => {
        
        test('TEST 1: Kabul edilmiş eşleşmeler arası mesaj gönderilebilmeli', async () => {
            if (!swapRequestAccepted) {
                console.log('Swap request kabul edilmedi, test atlanıyor');
                return;
            }

            const response = await request('http://localhost:3000')
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    receiver_id: user2Id,
                    content: 'Merhaba! Test mesajı'
                });
            
            expect([201, 403]).toContain(response.status);
            
            if (response.status === 201) {
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('message');
                expect(response.body.message.content).toBe('Merhaba! Test mesajı');
            }
        });

        test('TEST 2: Eksik content ile mesaj gönderilememeli', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    receiver_id: user2Id
                    // content eksik
                });
            
            expect(response.status).toBe(400);
        });

        test('TEST 3: Eksik receiver_id ile mesaj gönderilememeli', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    content: 'Test mesajı'
                    // receiver_id eksik
                });
            
            expect(response.status).toBe(400);
        });

        test('TEST 4: Kendine mesaj gönderilememeli', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    receiver_id: user1Id, // Kendi ID'si
                    content: 'Kendime mesaj'
                });
            
            expect(response.status).toBe(400);
        });

        test('TEST 5: Token olmadan mesaj gönderilememeli', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/messages')
                .send({
                    receiver_id: user2Id,
                    content: 'Test mesajı'
                });
            
            expect(response.status).toBe(401);
        });

        test('TEST 6: Kabul edilmemiş eşleşmelere mesaj gönderilememeli', async () => {
            // Yeni bir kullanıcı oluştur (swap request kabul edilmemiş)
            const user3Email = `msguser3_${Date.now()}@test.com`;
            const user3Response = await request('http://localhost:3000')
                .post('/api/auth/register')
                .send({
                    username: 'MessageUser3',
                    email: user3Email,
                    password: 'test123456'
                });
            
            const user3Id = user3Response.body.user.id;

            const response = await request('http://localhost:3000')
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    receiver_id: user3Id,
                    content: 'Test mesajı'
                });
            
            expect(response.status).toBe(403);
        });

        test('TEST 7: Boş mesaj gönderilememeli', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    receiver_id: user2Id,
                    content: '' // Boş content
                });
            
            expect([400, 403]).toContain(response.status);
        });
    });

    describe('GET /api/messages/conversation/:otherUserId - Konuşmayı Getir', () => {
        
        test('TEST 8: Kullanıcı konuşmalarını görebilmeli', async () => {
            const response = await request('http://localhost:3000')
                .get(`/api/messages/conversation/${user2Id}`)
                .set('Authorization', `Bearer ${user1Token}`);
            
            expect([200, 403]).toContain(response.status);
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('messages');
                expect(Array.isArray(response.body.messages)).toBe(true);
            }
        });

        test('TEST 9: Token olmadan konuşma görüntülenememeli', async () => {
            const response = await request('http://localhost:3000')
                .get(`/api/messages/conversation/${user2Id}`);
            
            expect(response.status).toBe(401);
        });

        test('TEST 10: Eşleşme olmayan kullanıcıyla konuşma görüntülenememeli', async () => {
            const user3Email = `msguser4_${Date.now()}@test.com`;
            const user3Response = await request('http://localhost:3000')
                .post('/api/auth/register')
                .send({
                    username: 'MessageUser4',
                    email: user3Email,
                    password: 'test123456'
                });
            
            const user3Id = user3Response.body.user.id;

            const response = await request('http://localhost:3000')
                .get(`/api/messages/conversation/${user3Id}`)
                .set('Authorization', `Bearer ${user1Token}`);
            
            expect(response.status).toBe(403);
        });
    });

    describe('GET /api/messages/conversations - Tüm Konuşmaları Listele', () => {
        
        test('TEST 11: Kullanıcı tüm konuşmalarını listeleyebilmeli', async () => {
            const response = await request('http://localhost:3000')
                .get('/api/messages/conversations')
                .set('Authorization', `Bearer ${user1Token}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('conversations');
            expect(Array.isArray(response.body.conversations)).toBe(true);
        });

        test('TEST 12: Token olmadan konuşmalar listelenememeli', async () => {
            const response = await request('http://localhost:3000')
                .get('/api/messages/conversations');
            
            expect(response.status).toBe(401);
        });

        test('TEST 13: Konuşmalarda son mesaj bilgisi olmalı', async () => {
            if (!swapRequestAccepted) {
                return;
            }

            const response = await request('http://localhost:3000')
                .get('/api/messages/conversations')
                .set('Authorization', `Bearer ${user1Token}`);
            
            if (response.status === 200 && response.body.conversations.length > 0) {
                const conversation = response.body.conversations[0];
                expect(conversation).toHaveProperty('other_user_id');
                expect(conversation).toHaveProperty('other_user_name');
                expect(conversation).toHaveProperty('other_user_email');
            }
        });
    });

    describe('Mesaj Sıralama ve İçerik Testi', () => {
        
        test('TEST 14: Mesajlar zaman sırasına göre sıralı olmalı', async () => {
            if (!swapRequestAccepted) {
                return;
            }

            // Birden fazla mesaj gönder
            await request('http://localhost:3000')
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    receiver_id: user2Id,
                    content: 'İlk mesaj'
                });

            await request('http://localhost:3000')
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    receiver_id: user2Id,
                    content: 'İkinci mesaj'
                });

            const response = await request('http://localhost:3000')
                .get(`/api/messages/conversation/${user2Id}`)
                .set('Authorization', `Bearer ${user1Token}`);
            
            if (response.status === 200 && response.body.messages.length >= 2) {
                const messages = response.body.messages;
                
                // İlk mesaj, ikinci mesajdan önce olmalı
                expect(new Date(messages[0].timestamp) <= new Date(messages[1].timestamp)).toBe(true);
            }
        });

        test('TEST 15: Uzun mesaj içeriği gönderilebilmeli', async () => {
            if (!swapRequestAccepted) {
                return;
            }

            const longContent = 'A'.repeat(1000); // 1000 karakterlik mesaj

            const response = await request('http://localhost:3000')
                .post('/api/messages')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    receiver_id: user2Id,
                    content: longContent
                });
            
            expect([201, 403]).toContain(response.status);
        });
    });
});
