const request = require('supertest');
const app = require('../server');

// Cierra la DB al finalizar para evitar handles abiertos
afterAll(() => {
  const db = require('../config/db');
  if (db && db.close) db.close();
});

describe('Health & rutas básicas', () => {
  it('GET /api/health → 200 { status: "Server running" }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'Server running');
  });

  it('GET /api/ruta-inexistente → 404', async () => {
    const res = await request(app).get('/api/esta-ruta-no-existe');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Route not found');
  });
});

describe('Contenido público', () => {
  it('GET /api/contenido → 200 array', async () => {
    const res = await request(app).get('/api/contenido');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/capitulos → 200 array', async () => {
    const res = await request(app).get('/api/capitulos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Autenticación', () => {
  it('POST /api/auth/login sin credenciales → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/login con credenciales incorrectas → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Rutas protegidas sin token → 401', () => {
  it('POST /api/contenido sin token → 401', async () => {
    const res = await request(app)
      .post('/api/contenido')
      .send({ tipo: 'noticia', titulo: 'Test', descripcion: 'Test' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/contenido/pendientes sin token → 401', async () => {
    const res = await request(app).get('/api/contenido/pendientes');
    expect(res.statusCode).toBe(401);
  });
});

describe('Bloqueo de paths sensibles', () => {
  it('GET /.env → 404', async () => {
    const res = await request(app).get('/.env');
    expect(res.statusCode).toBe(404);
  });

  it('GET /database.sqlite → 404', async () => {
    const res = await request(app).get('/database.sqlite');
    expect(res.statusCode).toBe(404);
  });

  it('GET /backend/server.js → 404', async () => {
    const res = await request(app).get('/backend/server.js');
    expect(res.statusCode).toBe(404);
  });
});
