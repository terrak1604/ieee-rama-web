const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Reutilizamos el transporter de mailer.js o lo creamos de nuevo para independizar
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

// POST /api/contacto
router.post('/', async (req, res) => {
  const { nombre, email, asunto, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, mensaje)' });
  }

  // Si no hay configuración de correo, simplemente devolvemos éxito (modo simulación)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  [Contacto Simulado] Recibido mensaje desde el formulario web:');
    console.log(`    De: ${nombre} <${email}>`);
    console.log(`    Asunto: ${asunto || 'Sin asunto'}`);
    console.log(`    Mensaje: ${mensaje}`);
    return res.status(200).json({ message: 'Mensaje enviado correctamente (Simulado).' });
  }

  const mailOptions = {
    from: `"${nombre} (Portal Web)" <${process.env.EMAIL_USER}>`, // Usar nuestra propia cuenta para evitar bloqueos DMARC
    replyTo: email, // Para poder responderle al usuario directamente
    to: process.env.EMAIL_DIRECTOR || process.env.EMAIL_USER, // Al correo oficial de la rama
    subject: `[Formulario Web] ${asunto || 'Nuevo Mensaje'}`,
    text: `Has recibido un nuevo mensaje desde la página web de IEEE UNMSM.\n\nNombre: ${nombre}\nCorreo: ${email}\n\nMensaje:\n${mensaje}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Mensaje de contacto enviado por: ${email}`);
    res.status(200).json({ message: 'Mensaje enviado correctamente.' });
  } catch (error) {
    console.error('Error enviando correo de contacto:', error);
    res.status(500).json({ error: 'Hubo un error interno al enviar el correo.' });
  }
});

module.exports = router;
