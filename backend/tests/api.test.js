const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-bloque-h';
process.env.DB_PATH = path.join(__dirname, 'test.sqlite');
fs.rmSync(process.env.DB_PATH, { force: true });

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../server');
const db = require('../config/db');

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function onRun(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const waitForSchema = () => new Promise((resolve) => setTimeout(resolve, 500));

async function seedUsers() {
  const password = await bcrypt.hash('123456', 10);
  await run(
    `INSERT INTO usuarios (nombre, email, password, rol, capitulo)
     VALUES (?, ?, ?, ?, ?)`,
    ['Director Rama', 'rama@test.local', password, 'director_rama', null]
  );
  await run(
    `INSERT INTO usuarios (nombre, email, password, rol, capitulo)
     VALUES (?, ?, ?, ?, ?)`,
    ['Directora WIE', 'wie@test.local', password, 'director_capitulo', 'wie']
  );
  await run(
    `INSERT INTO usuarios (nombre, email, password, rol, capitulo)
     VALUES (?, ?, ?, ?, ?)`,
    ['Director RAS', 'ras@test.local', password, 'director_capitulo', 'ras']
  );
}

async function login(email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: '123456' });

  expect(res.statusCode).toBe(200);
  return res.body.token;
}

beforeAll(async () => {
  await waitForSchema();
  await seedUsers();
});

afterAll((done) => {
  db.close(() => {
    fs.rmSync(process.env.DB_PATH, { force: true });
    done();
  });
});

describe('Health, estáticos y rutas sensibles', () => {
  test('GET /api/health responde OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'Server running' });
  });

  test('sirve páginas públicas con y sin extensión .html', async () => {
    const clean = await request(app).get('/noticias');
    const html = await request(app).get('/noticias.html');

    expect(clean.statusCode).toBe(200);
    expect(html.statusCode).toBe(200);
    expect(html.text).toContain('<title>');
  });

  test('bloquea paths sensibles', async () => {
    await expect(request(app).get('/.env')).resolves.toHaveProperty('statusCode', 404);
    await expect(request(app).get('/database.sqlite')).resolves.toHaveProperty('statusCode', 404);
    await expect(request(app).get('/backend/server.js')).resolves.toHaveProperty('statusCode', 404);
  });
});

describe('Autenticación y autorización', () => {
  test('rechaza login sin credenciales o con credenciales inválidas', async () => {
    const missing = await request(app).post('/api/auth/login').send({});
    const invalid = await request(app).post('/api/auth/login').send({ email: 'x@test.local', password: 'x' });

    expect(missing.statusCode).toBe(400);
    expect(invalid.statusCode).toBe(401);
  });

  test('emite token válido con rol y capítulo', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wie@test.local', password: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ rol: 'director_capitulo', capitulo: 'wie' });
  });

  test('protege rutas de administración sin token', async () => {
    const create = await request(app).post('/api/contenido').send({
      tipo: 'noticia',
      titulo: 'Sin token',
      descripcion: 'Debe fallar',
    });
    const pending = await request(app).get('/api/contenido/pendientes');

    expect(create.statusCode).toBe(401);
    expect(pending.statusCode).toBe(401);
  });
});

describe('Contenido editorial', () => {
  test('director_capitulo no puede falsificar req.body.capitulo', async () => {
    const token = await login('wie@test.local');
    const res = await request(app)
      .post('/api/contenido')
      .set('Authorization', `Bearer ${token}`)
      .field('tipo', 'noticia')
      .field('titulo', 'Noticia WIE segura')
      .field('descripcion', 'Contenido enviado por WIE')
      .field('capitulo', 'ras')
      .field('cuerpo', '<p>Hola</p><script>alert("xss")</script>');

    expect(res.statusCode).toBe(201);

    const row = await get('SELECT capitulo, estado, cuerpo FROM contenido WHERE id = ?', [res.body.id]);
    expect(row.capitulo).toBe('wie');
    expect(row.estado).toBe('pendiente_aprobacion');
    expect(row.cuerpo).toContain('<p>Hola</p>');
    expect(row.cuerpo).not.toContain('<script>');
  });

  test('director_rama publica directo y puede aprobar pendientes', async () => {
    const ramaToken = await login('rama@test.local');
    const wieToken = await login('wie@test.local');

    const direct = await request(app)
      .post('/api/contenido')
      .set('Authorization', `Bearer ${ramaToken}`)
      .field('tipo', 'proyecto')
      .field('titulo', 'Proyecto Rama')
      .field('descripcion', 'Publicado por rama')
      .field('capitulo', 'ras');

    expect(direct.statusCode).toBe(201);
    expect(await get('SELECT estado FROM contenido WHERE id = ?', [direct.body.id]))
      .toMatchObject({ estado: 'aprobado' });

    const pending = await request(app)
      .post('/api/contenido')
      .set('Authorization', `Bearer ${wieToken}`)
      .field('tipo', 'evento')
      .field('titulo', 'Evento pendiente')
      .field('descripcion', 'Pendiente para aprobar');

    const approve = await request(app)
      .post(`/api/contenido/${pending.body.id}/aprobar`)
      .set('Authorization', `Bearer ${ramaToken}`)
      .send({ comentario: 'OK' });

    expect(approve.statusCode).toBe(200);
    expect(await get('SELECT estado FROM contenido WHERE id = ?', [pending.body.id]))
      .toMatchObject({ estado: 'aprobado' });
  });

  test('un director de otro capítulo no puede editar contenido ajeno', async () => {
    const wieToken = await login('wie@test.local');
    const rasToken = await login('ras@test.local');

    const created = await request(app)
      .post('/api/contenido')
      .set('Authorization', `Bearer ${wieToken}`)
      .field('tipo', 'noticia')
      .field('titulo', 'Solo WIE')
      .field('descripcion', 'No editable por RAS');

    const edit = await request(app)
      .patch(`/api/contenido/${created.body.id}`)
      .set('Authorization', `Bearer ${rasToken}`)
      .send({ titulo: 'Intento RAS' });

    expect(edit.statusCode).toBe(403);
  });
});

