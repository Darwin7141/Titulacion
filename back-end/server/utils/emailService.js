const nodemailer = require('nodemailer');

// Configuración del transportador de Nodemailer
const transportador = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: 'd.morales1305@gmail.com',
    pass: 'yxaw fkvg bhmv kcke',
  },
  logger: true, // Habilita el registro detallado
  debug: true,  // Habilita la depuración
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

async function enviarCorreoEmpresa({ nombre, email, celular, serviciosSeleccionados }) {
  // Contenido del mensaje al equipo
  const cuerpoHtml = `
    <h3>Solicitud de contacto</h3>
    <p>Un usuario ha enviado sus datos para más información:</p>
    <ul>
      <li><strong>Nombre:</strong> ${nombre}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Celular:</strong> ${celular}</li>
      <li><strong>Servicios elegidos:</strong> ${serviciosSeleccionados.join(', ')}</li>
    </ul>
  `;

  const mailOptions = {
    from: 'TU_CORREO@gmail.com',
    to: 'd.morales1305@gmail.com', // <-- correo de la empresa
    subject: 'Nueva solicitud de contacto',
    html: cuerpoHtml,
  };

  try {
    await transportador.sendMail(mailOptions);
    console.log('Correo enviado al equipo de la empresa');
  } catch (error) {
    console.error('Error al enviar el correo a la empresa:', error);
    throw new Error('No se pudo enviar el correo a la empresa');
  }
}

async function enviarCorreoNotificacionReserva({ to, subject, html }) {
  const mailOptions = {
    from: 'd.morales1305@gmail.com', // Debe coincidir con auth.user
    to,        // p. ej. 'd.morales1305@gmail.com'
    subject,   // p. ej. '🔔 Nueva reserva: R005'
    html       // el cuerpo HTML que armamos en el controlador de reservas
  };

  try {
    const info = await transportador.sendMail(mailOptions);
    console.log('Correo de notificación de reserva enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error enviando correo de notificación de reserva:', error);
    throw error;
  }
}


module.exports = {
  enviarCorreoRecuperacion,
  enviarCorreoEmpresa,
  enviarCorreoNotificacionReserva
};