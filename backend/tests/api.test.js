const request = require('supertest');
const app = require('../src/app');

describe('Finance Dashboard API', () => {
  // ── Tokens for each role ────────────────────────────────────────────────
  let adminToken;
  let analystToken;
  let viewerToken;
  let createdRecordId; // used to test update / delete

  beforeAll(async () => {
    // Login as admin
    const adminRes = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminRes.body.token;

    // Login as analyst
    const analystRes = await request(app)
      .post('/api/users/login')
      .send({ email: 'analyst@example.com', password: 'password123' });
    analystToken = analystRes.body.token;

    // Login as viewer
    const viewerRes = await request(app)
      .post('/api/users/login')
      .send({ email: 'viewer@example.com', password: 'password123' });
    viewerToken = viewerRes.body.token;

    // Create a record as admin to use for update/delete tests
    const rec = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100, type: 'income', category: 'Salary', date: '2026-01-01', note: 'Test record' });
    createdRecordId = rec.body.id;
  });

  // ── Health Check ─────────────────────────────────────────────────────────
  describe('Health Check', () => {
    it('should return 200 UP', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });

  // ── Auth Middleware ───────────────────────────────────────────────────────
  describe('Auth Middleware', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/records');
      expect(res.statusCode).toBe(401);
    });

    it('should return 403 with invalid token', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', 'Bearer bad_token');
      expect(res.statusCode).toBe(403);
    });
  });

  // ── Dashboard RBAC ────────────────────────────────────────────────────────
  describe('Dashboard RBAC', () => {
    it('ADMIN   → GET /dashboard/summary → 200', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalIncome');
      expect(res.body).toHaveProperty('totalExpense');
      expect(res.body).toHaveProperty('netBalance');
      expect(res.body).toHaveProperty('monthlyTrends');
    });

    it('ANALYST → GET /dashboard/summary → 200', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.statusCode).toBe(200);
    });

    it('VIEWER  → GET /dashboard/summary → 200', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.statusCode).toBe(200);
    });
  });

  // ── Records GET RBAC ──────────────────────────────────────────────────────
  describe('Records GET RBAC', () => {
    it('ADMIN   → GET /records → 200 with pagination', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('records');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.page).toBe(1);
    });

    it('ANALYST → GET /records → 200', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.statusCode).toBe(200);
    });

    it('VIEWER  → GET /records → 403 (not allowed)', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  // ── Records CREATE RBAC ───────────────────────────────────────────────────
  describe('Records CREATE RBAC', () => {
    const newRecord = { amount: 500, type: 'income', category: 'Freelance', date: '2026-02-01', note: 'Test' };

    it('ADMIN   → POST /records → 201', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRecord);
      expect(res.statusCode).toBe(201);
    });

    it('ANALYST → POST /records → 201', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send(newRecord);
      expect(res.statusCode).toBe(201);
    });

    it('VIEWER  → POST /records → 403 (cannot create)', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(newRecord);
      expect(res.statusCode).toBe(403);
    });
  });

  // ── Records UPDATE RBAC ───────────────────────────────────────────────────
  describe('Records UPDATE RBAC', () => {
    it('ADMIN   → PUT /records/:id → 200', async () => {
      const res = await request(app)
        .put(`/api/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Updated by admin' });
      expect(res.statusCode).toBe(200);
    });

    it('ANALYST → PUT /records/:id → 403 (cannot edit)', async () => {
      const res = await request(app)
        .put(`/api/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ note: 'Analyst trying to edit' });
      expect(res.statusCode).toBe(403);
    });

    it('VIEWER  → PUT /records/:id → 403 (cannot edit)', async () => {
      const res = await request(app)
        .put(`/api/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ note: 'Viewer trying to edit' });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── Records DELETE RBAC ───────────────────────────────────────────────────
  describe('Records DELETE RBAC', () => {
    it('ANALYST → DELETE /records/:id → 403 (cannot delete)', async () => {
      const res = await request(app)
        .delete(`/api/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('VIEWER  → DELETE /records/:id → 403 (cannot delete)', async () => {
      const res = await request(app)
        .delete(`/api/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('ADMIN   → DELETE /records/:id → 204 (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(204);
    });

    it('Soft delete: record no longer appears in GET /records', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);
      const found = res.body.records.find(r => r.id === createdRecordId);
      expect(found).toBeUndefined();
    });
  });

  // ── User Management RBAC ─────────────────────────────────────────────────
  describe('User Management RBAC', () => {
    it('ADMIN   → GET /users → 200', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
    });

    it('ANALYST → GET /users → 403 (cannot manage users)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('VIEWER  → GET /users → 403 (cannot manage users)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('ANALYST → POST /users → 403 (cannot create users)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ name: 'New User', email: 'new@example.com', password: 'password123', role: 'viewer' });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── Records Search & Pagination ───────────────────────────────────────────
  describe('Records Search & Pagination', () => {
    it('should support search by keyword', async () => {
      const res = await request(app)
        .get('/api/records?search=Salary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.records.every(r =>
        r.category?.toLowerCase().includes('salary') ||
        r.note?.toLowerCase().includes('salary')
      )).toBe(true);
    });

    it('should support pagination with custom page and limit', async () => {
      const res = await request(app)
        .get('/api/records?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.records.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('should filter by type=income', async () => {
      const res = await request(app)
        .get('/api/records?type=income')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.records.every(r => r.type === 'income')).toBe(true);
    });
  });
});