describe('Archivos', () => {
  test('sube adjuntos válidos y rechaza tipos inválidos', async () => {
    const token = await login('rama@test.local');
    const created = await request(app)
      .post('/api/contenido')
      .set('Authorization', `Bearer ${token}`)
      .field('tipo', 'noticia')
      .field('titulo', 'Con adjuntos')
      .field('descripcion', 'Tiene archivos');

    const upload = await request(app)
      .post(`/api/contenido/${created.body.id}/archivos`)
      .set('Authorization', `Bearer ${token}`)
      .field('caption_0', 'Documento de prueba')
      .field('orden_0', '3')
      .attach('archivos', Buffer.from('%PDF-1.4 test'), {
        filename: 'documento.pdf',
        contentType: 'application/pdf',
      });

    expect(upload.statusCode).toBe(201);
    expect(upload.body.archivos).toHaveLength(1);
    expect(upload.body.archivos[0]).toMatchObject({ caption: 'Documento de prueba', orden: 3 });

    const archivoRow = await get('SELECT caption, orden FROM contenido_archivos WHERE contenido_id = ?', [created.body.id]);
    expect(archivoRow).toMatchObject({ caption: 'Documento de prueba', orden: 3 });

    const invalid = await request(app)
      .post(`/api/contenido/${created.body.id}/archivos`)
      .set('Authorization', `Bearer ${token}`)
      .attach('archivos', Buffer.from('bad'), {
        filename: 'malware.exe',
        contentType: 'application/x-msdownload',
      });

    expect(invalid.statusCode).toBe(400);
    expect(invalid.body.error).toMatch(/Solo se permiten/);
  });

  test('eliminar contenido borra la imagen destacada del disco', async () => {
    const token = await login('rama@test.local');
    const created = await request(app)
      .post('/api/contenido')
      .set('Authorization', `Bearer ${token}`)
      .field('tipo', 'noticia')
      .field('titulo', 'Con imagen destacada')
      .field('descripcion', 'Archivo debe borrarse')
      .attach('imagen', Buffer.from('fake png'), {
        filename: 'destacada.png',
        contentType: 'image/png',
      });

    expect(created.statusCode).toBe(201);

    const row = await get('SELECT imagen_path FROM contenido WHERE id = ?', [created.body.id]);
    const localPath = path.join(__dirname, '..', row.imagen_path.replace(/^\//, ''));
    expect(fs.existsSync(localPath)).toBe(true);

    const deleted = await request(app)
      .delete(`/api/contenido/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.statusCode).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(fs.existsSync(localPath)).toBe(false);
  });

  test('editar contenido puede reemplazar imagen destacada', async () => {
    const token = await login('rama@test.local');
    const created = await request(app)
      .post('/api/contenido')
      .set('Authorization', `Bearer ${token}`)
      .field('tipo', 'noticia')
      .field('titulo', 'Imagen reemplazable')
      .field('descripcion', 'Primera versión')
      .attach('imagen', Buffer.from('fake old png'), {
        filename: 'old.png',
        contentType: 'image/png',
      });

    expect(created.statusCode).toBe(201);

    const before = await get('SELECT imagen_path FROM contenido WHERE id = ?', [created.body.id]);
    const oldPath = path.join(__dirname, '..', before.imagen_path.replace(/^\//, ''));
    expect(fs.existsSync(oldPath)).toBe(true);

    const updated = await request(app)
      .patch(`/api/contenido/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('titulo', 'Imagen reemplazada')
      .field('descripcion', 'Segunda versión')
      .attach('imagen', Buffer.from('fake new png'), {
        filename: 'new.png',
        contentType: 'image/png',
      });

    expect(updated.statusCode).toBe(200);
    const after = await get('SELECT titulo, imagen_path FROM contenido WHERE id = ?', [created.body.id]);
    expect(after.titulo).toBe('Imagen reemplazada');
    expect(after.imagen_path).not.toBe(before.imagen_path);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(fs.existsSync(oldPath)).toBe(false);
  });
});
