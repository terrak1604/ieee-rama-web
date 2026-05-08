const fs = require('fs');
const path = require('path');
const slugify = require('slugify');
const db = require('../config/db');

const capitulosPath = path.join(__dirname, '..', '..', 'data', 'capitulos.json');

function makeSlug(value) {
  return slugify(value || '', { lower: true, strict: true, trim: true });
}

function mapCapitulo(item) {
  const slug = makeSlug(item.id || item.siglas || item.nombre);
  return {
    slug,
    nombre: item.nombre,
    siglas: item.siglas || slug.toUpperCase(),
    descripcion_corta: item.descripcion,
    descripcion_larga:
      item.descripcion_larga ||
      `${item.descripcion} En la Rama Estudiantil IEEE UNMSM impulsa actividades academicas, proyectos aplicados y espacios de comunidad para estudiantes.`,
    logo_path: null,
    imagen_portada_path: item.imagen || null,
    color: item.color || '#00629B',
    email_contacto: null,
    link_externo: item.link && !item.link.startsWith('#') ? item.link : null,
    redes_json: JSON.stringify({}),
    director_id: null,
    mision: `Promover el aprendizaje, liderazgo y desarrollo profesional en ${item.siglas || item.nombre}.`,
    vision: `Ser un referente estudiantil en ${item.siglas || item.nombre} dentro de la comunidad IEEE UNMSM.`,
    fecha_fundacion: null,
    activo: 1,
  };
}

function representativeSeeds() {
  return [
    {
      slug: 'rama-ieee-unmsm',
      nombre: 'Rama Estudiantil IEEE UNMSM',
      siglas: 'IEEE UNMSM',
      descripcion_corta: 'Comunidad estudiantil orientada a tecnologia, investigacion, liderazgo y servicio profesional.',
      descripcion_larga:
        'La Rama Estudiantil IEEE UNMSM conecta estudiantes con oportunidades academicas, proyectos tecnicos, voluntariado y liderazgo profesional dentro de la comunidad IEEE.',
      logo_path: null,
      imagen_portada_path: 'images/ieee-unmsm.jpg',
      color: '#00629B',
      email_contacto: 'ieee@unmsm.edu.pe',
      link_externo: null,
      redes_json: JSON.stringify({ facebook: '', instagram: '', linkedin: '' }),
      director_id: null,
      mision: 'Formar lideres estudiantiles capaces de generar impacto mediante ingenieria, investigacion y trabajo colaborativo.',
      vision: 'Ser una comunidad referente en innovacion tecnologica y desarrollo profesional estudiantil en San Marcos.',
      fecha_fundacion: null,
      activo: 1,
    },
    {
      slug: 'proyectos',
      nombre: 'Proyectos IEEE UNMSM',
      siglas: 'Proyectos',
      descripcion_corta: 'Espacio editorial y tecnico para iniciativas, prototipos, concursos y desarrollos de la Rama.',
      descripcion_larga:
        'Proyectos IEEE UNMSM reune iniciativas interdisciplinarias, documenta avances tecnicos y visibiliza el trabajo aplicado de estudiantes y capitulos.',
      logo_path: null,
      imagen_portada_path: 'images/proyectos.jpg',
      color: '#00AEEF',
      email_contacto: null,
      link_externo: null,
      redes_json: JSON.stringify({}),
      director_id: null,
      mision: 'Impulsar proyectos tecnicos sostenibles con aprendizaje aplicado y colaboracion entre capitulos.',
      vision: 'Convertirse en una vitrina de innovacion estudiantil para la comunidad universitaria y profesional.',
      fecha_fundacion: null,
      activo: 1,
    },
  ];
}

function upsertCapitulo(capitulo) {
  return new Promise((resolve, reject) => {
    db.run(
      `
        INSERT INTO capitulo_detalle (
          slug, nombre, siglas, descripcion_corta, descripcion_larga, logo_path,
          imagen_portada_path, color, email_contacto, link_externo, redes_json,
          director_id, mision, vision, fecha_fundacion, activo, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(slug) DO UPDATE SET
          nombre = excluded.nombre,
          siglas = excluded.siglas,
          descripcion_corta = excluded.descripcion_corta,
          descripcion_larga = excluded.descripcion_larga,
          logo_path = COALESCE(capitulo_detalle.logo_path, excluded.logo_path),
          imagen_portada_path = COALESCE(capitulo_detalle.imagen_portada_path, excluded.imagen_portada_path),
          color = excluded.color,
          email_contacto = COALESCE(capitulo_detalle.email_contacto, excluded.email_contacto),
          link_externo = excluded.link_externo,
          redes_json = excluded.redes_json,
          mision = excluded.mision,
          vision = excluded.vision,
          fecha_fundacion = COALESCE(capitulo_detalle.fecha_fundacion, excluded.fecha_fundacion),
          activo = excluded.activo,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        capitulo.slug,
        capitulo.nombre,
        capitulo.siglas,
        capitulo.descripcion_corta,
        capitulo.descripcion_larga,
        capitulo.logo_path,
        capitulo.imagen_portada_path,
        capitulo.color,
        capitulo.email_contacto,
        capitulo.link_externo,
        capitulo.redes_json,
        capitulo.director_id,
        capitulo.mision,
        capitulo.vision,
        capitulo.fecha_fundacion,
        capitulo.activo,
      ],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(capitulosPath, 'utf8'));
  const capitulos = [...raw.map(mapCapitulo), ...representativeSeeds()];

  for (const capitulo of capitulos) {
    await upsertCapitulo(capitulo);
  }

  console.log(`Seeded ${capitulos.length} capitulos into capitulo_detalle`);
  db.close();
}

setTimeout(() => {
  main().catch((err) => {
    console.error(err);
    db.close();
    process.exit(1);
  });
}, 250);
