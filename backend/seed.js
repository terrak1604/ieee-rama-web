require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./config/db');

const testUsers = [
  {
    nombre: 'Juan Director',
    email: 'juan@ieee.edu.pe',
    password: '123456',
    rol: 'director_rama',
    capitulo: 'Rama General',
  },
  {
    nombre: 'María WIE',
    email: 'maria@ieee.edu.pe',
    password: '123456',
    rol: 'director_capitulo',
    capitulo: 'WIE',
  },
  {
    nombre: 'Carlos RAS',
    email: 'carlos@ieee.edu.pe',
    password: '123456',
    rol: 'director_capitulo',
    capitulo: 'RAS',
  },
  {
    nombre: 'Ana EMBS',
    email: 'ana@ieee.edu.pe',
    password: '123456',
    rol: 'director_capitulo',
    capitulo: 'EMBS',
  },
];

async function seedDatabase() {
  console.log('🌱 Seeding database with test users...');

  for (const user of testUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    db.run(
      `INSERT OR IGNORE INTO usuarios (nombre, email, password, rol, capitulo) 
       VALUES (?, ?, ?, ?, ?)`,
      [user.nombre, user.email, hashedPassword, user.rol, user.capitulo],
      (err) => {
        if (err) {
          console.error(`❌ Error inserting ${user.email}:`, err.message);
        } else {
          console.log(`✅ Inserted ${user.nombre} (${user.email})`);
        }
      }
    );
  }

  setTimeout(() => {
    console.log('✅ Seeding complete!');
    console.log('\n📝 Test credentials:');
    testUsers.forEach((user) => {
      console.log(`   ${user.email} / 123456 (${user.rol})`);
    });
    process.exit(0);
  }, 1000);
}

seedDatabase();
