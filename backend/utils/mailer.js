const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // O cualquier otro proveedor, o usar SMTP host
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

// Enviar notificación cuando un capítulo sube una publicación para revisión
const enviarNotificacionPendiente = async (titulo, capitulo, extracto) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  [Correo Simulado] Se enviaría un correo de APROBACIÓN PENDIENTE.');
    console.log(`    Capítulo: ${capitulo}`);
    console.log(`    Título: ${titulo}`);
    return;
  }

  const mailOptions = {
    from: `"IEEE UNMSM Portal" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_DIRECTOR || process.env.EMAIL_USER, // Al director
    subject: `[Aprobación Pendiente] Nueva publicación de ${capitulo}`,
    html: `
      <h2>Hay una nueva publicación esperando tu revisión</h2>
      <p>El capítulo <strong>${capitulo}</strong> ha enviado un borrador y necesita aprobación para publicarse.</p>
      <h3>${titulo}</h3>
      <p><em>${extracto}</em></p>
      <hr>
      <p>Por favor, ingresa al <a href="http://localhost:3000/admin/dashboard.html">Panel de Administración</a> para revisar, aprobar o rechazar el contenido.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Notificación de pendiente enviada para: ${titulo}`);
  } catch (err) {
    console.error('Error enviando correo de notificación:', err);
  }
};

// Enviar notificación cuando la rama aprueba la publicación de un capítulo
const enviarNotificacionAprobado = async (titulo, correoAutor) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  [Correo Simulado] Se enviaría un correo de PUBLICACIÓN APROBADA.');
    console.log(`    Autor Correo: ${correoAutor}`);
    console.log(`    Título: ${titulo}`);
    return;
  }

  if (!correoAutor) return;

  const mailOptions = {
    from: `"IEEE UNMSM Portal" <${process.env.EMAIL_USER}>`,
    to: correoAutor,
    subject: `¡Tu publicación ha sido aprobada! 🎉`,
    html: `
      <h2>¡Felicidades!</h2>
      <p>Tu contenido titulado <strong>"${titulo}"</strong> ha sido revisado y <strong>aprobado</strong> por el Director de Rama.</p>
      <p>Ya se encuentra visible en la página web pública oficial de IEEE UNMSM.</p>
      <hr>
      <p>Puedes ir a la <a href="http://localhost:3000/">página principal</a> para verlo.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Notificación de aprobación enviada a: ${correoAutor}`);
  } catch (err) {
    console.error('Error enviando correo de aprobación:', err);
  }
};

module.exports = {
  enviarNotificacionPendiente,
  enviarNotificacionAprobado
};
