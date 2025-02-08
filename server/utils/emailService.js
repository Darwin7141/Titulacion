const nodemailer = require('nodemailer');

// Configuración del transportador de Nodemailer
const transportador = nodemailer.createTransport({
  service: 'Gmail', // Cambiar según el proveedor de correo (Gmail, Outlook, etc.)
  auth: {
    user: 'd.morales1305@gmail.com', // Reemplazar con tu correo
    pass: 'yxaw fkvg bhmv kcke',       // Reemplazar con tu contraseña o contraseña de aplicación
  },
  logger: true, // Activa los logs
  debug: true,  // Activa los mensajes de depuración
});

// Función para enviar correos de recuperación
async function enviarCorreoRecuperacion(correo, token) {
  const enlaceRecuperacion = `http://localhost:4200/restablecer-contrasena/${token}`; // URL del front-end

  const opcionesCorreo = {
    from: 'd.morales1305@gmail.com',
    to: correo,
    subject: 'Recuperación de contraseña',
    html: `<p>Recibimos una solicitud para restablecer tu contraseña.</p>
           <p>Haz clic en el enlace siguiente para restablecerla:</p>
           <a href="${enlaceRecuperacion}">${enlaceRecuperacion}</a>
           <p>Este enlace será válido por 30 minutos.</p>`,
  };

  try {
    await transportador.sendMail(opcionesCorreo);
    console.log('Correo enviado exitosamente');
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error('No se pudo enviar el correo');
  }
}

module.exports = { enviarCorreoRecuperacion };
