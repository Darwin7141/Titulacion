

const { enviarCorreoEmpresa } = require('../utils/emailService');
const twilio = require('twilio');



function enviarContacto(req, res) {
  try {
    const { nombre, email, celular, serviciosSeleccionados } = req.body;

    // 1) Responder de inmediato, sin bloquear al front
    res.status(202).json({
      message: 'Solicitud recibida. Procesando en segundo plano...'
    });

    // 2) Procesar en background con 'setImmediate'
    setImmediate(async () => {
      try {
        // Prepara el texto para WhatsApp
        const serviciosStr = serviciosSeleccionados.length
          ? serviciosSeleccionados.join(', ')
          : 'Ninguno';

        const mensajeWhatsapp = `
          NUEVA SOLICITUD DE CONTACTO
          - Nombre: ${nombre}
          - Email: ${email}
          - Celular (del cliente): ${celular}
          - Servicios elegidos: ${serviciosStr}
        `;

        // Enviar correo y WhatsApp EN PARALELO
        const envioCorreo = enviarCorreoEmpresa({ nombre, email, celular, serviciosSeleccionados });
        const envioWhatsApp = client.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: EMPRESA_WHATSAPP,
          body: mensajeWhatsapp
        });

        await Promise.all([envioCorreo, envioWhatsApp]);
        console.log('¡Proceso de correo+WhatsApp completado en background!');
      } catch (errBg) {
        console.error('Error en el proceso en segundo plano:', errBg);
        // O podrías registrar un log, pero ya no puedes responder al front (ya enviamos 202).
      }
    });
  } catch (error) {
    console.error('Error al intentar procesar la solicitud:', error);
    // Si algo falla antes de la respuesta, devuelves 500
    return res.status(500).json({ message: 'Error al recibir la solicitud.' });
  }
}


module.exports = {
  enviarContacto
};