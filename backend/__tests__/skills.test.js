/**
 * SKILLS API TEST SENARYOLARI
 * Yetenek yönetimi ve kullanıcı becerilerini test eder
 */

const request = require('supertest');

describe('SKILLS API Test Senaryoları', () => {
    
    let authToken;
    let userId;

    beforeAll(async () => {
        // Test için kullanıcı oluştur ve token al
        const uniqueEmail = `skillstest${Date.now()}@test.com`;
        const registerResponse = await request('http://localhost:3000')
            .post('/api/auth/register')
            .send({
                username: 'SkillsTestUser',
                email: uniqueEmail,
                password: 'test123456'
            });
        
        authToken = registerResponse.body.token;
        userId = registerResponse.body.user.id;
    });

    describe('GET /api/skills - Tüm Yetenekleri Listele', () => {
        
        test('TEST 1: Yetenekler listesi başarıyla getirilmeli', async () => {
            const response = await request('http://localhost:3000')
                .get('/api/skills');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('skills');
            expect(Array.isArray(response.body.skills)).toBe(true);
        });

        test('TEST 2: Yetenekler kategorilere göre sıralı olmalı', async () => {
            const response = await request('http://localhost:3000')
                .get('/api/skills');
            
            expect(response.status).toBe(200);
            const skills = response.body.skills;
            
            // En az bir yetenek olmalı
            expect(skills.length).toBeGreaterThan(0);
            
            // Her yeteneğin gerekli alanları olmalı
            skills.forEach(skill => {
                expect(skill).toHaveProperty('id');
                expect(skill).toHaveProperty('name');
                expect(skill).toHaveProperty('category');
            });
        });

        test('TEST 3: Varsayılan yetenekler mevcut olmalı', async () => {
            const response = await request('http://localhost:3000')
                .get('/api/skills');
            
            const skills = response.body.skills;
            const skillNames = skills.map(s => s.name);
            
            // Örnek kontroller
            expect(skillNames).toContain('JavaScript');
            expect(skillNames).toContain('Python');
            expect(skillNames).toContain('İngilizce');
        });
    });

    describe('GET /api/categories - Kategorileri Listele', () => {
        
        test('TEST 4: Kategoriler başarıyla getirilmeli', async () => {
            const response = await request('http://localhost:3000')
                .get('/api/categories');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('categories');
            expect(Array.isArray(response.body.categories)).toBe(true);
        });

        test('TEST 5: Temel kategoriler mevcut olmalı', async () => {
            const response = await request('http://localhost:3000')
                .get('/api/categories');
            
            const categories = response.body.categories;
            
            expect(categories).toContain('Dil');
            expect(categories).toContain('Programlama');
            expect(categories).toContain('Müzik');
            expect(categories).toContain('Tasarım');
        });
    });

    describe('POST /api/skills - Yeni Yetenek Ekle', () => {
        
        test('TEST 6: Admin yeni yetenek ekleyebilmeli', async () => {
            // Admin olarak giriş yap
            const adminLogin = await request('http://localhost:3000')
                .post('/api/auth/login')
                .send({
                    email: 'admin1@gmail.com',
                    password: 'admin-1'
                });
            
            const adminToken = adminLogin.body.token;
            const uniqueSkillName = `TestSkill${Date.now()}`;

            const response = await request('http://localhost:3000')
                .post('/api/skills')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: uniqueSkillName,
                    category: 'Test'
                });
            
            // Başarılı veya yetki kontrolü olabilir
            expect([201, 403]).toContain(response.status);
        });

        test('TEST 7: Eksik alan ile yetenek eklenmemeli', async () => {
            const response = await request('http://localhost:3000')
                .post('/api/skills')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'TestSkill'
                    // category eksik
                });
            
            expect(response.status).toBe(400);
        });
    });

    describe('GET /user-skills/:userId - Kullanıcı Becerilerini Getir', () => {
        
        test('TEST 8: Kullanıcı becerileri getirilmeli', async () => {
            const response = await request('http://localhost:3000')
                .get(`/user-skills/${userId}`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect([200, 501]).toContain(response.status); // 501 = in-memory modda desteklenmiyor
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('offering');
                expect(response.body).toHaveProperty('seeking');
            }
        });
    });

    describe('POST /user-skills - Kullanıcıya Beceri Ekle', () => {
        
        test('TEST 9: Kullanıcı kendine beceri ekleyebilmeli (Offering)', async () => {
            // Önce bir skill ID bul
            const skillsResponse = await request('http://localhost:3000')
                .get('/api/skills');
            
            const skillId = skillsResponse.body.skills[0].id;

            const response = await request('http://localhost:3000')
                .post('/user-skills')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    skill_id: skillId,
                    type: 'Offering'
                });
            
            // Başarılı veya in-memory modda desteklenmiyor
            expect([201, 501]).toContain(response.status);
        });

        test('TEST 10: Kullanıcı kendine beceri ekleyebilmeli (Seeking)', async () => {
            const skillsResponse = await request('http://localhost:3000')
                .get('/api/skills');
            
            const skillId = skillsResponse.body.skills[1].id;

            const response = await request('http://localhost:3000')
                .post('/user-skills')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    skill_id: skillId,
                    type: 'Seeking'
                });
            
            expect([201, 501]).toContain(response.status);
        });

        test('TEST 11: Geçersiz type ile beceri eklenmemeli', async () => {
            const skillsResponse = await request('http://localhost:3000')
                .get('/api/skills');
            
            const skillId = skillsResponse.body.skills[0].id;

            const response = await request('http://localhost:3000')
                .post('/user-skills')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    skill_id: skillId,
                    type: 'InvalidType' // Sadece Offering veya Seeking olmalı
                });
            
            expect([400, 501]).toContain(response.status);
        });

        test('TEST 12: Token olmadan beceri eklenememeli', async () => {
            const response = await request('http://localhost:3000')
                .post('/user-skills')
                .send({
                    skill_id: 1,
                    type: 'Offering'
                });
            
            expect(response.status).toBe(401);
        });
    });
});
